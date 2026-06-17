/**
 * Role-Based Access Control (RBAC) for ConsentGen
 *
 * Roles (stored in profiles.role):
 *  - "doctor"   → can generate + view own history + chat
 *  - "admin"    → all doctor permissions + can view all users' history
 *  - "viewer"   → read-only: can only use chat (e.g. medical students, observers)
 *
 * Use requireApiAuth() inside any Route Handler (works in edge + Node runtimes).
 * Use requireRole() for page-level server component auth (Node only, uses redirect).
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "doctor" | "admin" | "viewer";

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: UserRole;
}

// ─── Role permission matrix ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin:  ["generate", "chat", "history:own", "history:all", "profile"],
  doctor: ["generate", "chat", "history:own", "profile"],
  viewer: ["chat"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ─── Server-side auth helpers (Node runtime / Server Components) ─────────────

/**
 * Returns the authenticated user with their role, or null.
 * Uses Supabase cookie-based session. Node-only (server components, Node routes).
 */
export async function getUserWithRole(): Promise<AuthenticatedUser | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Default to "doctor" if no role set yet (backwards-compatible)
  const role: UserRole = (profile?.role as UserRole) ?? "doctor";

  return {
    id: user.id,
    email: user.email,
    role,
  };
}

/**
 * Require authentication + a specific role.
 * Redirects to /login (unauthenticated) or /dashboard?error=forbidden (wrong role).
 * Use in Server Components and Node-runtime Route Handlers.
 */
export async function requireRole(
  permission: string
): Promise<AuthenticatedUser> {
  const user = await getUserWithRole();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

// ─── API Route auth helpers (works in both Edge + Node) ─────────────────────

/**
 * Extract and verify a Supabase session from a Route Handler request.
 * Works in BOTH edge and Node runtimes.
 *
 * Reads the auth cookie (sb-*-auth-token) from the request headers.
 * Falls back to `Authorization: Bearer <token>` header.
 *
 * Returns the authenticated user with role, or a 401/403 Response.
 */
export async function requireApiAuth(
  request: Request,
  permission: string
): Promise<AuthenticatedUser | Response> {
  // ── Step 1: Extract JWT from cookie or Authorization header ──────────────
  const cookieHeader = request.headers.get("cookie") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  // Parse the Supabase auth cookie (format: sb-<ref>-auth-token=base64url)
  let accessToken: string | null = null;

  // Try cookie first (preferred — httpOnly, secure)
  const cookieMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (cookieMatch) {
    try {
      const decoded = decodeURIComponent(cookieMatch[1]);
      // Supabase stores the session as a JSON array: [access_token, ...]
      // or sometimes as a base64-encoded JSON object
      let parsed: any;

      if (decoded.startsWith("%") || decoded.includes("{")) {
        parsed = JSON.parse(decoded);
      } else {
        // base64url encoded
        const base64 = decoded.replace(/-/g, "+").replace(/_/g, "/");
        parsed = JSON.parse(atob(base64));
      }

      if (Array.isArray(parsed)) {
        accessToken = parsed[0]; // [access_token, refresh_token, ...]
      } else if (parsed?.access_token) {
        accessToken = parsed.access_token;
      }
    } catch {
      // Cookie parsing failed; fall through to Authorization header
    }
  }

  // Try Authorization: Bearer <token>
  if (!accessToken && authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7).trim();
  }

  if (!accessToken) {
    return Response.json(
      { error: "Unauthorized — no valid session" },
      { status: 401 }
    );
  }

  // ── Step 2: Verify JWT with Supabase and get user ────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  let userId: string;
  let userEmail: string | undefined;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: "Unauthorized — invalid or expired session" },
        { status: 401 }
      );
    }

    const userJson = await res.json();
    userId = userJson.id;
    userEmail = userJson.email;
  } catch {
    return Response.json(
      { error: "Unauthorized — could not verify session" },
      { status: 401 }
    );
  }

  // ── Step 3: Fetch role from profiles table ───────────────────────────────
  let role: UserRole = "doctor"; // default (backwards compatible)

  try {
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
          Accept: "application/json",
        },
      }
    );

    if (profileRes.ok) {
      const profiles = await profileRes.json();
      if (profiles[0]?.role) {
        role = profiles[0].role as UserRole;
      }
    }
  } catch {
    // Could not fetch profile role — fall back to default "doctor"
  }

  // ── Step 4: Check permission ─────────────────────────────────────────────
  if (!hasPermission(role, permission)) {
    return Response.json(
      {
        error: "Forbidden — your role does not have permission for this action",
        role,
        required: permission,
      },
      { status: 403 }
    );
  }

  return { id: userId, email: userEmail, role };
}

/**
 * Type guard: check if requireApiAuth returned an error Response or a user.
 */
export function isAuthError(
  result: AuthenticatedUser | Response
): result is Response {
  return result instanceof Response;
}
