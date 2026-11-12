"use client";

import { ConsentFormSchema, ResearchConsentFormSchema } from "@/lib/schema";

const CONSENT_TYPE_LABELS: Record<string, string> = {
  surgical: "SURGICAL",
  anaesthesia: "ANAESTHESIA",
  diagnostic: "DIAGNOSTIC",
  blood_transfusion: "BLOOD TRANSFUSION",
  research: "RESEARCH",
  telemedicine: "TELEMEDICINE",
  minor_procedure: "MINOR PROCEDURE",
  obstetric: "OBSTETRIC",
  psychiatric: "PSYCHIATRIC",
  road_accident_emergency: "ROAD ACCIDENT / EMERGENCY",
};

function InfoBanner() {
  return (
    <div
      role="note"
      className="mb-5 rounded-md px-4 py-3.5 flex gap-3 items-start"
      style={{ backgroundColor: "rgba(190,61,42,0.06)", border: "1px solid rgba(190,61,42,0.25)" }}
    >
      <span className="text-lg leading-none mt-0.5" style={{ color: "var(--red)" }}>&#9888;</span>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        <strong style={{ color: "var(--ink)" }}>Live Structural Preview:</strong> This matches the exact layout of your generated consent form.
        AI will populate the full medico-legal clauses in the sections below when you click Generate.
      </p>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-wider mt-3 mb-1.5 px-2 py-0.5 border-l-[3px] border-[#1e293b] bg-[#f8fafc] text-[#0f172a]">
      {title}
    </div>
  );
}

function AiPlaceholderLines({ lines = 3 }: { lines?: number }) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-3/4"];
  return (
    <div className="space-y-1.5 py-1">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`h-2.5 rounded ${widths[idx % widths.length]}`}
          style={{ backgroundColor: "var(--rule)" }}
        />
      ))}
    </div>
  );
}

interface ConsentPreviewProps {
  data: ConsentFormSchema;
}

