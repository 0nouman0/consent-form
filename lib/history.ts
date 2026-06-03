import { createClient } from "@/lib/supabase/client";
import { ConsentFormSchema } from "@/lib/schema";

export interface HistoryEntry {
  id: string;
  user_id: string;
  consent_id: string;
  hospital_name: string | null;
  patient_name: string | null;
  procedure_name: string | null;
  consent_type: string | null;
  procedure_date: string | null;
  markdown: string;
  form_data: ConsentFormSchema | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "consent_history";

export async function saveConsentToHistory(
  entry: Omit<HistoryEntry, "id" | "user_id" | "created_at" | "updated_at">
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      consent_id: entry.consent_id,
      hospital_name: entry.hospital_name,
      patient_name: entry.patient_name,
      procedure_name: entry.procedure_name,
      consent_type: entry.consent_type,
      procedure_date: entry.procedure_date,
      markdown: entry.markdown,
      form_data: entry.form_data,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HistoryEntry;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as HistoryEntry[];
}

export async function getHistoryById(id: string): Promise<HistoryEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as HistoryEntry;
}

export async function deleteHistoryEntry(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateHistoryEntry(
  id: string,
  updates: Partial<Omit<HistoryEntry, "id" | "user_id" | "created_at" | "updated_at">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as HistoryEntry;
}
