import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

const DEFAULT_SUPABASE_URL = "https://gqxqaqnohabahcfrszwz.supabase.co";
const DEFAULT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHFhcW5vaGFiYWhjZnJzend6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTcyMDcsImV4cCI6MjA5NTczMzIwN30.EVi1adqR3aC9zB4GabNr0hZRSC9A1_7WPBPE6k-7Od0";

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_KEY;

  client = createBrowserClient(url, key);
  return client;
}

