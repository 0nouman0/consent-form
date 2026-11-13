import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Test configuration comes from the environment (CI secrets) and, for local runs, from .env.local.
 * Variables already set in the environment always win.
 */
function loadEnvLocal() {
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i <= 0 || line.startsWith("#")) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^"|"$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvLocal();

export const cfg = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  doctor: { email: process.env.TEST_DOCTOR_EMAIL ?? "", password: process.env.TEST_DOCTOR_PASSWORD ?? "" },
  admin: { email: process.env.TEST_ADMIN_EMAIL ?? "", password: process.env.TEST_ADMIN_PASSWORD ?? "" },
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL ?? "",
};

export const hasSupabase = Boolean(cfg.supabaseUrl && cfg.anonKey);
export const hasDoctor = hasSupabase && Boolean(cfg.doctor.email && cfg.doctor.password);
export const hasAdmin = hasSupabase && Boolean(cfg.admin.email && cfg.admin.password);

export const SKIP_NO_SUPABASE = hasSupabase ? false : "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set";
export const SKIP_NO_DOCTOR = hasDoctor ? false : "TEST_DOCTOR_EMAIL / TEST_DOCTOR_PASSWORD not set";
export const SKIP_NO_ADMIN = hasAdmin ? false : "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set";
