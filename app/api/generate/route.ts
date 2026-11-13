import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { consentFormSchema, researchConsentFormSchema } from "@/lib/schema";
import { generateConsentId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { reserveCredit, settleFailure, settleSuccess, type Reservation } from "@/lib/billing";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  CLAUSE_LIBRARY_STATUS,
  CLAUSE_LIBRARY_VERSION,
  LANG_SEPARATOR,
  buildProcedureContentPrompt,
  buildTranslationPrompt,
  composeClinicalMarkdown,
  composeResearchMarkdown,
  fallbackProcedureContent,
  parseProcedureContent,
  verifyClauses,
  type ProcedureContent,
} from "@/lib/consent-template";

import { assessTranslation } from "@/lib/translation-quality";

export const maxDuration = 60;

const CONTENT_MODEL = process.env.GROQ_CONTENT_MODEL || "openai/gpt-oss-120b";
const TRANSLATION_MODEL = process.env.GROQ_TRANSLATION_MODEL || "openai/gpt-oss-120b";

// Per-user limits. The in-memory limiter stops bursts; the DB counts below hold across server instances.
const BURST_LIMIT = 8; // requests per minute (in-memory)
const MAX_PER_MINUTE = 6; // generations started in the last 60s (database)
const MAX_CONCURRENT = 2; // generations in progress in the last 3 minutes (database)

