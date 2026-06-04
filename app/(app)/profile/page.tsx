"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, LogOut, Settings, Save, Check, Stethoscope } from "lucide-react";

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
        
        // Fetch profile from supabase
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfileData({
            doctorName: profile.doctor_name || "",
            doctorRegistrationNo: profile.doctor_registration_no || "",
            hospitalName: profile.hospital_name || "",
            hospitalAddress: profile.hospital_address || "",
          });
          // sync to localstorage for fast loads in other components
          localStorage.setItem("consentgen_doctor_profile", JSON.stringify({
            doctorName: profile.doctor_name || "",
            doctorRegistrationNo: profile.doctor_registration_no || "",
            hospitalName: profile.hospital_name || "",
            hospitalAddress: profile.hospital_address || "",
          }));
        } else {
          // fallback to localstorage
          const savedProfile = localStorage.getItem("consentgen_doctor_profile");
          if (savedProfile) {
            try {
              setProfileData(JSON.parse(savedProfile));
            } catch (e) {
              console.error("Failed to parse profile data", e);
            }
          }
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
      <div className="flex-1 min-h-screen bg-nq-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
      </div>
    );
  }

  const INPUT_CLASSES =
    "w-full px-4 py-3 rounded-xl border border-nq-border bg-white text-nq-text placeholder-nq-text-light outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all text-sm font-medium";
  const LABEL_CLASSES = "text-sm font-bold text-nq-text mb-1.5 block tracking-tight";

  return (
    <div className="max-w-screen-md mx-auto px-5 sm:px-8 py-10 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-nq-border mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-nq-text tracking-tight">
            Profile Settings
          </h1>
          <p className="text-sm text-nq-text-muted mt-2">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Info Card */}
        <div className="nq-card p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-nq-purple-soft border-2 border-nq-purple/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-nq-purple">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-nq-text mb-1 tracking-tight">Doctor Account</h2>
              <div className="flex items-center gap-2 text-nq-text-muted text-sm font-medium mb-4">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="w-3 h-3" />
                Verified Doctor
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Profile Details */}
        <div className="nq-card overflow-hidden">
          <div className="p-5 border-b border-nq-border bg-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-nq-border flex items-center justify-center">
              <Stethoscope className="w-4.5 h-4.5 text-nq-text-light" />
            </div>
            <h3 className="font-bold text-nq-text">Clinical Details (Auto-fill)</h3>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-nq-text-muted mb-4">
              Save your clinical details here so they automatically populate when you generate a new consent form.
            </p>
            
            <div>
              <label htmlFor="doctorName" className={LABEL_CLASSES}>
                Doctor / Surgeon Full Name
              </label>
              <input
                id="doctorName"
                name="doctorName"
                value={profileData.doctorName}
                onChange={handleInputChange}
                type="text"
                placeholder="Dr. John Doe"
                className={INPUT_CLASSES}
              />
            </div>
            
            <div>
              <label htmlFor="doctorRegistrationNo" className={LABEL_CLASSES}>
                Medical Council Registration Number
              </label>
              <input
                id="doctorRegistrationNo"
                name="doctorRegistrationNo"
                value={profileData.doctorRegistrationNo}
                onChange={handleInputChange}
                type="text"
                placeholder="e.g. KMC 12345"
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="hospitalName" className={LABEL_CLASSES}>
                Hospital / Clinic Name
              </label>
              <input
                id="hospitalName"
                name="hospitalName"
                value={profileData.hospitalName}
                onChange={handleInputChange}
                type="text"
                placeholder="City General Hospital"
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="hospitalAddress" className={LABEL_CLASSES}>
                Hospital Address
              </label>
              <textarea
                id="hospitalAddress"
                name="hospitalAddress"
                value={profileData.hospitalAddress}
                onChange={handleInputChange}
                rows={2}
                placeholder="123 Hospital Way, City"
                className={INPUT_CLASSES}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-nq-purple text-white font-bold text-sm rounded-xl hover:bg-nq-purple-dark transition-colors shadow-sm"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved Successfully
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="nq-card overflow-hidden">
          <div className="p-5 border-b border-nq-border bg-slate-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-nq-border flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-nq-text-light" />
            </div>
            <h3 className="font-bold text-nq-text">Account Actions</h3>
          </div>
          <div className="p-6">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-50 text-red-600 font-bold text-sm rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Securely
            </button>
            <p className="text-xs text-nq-text-light mt-3 font-medium">
              Signing out will end your current session. You will need to log back in to generate or view consent forms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
