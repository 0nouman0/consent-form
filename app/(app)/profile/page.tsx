"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User, Envelope, ShieldCheck, SignOut,
  Gear, FloppyDisk, Check, Stethoscope,
} from "@phosphor-icons/react/dist/ssr";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="flex-1 min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
        <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm";
  const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

  return (
    <div className="min-h-screen font-body" style={{ background: "hsl(var(--muted))" }}>
      <div className="max-w-screen-md mx-auto px-5 sm:px-8 py-10">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-sans font-black text-4xl sm:text-5xl text-foreground tracking-tight">Profile Settings</h1>
            <p className="text-sm text-muted-foreground mt-2">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-background border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border-2"
                style={{ background: "hsl(var(--primary) / 0.08)", borderColor: "hsl(var(--primary) / 0.2)" }}>
                <span className="font-sans font-black text-4xl text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="font-sans font-bold text-2xl text-foreground mb-1">Doctor Account</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                  <Envelope weight="regular" className="w-4 h-4" /> {user?.email}
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg">
                  <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> Verified Doctor
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Details */}
          <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="p-5 border-b border-border bg-muted/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                <Stethoscope weight="duotone" className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-sans font-bold text-xl text-foreground">Clinical Details (Auto-fill)</h3>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Save your clinical details here so they automatically populate when you generate a new consent form.
              </p>
              <div>
                <label htmlFor="doctorName" className={labelCls}>Doctor / Surgeon Full Name</label>
                <input id="doctorName" name="doctorName" value={profileData.doctorName}
                  onChange={handleInputChange} type="text" placeholder="Dr. John Doe" className={inputCls} />
              </div>
              <div>
                <label htmlFor="doctorRegistrationNo" className={labelCls}>Medical Council Registration Number</label>
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
              <div className="pt-2">
                <button onClick={handleSaveProfile}
                  className={`btn-primary px-6 py-3 text-sm ${isSaved ? "opacity-90" : ""}`}>
                  {isSaved
                    ? <><Check weight="bold" className="w-4 h-4" /> Saved Successfully</>
                    : <><FloppyDisk weight="bold" className="w-4 h-4" /> Save Details</>}
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="p-5 border-b border-border bg-muted/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                <Gear weight="duotone" className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-sans font-bold text-xl text-foreground">Account Actions</h3>
            </div>
            <div className="p-6">
              <button onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-50 text-red-600 font-semibold text-sm rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors">
                <SignOut weight="bold" className="w-4 h-4" /> Sign Out Securely
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                Signing out will end your current session. You will need to log back in to generate or view consent forms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