function chunkText(text: string, size = 600): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // ── Authenticate: getUser() verifies the token with Supabase (getSession() only reads the cookie) ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized — no valid session" }, { status: 401 });
  }
  const userId = user.id;

  const burst = rateLimit(`generate:${userId}`, BURST_LIMIT, 60_000);
  if (!burst.ok) return tooManyRequests(burst.retryAfter, "You are generating too quickly. Please wait a moment.");

  try {
    // ── Role and balance (cheap pre-check; the real charge happens atomically in reserveCredit) ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return Response.json({ error: "Failed to retrieve user profile balance" }, { status: 500 });
    }

    const role = profile.role || "doctor";
    if (role !== "doctor" && role !== "admin") {
      return Response.json(
        { error: "Forbidden — your role does not have permission to generate forms" },
        { status: 403 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    if ((profile.credits ?? 0) <= 0) {
      await supabase.from("generation_audit").insert({
        user_id: userId,
        consent_id: "none",
        consent_type: "none",
        status: "credit_failed",
        error_message: "Insufficient credits",
        ip_address: clientIp,
        user_agent: userAgent,
      });
      return Response.json(
        { error: "Insufficient credits. Please buy credits to generate consent forms." },
        { status: 402 }
      );
    }

    // ── Database-backed limits: hold across serverless instances ──
    try {
      const minuteAgo = new Date(Date.now() - 60_000).toISOString();
      const threeMinAgo = new Date(Date.now() - 180_000).toISOString();
      const [recent, running] = await Promise.all([
        supabase.from("generation_audit").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", minuteAgo),
        supabase.from("generation_audit").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "in_progress").gte("created_at", threeMinAgo),
      ]);
      if ((recent.count ?? 0) >= MAX_PER_MINUTE) return tooManyRequests(30, "Too many forms generated in the last minute. Please wait a little.");
      if ((running.count ?? 0) >= MAX_CONCURRENT) return tooManyRequests(15, "Two forms are already being generated. Please wait for them to finish.");
    } catch (limitErr) {
      console.warn("generate: DB rate-limit check skipped", limitErr);
    }

    // ── Validate the request ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const isResearch = body && typeof body.study === "object";
    let input: any;
    let consentId: string;

    if (isResearch) {
      const parsed = researchConsentFormSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
      }
      input = parsed.data;
      consentId = generateConsentId(input.study.institutionName);
    } else {
      const parsed = consentFormSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
      }
      input = parsed.data;
      consentId = generateConsentId(input.clinical.hospitalName);
    }

    // ── Reserve the credit BEFORE doing any billable work ──
    const reserved = await reserveCredit(userId, consentId);
    if (!reserved.ok) {
      return Response.json({ error: reserved.error }, { status: reserved.status });
    }
    const reservation: Reservation = reserved.reservation;

    // From here on every failure path must give the credit back.
    let auditId: string | undefined;
    try {
      // Encrypt the patient name (never stored in clear in the audit trail)
      const patientName = isResearch ? input.participant?.participantName : input.patient?.patientName;
      const encryptionKey = process.env.PATIENT_NAME_ENCRYPTION_KEY;
      let patientNameEnc = null;

      if (patientName && !encryptionKey) {
        console.error("PATIENT_NAME_ENCRYPTION_KEY is not set — patient name will not be stored");
      }
      if (patientName && encryptionKey) {
        const { data: encData, error: encErr } = await supabase.rpc("encrypt_patient_name", {
          p_name: patientName,
          p_key: encryptionKey,
        });
        if (!encErr && encData) patientNameEnc = encData;
        else console.error("Encryption failed:", encErr);
      }

      const counselingLanguage: string = isResearch ? input.study.counselingLanguage : input.clinical.counselingLanguage;

      const { data: auditRow, error: auditError } = await supabase
        .from("generation_audit")
        .insert({
          user_id: userId,
          consent_id: consentId,
          consent_type: isResearch ? "research" : "clinical",
          sub_type: isResearch ? "research" : input.clinical.consentType,
          patient_name_enc: patientNameEnc,
          hospital_name: isResearch ? input.study.institutionName : input.clinical.hospitalName,
          model_used: isResearch ? TRANSLATION_MODEL : CONTENT_MODEL,
          ip_address: clientIp,
          user_agent: userAgent,
          status: "in_progress",
          credits_deducted: reservation.mode === "reserved" ? 1 : 0,
          metadata: {
            age: isResearch ? input.participant?.age : input.patient?.age,
            sex: isResearch ? input.participant?.sex : input.patient?.sex,
            counselingLanguage,
            languageLevel: isResearch ? "standard" : input.languageLevel,
            clauseLibraryVersion: CLAUSE_LIBRARY_VERSION,
            clauseLibraryStatus: CLAUSE_LIBRARY_STATUS,
            billingMode: reservation.mode,
          },
        })
        .select("id")
        .single();

      auditId = auditRow?.id;
      if (auditError) console.error("Failed to insert generation_audit row:", auditError);
    } catch (setupErr) {
      await settleFailure(reservation);
      throw setupErr;
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const startTime = Date.now();
    const encoder = new TextEncoder();

    const updateAudit = async (patch: Record<string, unknown>) => {
      if (!auditId) return;
      try {
        // service role: the audit row must be updatable even if the user's session expired mid-stream
        const db = hasServiceRole() ? createAdminClient() : supabase;
        await db.from("generation_audit").update(patch).eq("id", auditId);
      } catch (e) {
        console.error("generate: audit update failed", e);
      }
    };

    const readable = new ReadableStream({
      async start(controller) {
        let promptTokens = 0;
        let completionTokens = 0;
        let contentSource: "model" | "clinician_text" | "n/a" = "n/a";
        let translation: "none" | "verified" | "client_fallback" = "none";
        let translationIssues: string[] = [];

        try {
          // First chunk: consent ID so the client can capture it
          controller.enqueue(encoder.encode(`__CONSENT_ID__${consentId}__END_ID__\n`));

          // ── 1. Build the English form from approved clause text ──
          let englishMd: string;

          if (isResearch) {
            englishMd = composeResearchMarkdown(input);
          } else {
            const prompt = buildProcedureContentPrompt(input);
            let content: ProcedureContent | null = null;

            for (let attempt = 0; attempt < 2 && !content; attempt++) {
              try {
                const completion = await groq.chat.completions.create(
                  {
                    model: CONTENT_MODEL,
                    messages: [
                      { role: "system", content: prompt.system },
                      { role: "user", content: prompt.user },
                    ],
                    temperature: 0.1,
                    max_tokens: 2500,
                    stream: false,
                  },
                  { timeout: 45_000, maxRetries: 0 }
                );
                promptTokens += completion.usage?.prompt_tokens ?? 0;
                completionTokens += completion.usage?.completion_tokens ?? 0;
                content = parseProcedureContent(completion.choices[0]?.message?.content ?? "", input);
                if (!content) console.warn(`generate: model returned unusable JSON (attempt ${attempt + 1})`);
              } catch (modelErr) {
                console.warn(`generate: content call failed (attempt ${attempt + 1})`, modelErr);
              }
            }

            // Model unavailable or unusable: the form is still complete and legally correct, built from the
            // approved clause text plus the clinician's own wording, so generation still succeeds.
            if (!content) content = fallbackProcedureContent(input);
            contentSource = content.source;

            englishMd = composeClinicalMarkdown(input, content);

            const check = verifyClauses(englishMd, input.clinical.consentType);
            if (check.missing.length) {
              throw new Error(`Generated form is missing required clauses: ${check.missing.join(", ")}`);
            }
          }

          for (const piece of chunkText(englishMd)) controller.enqueue(encoder.encode(piece));

          // ── 2. Counselling-language copy (translation of the finished English form) ──
          if (counselingLanguageOf(input, isResearch) !== "English") {
            const lang = counselingLanguageOf(input, isResearch);
            const protectedTerms = protectedTermsOf(input, isResearch);

            // The translation is checked BEFORE it is released: it must be complete, in the right script and
            // structurally identical. One stricter retry; if it still fails the patient is not given a
            // half-English "translation" — the English form stands and the app translates client-side as before.
            let accepted: string | null = null;
            let lastIssues: string[] = [];
            for (let attempt = 0; attempt < 2 && !accepted; attempt++) {
              const tp = buildTranslationPrompt(englishMd, lang, { strict: attempt > 0 });
              try {
                const completion = await withRateLimitRetry(() =>
                  groq.chat.completions.create(
                    {
                      model: TRANSLATION_MODEL,
                      messages: [
                        { role: "system", content: tp.system },
                        { role: "user", content: tp.user },
                      ],
                      temperature: 0.1,
                      max_tokens: 8000,
                      stream: false,
                    },
                    { timeout: 90_000, maxRetries: 0 }
                  )
                );
                promptTokens += completion.usage?.prompt_tokens ?? Math.round((tp.system.length + tp.user.length) / 4);
                completionTokens += completion.usage?.completion_tokens ?? 0;
                const text = (completion.choices[0]?.message?.content ?? "").trim();
                const quality = assessTranslation(englishMd, text, lang, protectedTerms);
                if (quality.ok) accepted = text;
                else {
                  lastIssues = quality.issues;
                  console.warn(`generate: ${lang} translation rejected (attempt ${attempt + 1}): ${quality.issues.join("; ")}`);
                }
              } catch (translateErr) {
                lastIssues = [String((translateErr as Error)?.message || translateErr).slice(0, 160)];
                console.warn(`generate: ${lang} translation call failed (attempt ${attempt + 1})`, translateErr);
              }
            }

            if (accepted) {
              controller.enqueue(encoder.encode(`\n${LANG_SEPARATOR}\n`));
              for (const piece of chunkText(accepted)) controller.enqueue(encoder.encode(piece));
              translation = "verified";
            } else {
              translation = "client_fallback";
              translationIssues = lastIssues;
            }
          }

          // ── 3. Settle billing and the audit trail ──
          const settled = await settleSuccess(reservation);

          let creditHistId: string | null = null;
          if (settled.charged) {
            const { data: hist } = await supabase
              .from("credit_history")
              .select("id")
              .eq("user_id", userId)
              .eq("reference_id", consentId)
              .eq("action", "generation_spend")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            creditHistId = hist?.id ?? null;
          }

          await updateAudit({
            status: settled.charged ? "success" : "credit_failed",
            credits_deducted: settled.charged ? 1 : 0,
            generation_duration_ms: Date.now() - startTime,
            credit_history_id: creditHistId,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            error_message: settled.charged ? null : "Credit deduction failed",
            metadata: {
              age: isResearch ? input.participant?.age : input.patient?.age,
              sex: isResearch ? input.participant?.sex : input.patient?.sex,
              counselingLanguage: counselingLanguageOf(input, isResearch),
              languageLevel: isResearch ? "standard" : input.languageLevel,
              clauseLibraryVersion: CLAUSE_LIBRARY_VERSION,
              clauseLibraryStatus: CLAUSE_LIBRARY_STATUS,
              billingMode: reservation.mode,
              contentSource,
              translation,
              ...(translationIssues.length ? { translationIssues } : {}),
            },
          });

          controller.close();
        } catch (err: any) {
          console.error("Error during generation:", err);
          const { refunded } = await settleFailure(reservation);
          await updateAudit({
            status: "failed",
            credits_deducted: reservation.mode === "reserved" && !refunded ? 1 : 0,
            generation_duration_ms: Date.now() - startTime,
            error_message: String(err?.message || err).slice(0, 500),
          });
          try {
            controller.error(err);
          } catch {
            /* controller already closed by a client disconnect */
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    return Response.json(
      { error: "Failed to generate consent form. Please try again." },
      { status: 500 }
    );
  }
}

function counselingLanguageOf(input: any, isResearch: boolean): string {
  return isResearch ? input.study.counselingLanguage : input.clinical.counselingLanguage;
}

/** Names and identifiers that legitimately stay in English inside a translated form. */
function protectedTermsOf(input: any, isResearch: boolean): string[] {
  if (isResearch) {
    const s = input.study ?? {};
    return [s.institutionName, s.studyTitle, s.principalInvestigator, s.department, input.participant?.participantName].filter(Boolean);
  }
  const c = input.clinical ?? {};
  return [c.procedureName, c.diagnosis, c.hospitalName, c.doctorName, c.doctorRegistrationNo, input.patient?.patientName, input.patient?.guardianName].filter(Boolean);
}

/**
 * The model provider limits tokens per minute (8,000 on the current plan: one Indian-language translation uses
 * about 5,000). On a 429 wait for the time it asks for (max 20s) and try once more.
 */
async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status !== 429) throw err;
    const hinted = /try again in ([\d.]+)s/i.exec(String(err?.message ?? ""));
    const waitS = Math.min(20, Math.ceil(Number(hinted?.[1] ?? 10)) + 1);
    console.warn(`generate: model rate limit reached, retrying in ${waitS}s`);
    await new Promise((r) => setTimeout(r, waitS * 1000));
    return fn();
  }
}
