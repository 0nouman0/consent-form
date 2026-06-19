import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { consentFormSchema, researchConsentFormSchema } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt, buildResearchSystemPrompt, buildResearchUserPrompt } from "@/lib/prompt";
import { generateConsentId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  
  // ── Authenticate User using official Supabase SSR ──
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const user = session?.user;

  if (sessionError || !user) {
    return Response.json(
      { error: "Unauthorized — no valid session" },
      { status: 401 }
    );
  }

  const token = session.access_token;
  const userId = user.id;

  try {
    // ── Check user's current credit balance and role ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, credits")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return Response.json(
        { error: "Failed to retrieve user profile balance" },
        { status: 500 }
      );
    }

    const role = profile.role || "doctor";
    if (role !== "doctor" && role !== "admin") {
      return Response.json(
        { error: "Forbidden — your role does not have permission to generate forms" },
        { status: 403 }
      );
    }

    const credits = profile.credits ?? 0;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (credits <= 0) {
      // Log credit failure attempt
      await supabase.from("generation_audit").insert({
        user_id: userId,
        consent_id: "none",
        consent_type: "none",
        status: "credit_failed",
        error_message: "Insufficient credits",
        ip_address: clientIp,
        user_agent: userAgent
      });

      return Response.json(
        { error: "Insufficient credits. Please buy credits to generate consent forms." },
        { status: 402 } // Payment Required
      );
    }

    const body = await req.json();

    const isResearch = body && typeof body.study === "object";
    let input: any;
    let consentId: string;
    let systemPrompt: string;
    let userPrompt: string;

    if (isResearch) {
      const parsed = researchConsentFormSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      input = parsed.data;
      consentId = generateConsentId(input.study.institutionName);
      systemPrompt = buildResearchSystemPrompt();
      userPrompt = buildResearchUserPrompt(input, consentId);
    } else {
      const parsed = consentFormSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      input = parsed.data;
      consentId = generateConsentId(input.clinical.hospitalName);
      systemPrompt = buildSystemPrompt();
      userPrompt = buildUserPrompt(input, consentId);
    }

    // Encrypt patient name using security definer RPC
    const patientName = isResearch ? input.participant?.participantName : input.patient?.patientName;
    const encryptionKey = process.env.PATIENT_NAME_ENCRYPTION_KEY || process.env.RAZORPAY_KEY_SECRET || "luffy-default-super-secret-key-123";
    let patientNameEnc = null;

    if (patientName) {
      const { data: encData, error: encErr } = await supabase.rpc("encrypt_patient_name", {
        p_name: patientName,
        p_key: encryptionKey
      });
      if (!encErr && encData) {
        patientNameEnc = encData;
      } else {
        console.error("Encryption failed:", encErr);
      }
    }

    // Insert generation_audit in-progress row
    const startTime = Date.now();
    const { data: auditRow, error: auditError } = await supabase
      .from("generation_audit")
      .insert({
        user_id: userId,
        consent_id: consentId,
        consent_type: isResearch ? "research" : "clinical",
        sub_type: isResearch ? "research" : input.clinical.consentType,
        patient_name_enc: patientNameEnc,
        hospital_name: isResearch ? input.study.institutionName : input.clinical.hospitalName,
        model_used: "llama-3.3-70b-versatile",
        ip_address: clientIp,
        user_agent: userAgent,
        status: "in_progress",
        metadata: {
          age: isResearch ? input.participant?.age : input.patient?.age,
          sex: isResearch ? input.participant?.sex : input.patient?.sex,
          counselingLanguage: isResearch ? input.study?.counselingLanguage : input.clinical?.counselingLanguage,
          languageLevel: isResearch ? "standard" : input.languageLevel
        }
      })
      .select("id")
      .single();

    const auditId = auditRow?.id;
    if (auditError) {
      console.error("Failed to insert generation_audit row:", auditError);
    }

    // Create Groq client — API key from server environment only
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      temperature: 0.15,
      max_tokens: 4000,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    // Stream response back to client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // First chunk: send consent ID so client can capture it
        controller.enqueue(
          encoder.encode(`__CONSENT_ID__${consentId}__END_ID__\n`)
        );
        let accumulatedText = "";
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              accumulatedText += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          // Stream completed successfully! Deduct credit.
          const deductRes = await fetch(
            `${supabaseUrl}/rest/v1/rpc/deduct_credit`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: supabaseKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                p_user_id: userId,
                p_reference_id: consentId,
              }),
            }
          );

          let creditHistId = null;
          if (deductRes.ok) {
            // Retrieve credit history ID
            const { data: creditHist } = await supabase
              .from("credit_history")
              .select("id")
              .eq("user_id", userId)
              .eq("reference_id", consentId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            if (creditHist) {
              creditHistId = creditHist.id;
            }
          } else {
            console.error("Failed to deduct credit after successful generation:", await deductRes.text());
          }

          // Estimate token count
          const promptCharEst = userPrompt.length + systemPrompt.length;
          const promptTokensEst = Math.round(promptCharEst / 4);
          const completionTokensEst = Math.round(accumulatedText.length / 4);
          const duration = Date.now() - startTime;

          if (auditId) {
            await supabase
              .from("generation_audit")
              .update({
                status: deductRes.ok ? "success" : "credit_failed",
                credits_deducted: deductRes.ok ? 1 : 0,
                generation_duration_ms: duration,
                credit_history_id: creditHistId,
                prompt_tokens: promptTokensEst,
                completion_tokens: completionTokensEst,
                error_message: deductRes.ok ? null : "Credit deduction failed"
              })
              .eq("id", auditId);
          }
        } catch (streamErr: any) {
          console.error("Error during stream generation:", streamErr);
          if (auditId) {
            await supabase
              .from("generation_audit")
              .update({
                status: "failed",
                error_message: streamErr?.message || String(streamErr)
              })
              .eq("id", auditId);
          }
        } finally {
          controller.close();
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
      { error: error?.message || "Failed to generate consent form. Please try again." },
      { status: 500 }
    );
  }
}