"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Clock,
  Cpu,
  User,
  WarningCircle,
  TerminalWindow,
  Desktop,
  CheckCircle,
  XCircle,
  ArrowLeft
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
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Audit Inspector" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Header title={`Audit UUID: ${auditDetail.id}`} />

        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Back Button */}
          <div>
            <button
              onClick={() => router.push("/generations")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-all bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft weight="bold" />
              <span>Back to generations list</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Diagnostics */}
            <div className="space-y-6 lg:col-span-1">
              {/* Audit Summary Card */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Diagnostic Overview</h3>
                
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><Clock /> Duration</span>
                    <span className="text-xs font-bold font-mono">
                      {auditDetail.generation_duration_ms ? `${(auditDetail.generation_duration_ms / 1000).toFixed(2)}s` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><Cpu /> LLM Model</span>
                    <span className="text-xs font-bold font-mono">{auditDetail.model_used || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><TerminalWindow /> Token Usage</span>
                    <span className="text-xs font-bold font-mono">
                      {auditDetail.prompt_tokens ? `${auditDetail.prompt_tokens} prompt / ${auditDetail.completion_tokens} completion` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1.5"><Desktop /> Origin IP</span>
                    <span className="text-xs font-bold font-mono select-all">{auditDetail.ip_address || "N/A"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-card-border">
                  <p className="text-[10px] uppercase font-bold text-muted mb-1">User Agent</p>
                  <p className="text-[10px] leading-relaxed text-muted break-all font-mono bg-muted-bg/50 p-2.5 rounded-xl border border-card-border/50">
                    {auditDetail.user_agent || "N/A"}
                  </p>
                </div>
              </div>

              {/* Patient and Doctor Details Card */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Audited Entities</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted">Doctor</p>
                    <p className="text-sm font-semibold mt-0.5">{doctorProfile?.doctor_name || "Doctor N/A"}</p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">{doctorProfile?.doctor_registration_no}</p>
                  </div>
                  <div className="pt-3 border-t border-card-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted">Hospital / Institution</p>
                    <p className="text-xs font-semibold mt-0.5">{auditDetail.hospital_name || "N/A"}</p>
                  </div>
                  <div className="pt-3 border-t border-card-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted">Patient Name (Decrypted)</p>
                    <p className="text-sm font-bold text-amber-500 mt-0.5">{decryptedName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Markdown Document Preview / Error Details */}
            <div className="lg:col-span-2 space-y-6">
              {auditDetail.status !== "success" ? (
                <div className="glass-card rounded-2xl p-6 border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-2 text-red-500 mb-3 font-semibold text-sm">
                    <WarningCircle weight="fill" />
                    <span>Generation Failed</span>
                  </div>
                  <p className="text-xs text-red-400 font-mono leading-relaxed bg-black/20 p-4 rounded-xl border border-red-500/10">
                    {auditDetail.error_message || "Unknown error during form generation."}
                  </p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 flex flex-col h-[600px]">
                  <div className="flex items-center justify-between pb-4 border-b border-card-border mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Consent Form Preview</h3>
                    <span className="text-[10px] text-muted">UUID: {auditDetail.consent_history_id?.slice(0, 8)}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto text-xs bg-muted-bg/30 p-5 rounded-2xl border border-card-border/50 font-sans leading-relaxed select-text prose prose-invert">
                    {markdownContent ? (
                      <pre className="whitespace-pre-wrap font-sans text-foreground">{markdownContent}</pre>
                    ) : (
                      <p className="text-muted text-center pt-20">Original generated document text could not be loaded.</p>
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
