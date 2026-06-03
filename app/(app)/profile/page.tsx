"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, LogOut, Settings } from "lucide-react";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? null);
      } else {
        router.push("/login?redirect=/profile");
      }
      setLoading(false);
    });
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-nq-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nq-border border-t-nq-purple rounded-full animate-spin" />
      </div>
    );
  }

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
        <div className="nq-card p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-nq-purple-soft border-2 border-nq-purple/20 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-nq-purple">
                {email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-nq-text mb-1 tracking-tight">Doctor Account</h2>
              <div className="flex items-center gap-2 text-nq-text-muted text-sm font-medium mb-4">
                <Mail className="w-4 h-4" />
                {email}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="w-3 h-3" />
                Verified Doctor
              </span>
            </div>
          </div>
        </div>

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
