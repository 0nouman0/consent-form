"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  User,
  IdentificationBadge,
  Buildings,
  MapPin,
  FileText,
  Translate,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  SignOut,
  Sparkle,
  SealCheck,
  Stethoscope,
} from "@phosphor-icons/react/dist/ssr";

const SPECIALTIES = [
  "General Surgery",
  "Orthopaedics & Joint Replacement",
  "Obstetrics & Gynaecology",
  "Cardiology & Cardiac Surgery",
  "Anaesthesia & Critical Care",
  "Neurosurgery & Neurology",
  "Paediatrics & Neonatology",
  "Ophthalmology",
  "ENT & Head-Neck Surgery",
  "Oncology & Surgical Oncology",
  "Urology & Nephrology",
  "Dermatology & Cosmetology",
  "Emergency Medicine",
  "Internal Medicine",
  "Radiology & Interventional",
  "Other Specialty",
];

const COUNCILS = [
  "National Medical Commission (NMC / MCI)",
  "Delhi Medical Council (DMC)",
  "Maharashtra Medical Council (MMC)",
  "Karnataka Medical Council (KMC)",
  "Tamil Nadu Medical Council (TNMC)",
  "Telangana State Medical Council",
  "Andhra Pradesh Medical Council",
  "West Bengal Medical Council",
  "Gujarat Medical Council",
  "Uttar Pradesh Medical Council",
  "Kerala Medical Council",
  "Punjab Medical Council",
  "Rajasthan Medical Council",
  "Other State Medical Council",
];

const CONSENT_TYPES = [
  { id: "surgical", label: "Surgical & Operative Consent", desc: "Major & minor operations, tissue excision, invasive procedures" },
  { id: "anaesthesia", label: "Anaesthesia & Sedation Consent", desc: "General, spinal, epidural, and regional nerve blocks" },
  { id: "diagnostic", label: "Diagnostic & Interventional Consent", desc: "Endoscopy, biopsy, catheterization, contrast imaging" },
  { id: "blood_transfusion", label: "Blood Transfusion Consent", desc: "Whole blood, PRBCs, platelets, and plasma derivatives" },
  { id: "minor_procedure", label: "Minor Clinical Procedure Consent", desc: "I&D, suturing, foreign body removal, local excisions" },
];

const LANGUAGES = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu", 
  "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia", "Urdu"
];

