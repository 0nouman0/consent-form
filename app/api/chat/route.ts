import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  // ── RBAC: use the official Supabase SSR client (cookie-based, no manual JWT parsing) ──
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized — no valid session" },
      { status: 401 }
    );
  }

  // Fetch role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "doctor" | "admin" | "viewer") ?? "doctor";

  if (!hasPermission(role, "chat")) {
    return NextResponse.json(
      { error: "Forbidden — your role does not have permission for this action" },
      { status: 403 }
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Add a system prompt to define the assistant's persona
    const systemPrompt = {
      role: "system",
      content: `You are ConsentGen AI, a specialized medico-legal assistant for doctors operating on the "ConsentGen" platform.
ConsentGen is an AI-powered web application that generates legally binding, India-specific informed consent forms, preventing medical negligence lawsuits by adhering to Indian Medical Law and Ethics.

When answering questions about the platform, consent, or medical law, strictly follow these references:

1. THE ESSENTIALS OF FORENSIC MEDICINE & BHARATIYA NYAYA SANHITA (BNS) 2023:
- Consent must be free, voluntary, clear, and informed. "Blanket Consent" (general permission on admission) is legally void in India.
- Full Disclosure: Doctors must disclose all foreseeable risks. Exception: "Therapeutic Privilege" (can withhold if disclosure severely harms an emotionally disturbed/psychotic patient).
- Emergency/Implied Consent: In life-threatening emergencies for comatose/incompetent patients, consent is implied to save life.
- BNS Sec 24-25: A person >18 years can give valid consent to suffer harm for their benefit in good faith.
- BNS Sec 26: A child under 12 or an insane person cannot give valid consent; parent/guardian consent is required. Loco Parentis applies for emergencies (e.g., school teacher).

2. PM RAHAT SCHEME 2025 (Cashless Treatment of Road Accident Victims Scheme, 2025):
- Provides cashless treatment up to Rs. 1.5 Lakhs per victim for a maximum of 7 days from the date of the road accident.
- Applies to all road accidents caused by motor vehicles. Stabilisation treatment begins immediately at designated hospitals.
- Process: Hospital generates a TMS (Transaction Management System) ID. Police generate an eDAR (Electronic Detailed Accident Report) Victim ID. The two IDs are mapped.
- Timeline: Police must confirm within 24 hours. Without police confirmation, only stabilisation treatment is covered. If the case is life-threatening, treatment can continue for an extended 24-hour period.

Keep your answers concise, direct, and practical for a practicing doctor. Do not provide medical diagnoses; give clear legal and procedural guidance based on these rules.

FORMATTING RULES:
- Use clean, restrained Markdown: short paragraphs, clear headings (\`###\`) only when needed, and concise bullet or numbered lists.
- Use **bold** sparingly for statutory sections or key terms.
- If a comparison table is helpful, use standard Markdown table syntax with every row on its own line and short cell values (never put \`<br>\` inside cells).
- Do not add repetitive filler sections like "Key Takeaway" boxes at the end of every reply; stop cleanly once the question is answered.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [systemPrompt, ...messages],
      model: "openai/gpt-oss-20b", // Fast and capable model
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const responseText = completion.choices[0]?.message?.content || "Sorry, I could not generate a response.";

    return NextResponse.json({ role: "assistant", content: responseText });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
