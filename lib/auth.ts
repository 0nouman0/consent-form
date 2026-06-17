import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole, requireRole, type UserRole, type AuthenticatedUser } from "@/lib/rbac";

// Re-export RBAC helpers so existing imports from lib/auth still work
export { getUserWithRole, requireRole, type UserRole, type AuthenticatedUser };

export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