export function ConsentPreview({ data }: ConsentPreviewProps) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const consentTypeLabel =
    CONSENT_TYPE_LABELS[data.clinical?.consentType ?? "surgical"] ?? "SURGICAL";

  const titleProcedure = data.clinical?.procedureName?.trim()
    ? data.clinical.procedureName.toUpperCase()
    : `${consentTypeLabel} PROCEDURE`;

  const aadhaar = data.patient?.aadhaarLast4
    ? `XXXX-XXXX-${data.patient.aadhaarLast4}`
    : "—";

  return (
    <div>
      <InfoBanner />
      <div
        className="max-w-3xl mx-auto rounded-md p-6 sm:p-8"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink)" }}
      >
        {/* Hospital Masthead Header (matches ConsentDocument.tsx) */}
        <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-[var(--rule)]">
          <div>
            <p className="font-serif text-base sm:text-lg font-bold leading-tight text-left" style={{ color: "var(--ink)" }}>
              {data.clinical?.hospitalName || "Hospital / Clinic Name"}
            </p>
            <p className="text-[11px] leading-tight text-left mt-0.5" style={{ color: "var(--ink-muted)" }}>
              {data.clinical?.hospitalAddress || "Hospital Address (from Profile)"}
            </p>
          </div>
          <div className="text-right text-[11px] space-y-0.5 shrink-0" style={{ color: "var(--ink-muted)" }}>
            <p>Consent ID: <span className="font-semibold font-mono" style={{ color: "var(--ink)" }}>AUTO-GENERATED</span></p>
            <p>Date & Time: <span className="font-medium" style={{ color: "var(--ink)" }}>{today}</span></p>
          </div>
        </div>

        {/* Dark Title Banner (matches ConsentDocument.tsx) */}
        <div
          className="rounded py-1.5 px-3 mb-2.5 text-center"
          style={{ backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #0f172a" }}
        >
          <p className="font-sans text-xs sm:text-[13px] font-bold tracking-wider uppercase text-white">
            INFORMED CONSENT FORM &mdash; {titleProcedure}
          </p>
        </div>

        {/* Compact 4-Column Identification Grid (matches ConsentDocument.tsx) */}
        <div className="rounded border border-[var(--rule)] text-xs mb-3 overflow-hidden" style={{ backgroundColor: "var(--sheet)" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[var(--rule)]">
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Patient Name</span>
              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{data.patient?.patientName || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Age / Sex</span>
              <span className="text-xs" style={{ color: "var(--ink)" }}>{data.patient?.age || "—"} Yrs / {data.patient?.sex || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>OPD/IPD No.</span>
              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{data.patient?.hospitalOpdIpdNo || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Aadhaar (Last 4)</span>
              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{aadhaar}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Treating Clinician</span>
              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>
                Dr. {data.clinical?.doctorName || "—"}
                {data.clinical?.doctorRegistrationNo && (
                  <span className="font-normal text-[10px]" style={{ color: "var(--ink-muted)" }}> (Reg: {data.clinical.doctorRegistrationNo})</span>
                )}
              </span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Proposed Procedure</span>
              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{data.clinical?.procedureName || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Scheduled Date</span>
              <span className="text-xs" style={{ color: "var(--ink)" }}>{data.clinical?.procedureDate || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Counseling Language</span>
              <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{data.clinical?.counselingLanguage || "English"}</span>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <SectionHeading title="1. PROCEDURE & PURPOSE OF TREATMENT" />
        <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--ink-soft)" }}>
          Procedure: <strong>{data.clinical?.procedureName || "Proposed clinical procedure"}</strong> scheduled on{" "}
          <strong>{data.clinical?.procedureDate || "—"}</strong>. Counseling conducted in{" "}
          <strong>{data.clinical?.counselingLanguage || "English"}</strong>.
        </p>
        <AiPlaceholderLines lines={2} />

        {/* Section 2 */}
        <SectionHeading title="2. DISCLOSED RISKS & POTENTIAL COMPLICATIONS" />
        {data.clinical?.specificRisks ? (
          <p className="text-xs leading-relaxed mb-1.5 whitespace-pre-wrap" style={{ color: "var(--ink-soft)" }}>
            {data.clinical.specificRisks}
          </p>
        ) : (
          <AiPlaceholderLines lines={3} />
        )}

        {/* Section 3 */}
        <SectionHeading title="3. ALTERNATIVES & SPECIFIC AUTHORIZATIONS" />
        <p className="text-xs leading-relaxed mb-1" style={{ color: "var(--ink-soft)" }}>
          {data.clinical?.alternatives
            ? `Alternatives: ${data.clinical.alternatives}`
            : "AI will detail reasonable medical/surgical alternatives and consequences of refusal."}
        </p>
        <ul className="list-disc pl-4 text-[11px] space-y-0.5 mb-2" style={{ color: "var(--ink-muted)" }}>
          <li>Anaesthesia &amp; Blood Transfusion: {data.clauses?.anaesthesia ? "Anaesthesia authorized" : "Standard"} {data.clauses?.bloodTransfusion ? "· Blood transfusion authorized" : ""}</li>
          <li>Tissue Examination &amp; Disposal: {data.clauses?.tissueDisposal ? "Authorized per hospital protocol" : "Not applicable"}</li>
          <li>Photography / Academic Use: {data.clauses?.photographyAcademicUse ? "Patient consents (anonymized)" : "Patient does not consent"}</li>
        </ul>

        {/* Section 4 */}
        <SectionHeading title="4. DECLARATIONS & SIGNATURES" />
        <div className="space-y-2 text-[11px] mt-1.5" style={{ color: "var(--ink-soft)" }}>
          <div>
            <p className="font-semibold" style={{ color: "var(--ink)" }}>4.1 Patient / Authorized Guardian Declaration</p>
            <p className="italic" style={{ color: "var(--ink-muted)" }}>
              &ldquo;I confirm the procedure, risks, and alternatives were explained in {data.clinical?.counselingLanguage || "English"}. Signature: ______________ Name: {data.patient?.patientName || "__________"}&rdquo;
            </p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--ink)" }}>4.2 Attending Clinician / Surgeon Declaration</p>
            <p className="italic" style={{ color: "var(--ink-muted)" }}>
              &ldquo;I certify I explained all material risks and alternatives. Doctor Signature: ______________ Dr. {data.clinical?.doctorName || "__________"} (Reg: {data.clinical?.doctorRegistrationNo || "____"})&rdquo;
            </p>
          </div>
          {data.includeWitnessBlock && (
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>4.3 Witness Declaration</p>
              <p className="italic" style={{ color: "var(--ink-muted)" }}>
                &ldquo;I confirm this consent was explained and executed in my presence. Witness Signature: ______________&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResearchConsentPreviewProps {
  data: ResearchConsentFormSchema;
}

export function ResearchConsentPreview({ data }: ResearchConsentPreviewProps) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <InfoBanner />
      <div
        className="max-w-3xl mx-auto rounded-md p-6 sm:p-8"
        style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)", color: "var(--ink)" }}
      >
        {/* Institution Masthead Header (matches ConsentDocument.tsx) */}
        <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-[var(--rule)]">
          <div>
            <p className="font-serif text-base sm:text-lg font-bold leading-tight text-left" style={{ color: "var(--ink)" }}>
              {data.study?.institutionName || "Institution Name"}
            </p>
            <p className="text-[11px] leading-tight text-left mt-0.5" style={{ color: "var(--ink-muted)" }}>
              {data.study?.institutionAddress || "Institution Address (from Profile)"}
            </p>
          </div>
          <div className="text-right text-[11px] space-y-0.5 shrink-0" style={{ color: "var(--ink-muted)" }}>
            <p>Consent ID: <span className="font-semibold font-mono" style={{ color: "var(--ink)" }}>AUTO-GENERATED</span></p>
            <p>Date & Time: <span className="font-medium" style={{ color: "var(--ink)" }}>{today}</span></p>
          </div>
        </div>

        {/* Dark Title Banner (matches ConsentDocument.tsx) */}
        <div
          className="rounded py-1.5 px-3 mb-2.5 text-center"
          style={{ backgroundColor: "#1e293b", color: "#ffffff", border: "1px solid #0f172a" }}
        >
          <p className="font-sans text-xs sm:text-[13px] font-bold tracking-wider uppercase text-white">
            INFORMED CONSENT FOR RESEARCH: {data.study?.studyTitle?.toUpperCase() || "VOLUNTARY PARTICIPATION"}
          </p>
        </div>

        {/* Compact 4-Column Identification Grid (matches ConsentDocument.tsx) */}
        <div className="rounded border border-[var(--rule)] text-xs mb-3 overflow-hidden" style={{ backgroundColor: "var(--sheet)" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[var(--rule)]">
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Participant Name</span>
              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{data.participant?.participantName || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Participant ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--ink)" }}>{data.participant?.participantId || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Age / Sex</span>
              <span className="text-xs" style={{ color: "var(--ink)" }}>{data.participant?.age || "—"} Yrs / {data.participant?.sex || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Counseling Language</span>
              <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{data.study?.counselingLanguage || "English"}</span>
            </div>
            <div className="p-1.5 col-span-2">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Study Title</span>
              <span className="font-semibold text-xs truncate block" style={{ color: "var(--ink)" }}>{data.study?.studyTitle || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Principal Investigator</span>
              <span className="text-xs truncate block" style={{ color: "var(--ink)" }}>{data.study?.principalInvestigator || "—"}</span>
            </div>
            <div className="p-1.5">
              <span className="block font-mono text-[9px] uppercase font-semibold" style={{ color: "var(--ink-muted)" }}>Department / Contact</span>
              <span className="text-xs truncate block" style={{ color: "var(--ink)" }}>{data.study?.department || "—"} · {data.study?.contactMobile || "—"}</span>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <SectionHeading title="1. STUDY PURPOSE & PROCEDURES" />
        <p className="text-xs leading-relaxed mb-1.5" style={{ color: "var(--ink-soft)" }}>
          {data.study?.studyPurpose || "Study purpose will be generated here."} Time required: <strong>{data.study?.timeRequired || "10-15 minutes"}</strong>.
        </p>

        {/* Section 2 */}
        <SectionHeading title="2. DISCLOSED RISKS, BENEFITS & DATA CONFIDENTIALITY" />
        <p className="text-xs leading-relaxed mb-1.5" style={{ color: "var(--ink-soft)" }}>
          <strong>Risks:</strong> {data.study?.risks || "—"} <br />
          <strong>Benefits:</strong> {data.study?.benefits || "—"}
        </p>

        {/* Section 3 */}
        <SectionHeading title="3. VOLUNTARY PARTICIPATION & RIGHT TO WITHDRAW" />
        <AiPlaceholderLines lines={2} />

        {/* Section 4 */}
        <SectionHeading title="4. DECLARATIONS & SIGNATURES" />
        <div className="space-y-2 text-[11px] mt-1.5" style={{ color: "var(--ink-soft)" }}>
          <div>
            <p className="font-semibold" style={{ color: "var(--ink)" }}>4.1 Participant / Authorized Representative Declaration</p>
            <p className="italic" style={{ color: "var(--ink-muted)" }}>
              &ldquo;I voluntarily agree to participate in this study. Signature: ______________ Name: {data.participant?.participantName || "__________"}&rdquo;
            </p>
          </div>
          {data.includeResearcherDeclaration && (
            <div>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>4.2 Principal Investigator Declaration</p>
              <p className="italic" style={{ color: "var(--ink-muted)" }}>
                &ldquo;I certify I have explained the study in {data.study?.counselingLanguage || "English"}. PI Signature: ______________ {data.study?.principalInvestigator || "__________"}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
