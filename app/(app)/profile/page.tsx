"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User, Envelope, ShieldCheck, SignOut,
  Gear, FloppyDisk, Check, Stethoscope, Crown, Eye,
} from "@phosphor-icons/react/dist/ssr";
import type { UserRole } from "@/lib/rbac";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("doctor");
  const [profileData, setProfileData] = useState({
    doctorName: "",
    doctorRegistrationNo: "",
    hospitalName: "",
    hospitalAddress: "",
  });
  const [isSaved, setIsSaved] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user as any);
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          const pd = {
            doctorName: profile.doctor_name || "",
            doctorRegistrationNo: profile.doctor_registration_no || "",
            hospitalName: profile.hospital_name || "",
            hospitalAddress: profile.hospital_address || "",
          };
          setProfileData(pd);
          setUserRole((profile.role as UserRole) ?? "doctor");
          localStorage.setItem("consentgen_doctor_profile", JSON.stringify(pd));
        } else {
          const savedProfile = localStorage.getItem("consentgen_doctor_profile");
          if (savedProfile) { try { setProfileData(JSON.parse(savedProfile)); } catch (e) {} }
        }
      } else {
        router.push("/login?redirect=/profile");
      }
      setLoading(false);
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    localStorage.setItem("consentgen_doctor_profile", JSON.stringify(profileData));
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        doctor_name: profileData.doctorName,
        doctor_registration_no: profileData.doctorRegistrationNo,
        hospital_name: profileData.hospitalName,
        hospital_address: profileData.hospitalAddress,
        updated_at: new Date().toISOString(),
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#ededed]">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all font-body"
    + " text-neutral-800 placeholder-neutral-400"
    + " focus:ring-2 focus:ring-neutral-800/10 focus:border-neutral-800"
    + " border border-neutral-200 bg-white";
  const labelCls = "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block";

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-body" style={{ backgroundColor: "#ededed" }}>
      <div className="max-w-screen-md mx-auto space-y-4">

        {/* Page Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-6 sm:py-7"
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: "#0b0f1a", letterSpacing: "-0.02em" }}>
            Profile <span className="font-serif italic font-normal text-neutral-600 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>settings</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your account and clinical preferences</p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#f5f2ee", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="text-2xl font-bold" style={{ color: "#0b0f1a" }}>
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#0b0f1a" }}>
                {userRole === "admin" ? "Administrator" : userRole === "viewer" ? "Viewer Account" : "Doctor Account"}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
                <Envelope weight="regular" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Verified badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-full"
                  style={{ border: "1px solid rgba(0,128,0,0.15)" }}>
                  <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified
                </span>
                {/* Role badge */}
                {userRole === "admin" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded-full"
                    style={{ border: "1px solid rgba(147,51,234,0.2)" }}>
                    <Crown weight="fill" className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
                {userRole === "doctor" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full"
                    style={{ color: "#0b0f1a", backgroundColor: "rgba(11,15,26,0.06)", border: "1px solid rgba(11,15,26,0.12)" }}>
                    <Stethoscope weight="fill" className="w-3.5 h-3.5" /> Doctor
                  </span>
                )}
                {userRole === "viewer" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full"
                    style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
                    <Eye weight="fill" className="w-3.5 h-3.5" /> Viewer
                  </span>
                )}
              </div>
              {/* Permissions hint */}
              <p className="text-xs text-neutral-400 mt-2">
                {userRole === "admin" && "Full access: generate, history, chat & user management"}
                {userRole === "doctor" && "Access: generate consents, view history & chat"}
                {userRole === "viewer" && "Read-only access: chat assistant only"}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Details Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
              <Stethoscope weight="duotone" className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>Clinical Details</h3>
              <p className="text-xs text-neutral-500">Auto-fills your consent forms</p>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-5">
            <div>
              <label htmlFor="doctorName" className={labelCls}>Doctor / Surgeon Full Name</label>
              <input id="doctorName" name="doctorName" value={profileData.doctorName}
                onChange={handleInputChange} type="text" placeholder="Dr. John Doe" className={inputCls} />
            </div>
            <div>
              <label htmlFor="doctorRegistrationNo" className={labelCls}>Medical Council Registration No.</label>
              <input id="doctorRegistrationNo" name="doctorRegistrationNo" value={profileData.doctorRegistrationNo}
                onChange={handleInputChange} type="text" placeholder="e.g. KMC 12345" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hospitalName" className={labelCls}>Hospital / Clinic Name</label>
              <input id="hospitalName" name="hospitalName" value={profileData.hospitalName}
                onChange={handleInputChange} type="text" placeholder="City General Hospital" className={inputCls} />
            </div>
            <div>
              <label htmlFor="hospitalAddress" className={labelCls}>Hospital Address</label>
              <textarea id="hospitalAddress" name="hospitalAddress" value={profileData.hospitalAddress}
                onChange={handleInputChange} rows={2} placeholder="123 Hospital Way, City" className={inputCls} />
            </div>
            <div className="pt-1">
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-white transition-all pl-5 pr-3 py-2 hover:opacity-90"
                style={{ backgroundColor: "#0b0f1a" }}
              >
                {isSaved
                  ? <><Check weight="bold" className="w-4 h-4" /> Saved Successfully</>
                  : <><FloppyDisk weight="bold" className="w-4 h-4" /> Save Details</>}
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-6 sm:px-8 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
              <Gear weight="duotone" className="w-4 h-4 text-neutral-600" />
            </div>
            <h3 className="text-base font-bold" style={{ color: "#0b0f1a" }}>Account Actions</h3>
          </div>
          <div className="px-6 sm:px-8 py-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              style={{ border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <SignOut weight="bold" className="w-4 h-4" /> Sign Out Securely
            </button>
            <p className="text-xs text-neutral-400 mt-3 max-w-xs leading-relaxed">
              Signing out ends your current session. You'll need to log back in to generate or view consent forms.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
