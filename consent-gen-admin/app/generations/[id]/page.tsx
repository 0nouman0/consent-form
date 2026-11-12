"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Cpu,
  TerminalWindow,
  Desktop,
  WarningCircle,
  ArrowLeft,
  FileText,
  User,
} from "@phosphor-icons/react";

export default function GenerationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [auditDetail, setAuditDetail] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [decryptedName, setDecryptedName] = useState<string>("Loading...");
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuditDetail() {
      try {
        // Fetch generation audit
        const { data: audit, error: aErr } = await supabase
          .from("generation_audit")
          .select("*")
          .eq("id", id)
          .single();

        if (aErr || !audit) {
          router.push("/generations");
          return;
        }

        setAuditDetail(audit);

        // Fetch Doctor Profile
        const { data: doctor } = await supabase
          .from("profiles")
          .select("doctor_name, hospital_name, doctor_registration_no")
          .eq("id", audit.user_id)
          .single();
        if (doctor) setDoctorProfile(doctor);

        // Fetch original markdown if consent_history_id exists
        if (audit.consent_history_id) {
          const { data: hist } = await supabase
            .from("consent_history")
            .select("markdown")
            .eq("id", audit.consent_history_id)
            .single();
          if (hist) setMarkdownContent(hist.markdown);
        }

        // Call decryption API
        if (audit.patient_name_enc) {
          const decryptRes = await fetch("/api/decrypt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ patient_name_enc: audit.patient_name_enc }),
          });

          if (decryptRes.ok) {
            const decryptData = await decryptRes.json();
            setDecryptedName(decryptData.decrypted || "Unknown / Encrypted");
          } else {
            setDecryptedName("Decryption Failed / Key Mismatch");
          }
        } else {
          setDecryptedName("No Patient Name Recorded");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading audit detail page:", err);
        setLoading(false);
      }
    }

    if (id) loadAuditDetail();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Audit Inspector" />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
              Loading Generation Trace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body" style={{ backgroundColor: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header title={`Audit: ${auditDetail.id.slice(0, 18)}...`} subtitle="Diagnostic Telemetry Inspection" />

        <main className="p-3 sm:p-4 md:p-6 space-y-4 max-w-7xl w-full mx-auto pb-16">
          {/* Back Button */}
          <div>
            <button
              onClick={() => router.push("/generations")}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-all hover:opacity-75 cursor-pointer"
              style={{ color: "var(--ink)" }}
            >
              <ArrowLeft weight="bold" />
              <span>Back to generations list</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column: Diagnostics */}
            <div className="space-y-4 lg:col-span-1">
              {/* Audit Summary Card */}
              <div
                className="rounded-md p-5 space-y-4"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <h3 className="font-serif text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Diagnostic Telemetry
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                      <Clock /> Latency
                    </span>
                    <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                      {auditDetail.generation_duration_ms ? `${(auditDetail.generation_duration_ms / 1000).toFixed(2)}s` : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                      <Cpu /> LLM Model
                    </span>
                    <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                      {auditDetail.model_used || "groq/llama-3.3-70b"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                      <TerminalWindow /> Token Usage
                    </span>
                    <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>
                      {auditDetail.prompt_tokens ? `${auditDetail.prompt_tokens} / ${auditDetail.completion_tokens}` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
                      <Desktop /> Origin IP
                    </span>
                    <span className="font-mono font-bold select-all" style={{ color: "var(--ink)" }}>
                      {auditDetail.ip_address || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="pt-3" style={{ borderTop: "1px solid var(--rule)" }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold mb-1" style={{ color: "var(--ink-muted)" }}>
                    User Agent
                  </p>
                  <p
                    className="text-[10px] leading-relaxed break-all font-mono p-2.5 rounded"
                    style={{
                      backgroundColor: "var(--paper)",
                      border: "1px solid var(--rule)",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {auditDetail.user_agent || "N/A"}
                  </p>
                </div>
              </div>

              {/* Patient and Doctor Details Card */}
              <div
                className="rounded-md p-5 space-y-4"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <h3 className="font-serif text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Audited Entities
                </h3>

                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                      Doctor Name
                    </p>
                    <p className="font-serif font-bold text-sm mt-0.5" style={{ color: "var(--ink)" }}>
                      {doctorProfile?.doctor_name || "Doctor N/A"}
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      Reg: {doctorProfile?.doctor_registration_no || "N/A"}
                    </p>
                  </div>

                  <div className="pt-2" style={{ borderTop: "1px solid var(--rule-soft)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                      Hospital / Institution
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "var(--ink)" }}>
                      {auditDetail.hospital_name || "N/A"}
                    </p>
                  </div>

                  <div className="pt-2" style={{ borderTop: "1px solid var(--rule-soft)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                      Patient Name (Decrypted via KMS)
                    </p>
                    <p className="font-serif font-bold text-sm mt-0.5" style={{ color: "var(--red)" }}>
                      {decryptedName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Markdown Document Preview / Error Details */}
            <div className="lg:col-span-2 space-y-4">
              {auditDetail.status !== "success" ? (
                <div
                  className="rounded-md p-6"
                  style={{
                    backgroundColor: "rgba(190, 61, 42, 0.05)",
                    border: "1px solid rgba(190, 61, 42, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 font-semibold text-sm" style={{ color: "var(--red)" }}>
                    <WarningCircle weight="fill" className="w-4 h-4" />
                    <span>Generation Failed</span>
                  </div>
                  <p
                    className="text-xs font-mono leading-relaxed p-4 rounded"
                    style={{
                      backgroundColor: "var(--sheet)",
                      border: "1px solid rgba(190, 61, 42, 0.15)",
                      color: "var(--red)",
                    }}
                  >
                    {auditDetail.error_message || "Unknown error during form generation."}
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-md p-6 flex flex-col h-[600px]"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                >
                  <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: "1px solid var(--rule)" }}>
                    <div>
                      <h3 className="font-serif text-base font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                        Generated Document Output
                      </h3>
                      <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
                        Consent Form ID: {auditDetail.consent_history_id?.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto text-xs p-5 rounded font-sans leading-relaxed select-text"
                    style={{
                      backgroundColor: "var(--paper)",
                      border: "1px solid var(--rule)",
                      color: "var(--ink)",
                    }}
                  >
                    {markdownContent ? (
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed" style={{ color: "var(--ink)" }}>
                        {markdownContent}
                      </pre>
                    ) : (
                      <p className="text-center pt-24 font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
                        Original generated document text could not be loaded.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