function OnboardingContent() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    doctorName: "",
    doctorRegistrationNo: "",
    medicalCouncil: "National Medical Commission (NMC / MCI)",
    specialty: "General Surgery",
    hospitalName: "",
    hospitalAddress: "",
    billingAddress: "",
    sameAddress: true,
    defaultConsentType: "surgical",
    defaultLanguageLevel: "standard",
    primaryLanguage: "English",
  });

  // Verify auth session on load
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/onboarding");
        return;
      }
      setUserEmail(user.email || "");
      setUserId(user.id);

      // Check if profile already exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData((prev) => ({
          ...prev,
          doctorName: profile.doctor_name || "",
          doctorRegistrationNo: profile.doctor_registration_no || "",
          hospitalName: profile.hospital_name || "",
          hospitalAddress: profile.hospital_address || "",
          billingAddress: profile.billing_address || "",
          sameAddress: !profile.billing_address || profile.billing_address === profile.hospital_address,
          defaultConsentType: profile.default_consent_type || "surgical",
          defaultLanguageLevel: profile.default_language_level || "standard",
        }));
      }

      setLoading(false);
    }
    checkAuth();
  }, [router, supabase]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.doctorName.trim() || formData.doctorName.trim().length < 3) {
      setErrorMsg("Please enter your full legal clinician name (e.g. Dr. Rajesh Kumar, MS).");
      return;
    }
    if (!formData.doctorRegistrationNo.trim() || formData.doctorRegistrationNo.trim().length < 3) {
      setErrorMsg("Please provide your official Medical Registration Number (IMC / NMC / State Council).");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.hospitalName.trim() || formData.hospitalName.trim().length < 2) {
      setErrorMsg("Please provide your primary hospital or clinical institution name.");
      return;
    }
    if (!formData.hospitalAddress.trim() || formData.hospitalAddress.trim().length < 5) {
      setErrorMsg("Please provide the full physical address of the institution.");
      return;
    }
    setStep(3);
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const finalBillingAddress = formData.sameAddress ? formData.hospitalAddress : formData.billingAddress;

      const profilePayload = {
        id: userId,
        doctor_name: formData.doctorName.trim(),
        doctor_registration_no: formData.doctorRegistrationNo.trim(),
        hospital_name: formData.hospitalName.trim(),
        hospital_address: formData.hospitalAddress.trim(),
        billing_address: finalBillingAddress.trim(),
        default_consent_type: formData.defaultConsentType,
        default_language_level: formData.defaultLanguageLevel,
        updated_at: new Date().toISOString(),
      };

      // Upsert into Supabase profiles
      const { error } = await supabase.from("profiles").upsert(profilePayload);
      if (error) throw error;

      // Cache locally for instant auto-fill in consent wizard
      localStorage.setItem("consentgen_doctor_profile", JSON.stringify({
        doctorName: formData.doctorName.trim(),
        doctorRegistrationNo: formData.doctorRegistrationNo.trim(),
        hospitalName: formData.hospitalName.trim(),
        hospitalAddress: formData.hospitalAddress.trim(),
        billingAddress: finalBillingAddress.trim(),
      }));

      // Set cookie for middleware instant bypass
      document.cookie = "consentgen_onboarded=1; path=/; max-age=2592000; SameSite=Lax";

      // Move to step 4 (Celebration / Success)
      setStep(4);
    } catch (err: any) {
      console.error("Onboarding submission failed:", err);
      setErrorMsg(err?.message || "Failed to save profile. Please verify your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: "var(--paper)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
          />
          <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
            Loading Clinical Setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-body selection:bg-[#BE3D2A]/10 selection:text-[#BE3D2A]" style={{ backgroundColor: "var(--paper)" }}>
      {/* ── Top Navigation Bar ── */}
      <header
        className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0"
        style={{
          backgroundColor: "var(--sheet)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--ink)" }}
          >
            <ShieldCheck weight="bold" className="w-4 h-4" style={{ color: "var(--sheet)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base tracking-tight" style={{ color: "var(--ink)" }}>
                ConsentGen
              </span>
              <span
                className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(190, 61, 42, 0.08)", color: "var(--red)" }}
              >
                Clinician Onboarding
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block font-mono text-xs" style={{ color: "var(--ink-muted)" }}>
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] transition-colors hover:bg-black/5 cursor-pointer"
            style={{ color: "var(--ink-muted)", border: "1px solid var(--rule)" }}
            title="Sign out of current account"
          >
            <SignOut className="w-3.5 h-3.5" weight="bold" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {step < 4 && (
          <div className="mb-8">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between max-w-md mx-auto mb-6">
              {[
                { s: 1, label: "Identity" },
                { s: 2, label: "Institution" },
                { s: 3, label: "Verification" },
              ].map((item, idx) => {
                const isCurrent = step === item.s;
                const isPassed = step > item.s;
                return (
                  <div key={item.s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all"
                        style={{
                          backgroundColor: isPassed
                            ? "var(--ink)"
                            : isCurrent
                            ? "var(--red)"
                            : "var(--sheet)",
                          color: isPassed || isCurrent ? "var(--sheet)" : "var(--ink-muted)",
                          border: isPassed || isCurrent ? "none" : "1px solid var(--rule)",
                        }}
                      >
                        {isPassed ? <CheckCircle weight="fill" className="w-4 h-4 text-emerald-400" /> : item.s}
                      </div>
                      <span
                        className="text-[10px] font-mono uppercase tracking-[0.08em] mt-1.5 font-semibold"
                        style={{ color: isCurrent ? "var(--ink)" : "var(--ink-muted)" }}
                      >
                        {item.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className="flex-1 h-[2px] mx-2 -mt-4 transition-colors"
                        style={{
                          backgroundColor: step > idx + 1 ? "var(--ink)" : "var(--rule)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center max-w-xl mx-auto">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] font-semibold mb-1" style={{ color: "var(--red)" }}>
                Step {step} of 3 • Medico-Legal Registration
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                {step === 1 && "Clinician identity & council credentials"}
                {step === 2 && "Hospital & clinical practice details"}
                {step === 3 && "Medico-legal documentation defaults"}
              </h1>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {step === 1 && "Under IMC Regulations (Cl. 7.16) and NMC guidelines, valid informed consent requires explicit practitioner identification."}
                {step === 2 && "Specify your primary healthcare facility. These institutional details will appear on patient consent forms and audit logs."}
                {step === 3 && "Review your official medico-legal header seal and choose your standard consent drafting preferences."}
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div
            className="max-w-xl mx-auto w-full mb-6 p-3.5 rounded-md text-xs flex items-center gap-2.5 font-mono"
            style={{
              backgroundColor: "rgba(190, 61, 42, 0.08)",
              border: "1px solid rgba(190, 61, 42, 0.25)",
              color: "var(--red)",
            }}
          >
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: PRACTITIONER IDENTITY ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <form
                onSubmit={handleNextStep1}
                className="rounded-md p-6 sm:p-8 space-y-5"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div>
                  <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                    Full Legal Clinician Name <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Aakash Sharma, MS, MCh"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-xs outline-none transition-all"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--ink-muted)" }}>
                    Include prefix (Dr.) and postgraduate qualifications as registered with the Council.
                  </p>
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                    Medical Registration Number <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <div className="relative">
                    <IdentificationBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. KMC/2018/004821 or MCI-54321"
                      value={formData.doctorRegistrationNo}
                      onChange={(e) => setFormData({ ...formData, doctorRegistrationNo: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-xs font-mono outline-none transition-all uppercase"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--ink-muted)" }}>
                    Mandatory for medico-legal admissibility under Section 26 of the BNS 2023.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                      Medical Council
                    </label>
                    <select
                      value={formData.medicalCouncil}
                      onChange={(e) => setFormData({ ...formData, medicalCouncil: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-md text-xs font-sans outline-none cursor-pointer"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    >
                      {COUNCILS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                      Primary Specialty
                    </label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-md text-xs font-sans outline-none cursor-pointer"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    >
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
                  >
                    <span>Continue to Institution</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </div>
              </form>
            </div>

            {/* Live Medico-Legal Preview Column */}
            <div className="lg:col-span-5">
              <div
                className="rounded-md p-6 relative overflow-hidden"
                style={{
                  backgroundColor: "var(--sheet)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "var(--rule)" }}>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Document Stamp Preview
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700">
                    <SealCheck weight="fill" className="w-3.5 h-3.5" /> IMC Compliant
                  </span>
                </div>

                <div
                  className="p-5 rounded border-2 border-dashed transition-all"
                  style={{
                    backgroundColor: "var(--paper)",
                    borderColor: "var(--rule)",
                  }}
                >
                  <p className="font-serif font-bold text-lg leading-tight" style={{ color: "var(--ink)" }}>
                    {formData.doctorName || "Dr. [Full Clinician Name]"}
                  </p>
                  <p className="font-mono text-xs font-semibold mt-1" style={{ color: "var(--red)" }}>
                    Reg No: {formData.doctorRegistrationNo || "MCI-XXXXXX"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                    Specialist in {formData.specialty}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {formData.medicalCouncil}
                  </p>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--rule-soft)" }}>
                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-60" style={{ color: "var(--ink)" }}>
                      ConsentGen Digital Seal
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 font-bold">
                      Verified Practitioner
                    </span>
                  </div>
                </div>

                <p className="text-[11px] mt-4 leading-relaxed font-sans" style={{ color: "var(--ink-muted)" }}>
                  This official clinical identity is automatically attached to the authorization clause of all consent forms you generate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: INSTITUTION & PRACTICE ── */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <form
                onSubmit={handleNextStep2}
                className="rounded-md p-6 sm:p-8 space-y-5"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div>
                  <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                    Hospital / Clinical Practice Name <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <div className="relative">
                    <Buildings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Speciality Hospital / City Health Centre"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-xs outline-none transition-all"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                    Hospital Physical Address <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4" style={{ color: "var(--ink-muted)" }} />
                    <textarea
                      required
                      rows={3}
                      placeholder="Street, Department/Ward, City, State, PIN Code"
                      value={formData.hospitalAddress}
                      onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-md text-xs outline-none transition-all leading-relaxed"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                </div>

                {/* Billing Address Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.sameAddress}
                      onChange={(e) => setFormData({ ...formData, sameAddress: e.target.checked })}
                      className="rounded accent-[#BE3D2A] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>
                      Billing address is identical to hospital physical address
                    </span>
                  </label>
                </div>

                {!formData.sameAddress && (
                  <div>
                    <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                      Separate Billing Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Registered billing address for subscription tax invoices"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-md text-xs outline-none transition-all leading-relaxed"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--rule)" }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-75 cursor-pointer"
                    style={{ color: "var(--ink)" }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
                  >
                    <span>Continue to Defaults</span>
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </button>
                </div>
              </form>
            </div>

            {/* Institutional Summary Column */}
            <div className="lg:col-span-5">
              <div
                className="rounded-md p-6"
                style={{
                  backgroundColor: "var(--sheet)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "var(--rule)" }}>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Institution Preview
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-700">
                    Jurisdiction Check
                  </span>
                </div>

                <div
                  className="p-5 rounded border border-dashed space-y-2"
                  style={{
                    backgroundColor: "var(--paper)",
                    borderColor: "var(--rule)",
                  }}
                >
                  <p className="font-serif font-bold text-base" style={{ color: "var(--ink)" }}>
                    {formData.hospitalName || "Institution Unassigned"}
                  </p>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                    {formData.hospitalAddress || "Address pending entry..."}
                  </p>
                </div>

                <div className="mt-4 p-3.5 rounded text-xs space-y-1.5" style={{ backgroundColor: "rgba(23, 20, 16, 0.04)" }}>
                  <p className="font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink)" }}>
                    Legal Significance
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                    Consumer Protection Act (CPA 2019) mandates that the healthcare establishment where treatment is rendered be clearly identified on all consent documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: DEFAULTS & FINAL SUBMIT ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <form
                onSubmit={handleSubmitOnboarding}
                className="rounded-md p-6 sm:p-8 space-y-5"
                style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
              >
                <div>
                  <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-2" style={{ color: "var(--ink)" }}>
                    Default Consent Type for Your Practice
                  </label>
                  <div className="space-y-2">
                    {CONSENT_TYPES.map((t) => {
                      const selected = formData.defaultConsentType === t.id;
                      return (
                        <label
                          key={t.id}
                          className="flex items-start gap-3 p-3 rounded-md transition-all cursor-pointer border"
                          style={{
                            backgroundColor: selected ? "rgba(190, 61, 42, 0.04)" : "var(--paper)",
                            borderColor: selected ? "var(--red)" : "var(--rule)",
                          }}
                        >
                          <input
                            type="radio"
                            name="consentType"
                            value={t.id}
                            checked={selected}
                            onChange={() => setFormData({ ...formData, defaultConsentType: t.id })}
                            className="mt-1 accent-[#BE3D2A]"
                          />
                          <div>
                            <p className="font-serif font-bold text-xs" style={{ color: "var(--ink)" }}>
                              {t.label}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                              {t.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                      Primary Counseling Language
                    </label>
                    <select
                      value={formData.primaryLanguage}
                      onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-md text-xs font-sans outline-none cursor-pointer"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[11px] uppercase font-bold tracking-[0.08em] block mb-1.5" style={{ color: "var(--ink)" }}>
                      Comprehension Level
                    </label>
                    <select
                      value={formData.defaultLanguageLevel}
                      onChange={(e) => setFormData({ ...formData, defaultLanguageLevel: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-md text-xs font-sans outline-none cursor-pointer"
                      style={{
                        backgroundColor: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    >
                      <option value="standard">Standard Medico-Legal (Recommended)</option>
                      <option value="simple">Plain Language / Simplified</option>
                      <option value="detailed">Exhaustive Academic / Tertiary</option>
                    </select>
                  </div>
                </div>

                {/* Clinician Declaration */}
                <div
                  className="p-4 rounded-md text-xs leading-relaxed space-y-2 mt-4"
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink)" }}>
                    Clinician Attestation
                  </p>
                  <p style={{ color: "var(--ink-muted)" }}>
                    I solemnly declare that the medical registration number and institutional affiliation provided herein are accurate, current, and registered under the relevant Medical Council Acts.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--rule)" }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-75 cursor-pointer"
                    style={{ color: "var(--ink)" }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" weight="bold" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: "var(--red)", color: "#FFFFFF" }}
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Setup & Enter Platform</span>
                        <CheckCircle className="w-3.5 h-3.5" weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Complete Live Clinician Header Badge */}
            <div className="lg:col-span-5">
              <div
                className="rounded-md p-6 space-y-4"
                style={{
                  backgroundColor: "var(--sheet)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--rule)" }}>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    Full Medico-Legal Dossier
                  </span>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-700">
                    Ready to Seal
                  </span>
                </div>

                <div
                  className="p-5 rounded border border-dashed space-y-3"
                  style={{
                    backgroundColor: "var(--paper)",
                    borderColor: "var(--rule)",
                  }}
                >
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block">Attending Clinician</span>
                    <p className="font-serif font-bold text-base" style={{ color: "var(--ink)" }}>{formData.doctorName}</p>
                    <p className="font-mono text-xs font-bold" style={{ color: "var(--red)" }}>
                      Reg: {formData.doctorRegistrationNo} • {formData.medicalCouncil}
                    </p>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: "var(--rule-soft)" }}>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block">Hospital / Center</span>
                    <p className="font-medium text-xs" style={{ color: "var(--ink)" }}>{formData.hospitalName}</p>
                    <p className="text-[11px] font-mono leading-relaxed mt-0.5" style={{ color: "var(--ink-muted)" }}>{formData.hospitalAddress}</p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--rule-soft)" }}>
                    <span className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>Default Framework</span>
                    <span className="text-[10px] font-mono uppercase font-bold" style={{ color: "var(--ink)" }}>{formData.defaultConsentType}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded text-xs" style={{ backgroundColor: "rgba(13, 148, 136, 0.08)", border: "1px solid rgba(13, 148, 136, 0.2)" }}>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] mb-1">
                    <Sparkle weight="fill" className="w-3.5 h-3.5" />
                    <span>Auto-Fill Enabled</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900">
                    Your consent generation wizard will automatically populate with these verified details on every procedure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: CELEBRATION / COMPLETE ── */}
        {step === 4 && (
          <div className="max-w-lg mx-auto w-full text-center">
            <div
              className="rounded-md p-8 sm:p-10 space-y-6 shadow-sm"
              style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-bounce"
                style={{ backgroundColor: "rgba(13, 148, 136, 0.12)", color: "#0f766e" }}
              >
                <CheckCircle weight="fill" className="w-10 h-10" />
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-[0.1em] font-semibold mb-1" style={{ color: "var(--red)" }}>
                  Registration Completed
                </p>
                <h2 className="font-serif text-3xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                  Welcome to ConsentGen, {formData.doctorName}
                </h2>
                <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                  Your clinical profile is now registered and verified for tamper-evident informed consent documentation.
                </p>
              </div>

              <div
                className="p-4 rounded-md text-left space-y-2 text-xs"
                style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)" }}
              >
                <div className="flex justify-between">
                  <span style={{ color: "var(--ink-muted)" }}>Registration No:</span>
                  <span className="font-mono font-bold" style={{ color: "var(--ink)" }}>{formData.doctorRegistrationNo}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--ink-muted)" }}>Institution:</span>
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>{formData.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--ink-muted)" }}>Consent Defaults:</span>
                  <span className="font-mono uppercase font-bold text-emerald-700">Active</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/generate"
                  className="flex-1 py-3 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--red)" }}
                >
                  <FileText className="w-4 h-4" weight="bold" />
                  <span>Draft First Consent</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex-1 py-3 rounded-md text-xs font-mono uppercase tracking-[0.08em] font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: "var(--paper)" }}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--rule)", borderTopColor: "var(--ink)" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
              Loading Clinician Setup...
            </p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
