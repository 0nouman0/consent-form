import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { consentFormSchema } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { generateConsentId } from "@/lib/utils";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input with Zod
    const parsed = consentFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const consentId = generateConsentId(input.clinical.hospitalName);

    // Create Groq client — API key from server environment only
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input as any, consentId) },
      ],
      stream: true,
      temperature: 0.15,
      max_tokens: 4000,
    });

    // Stream response back to client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // First chunk: send consent ID so client can capture it
        controller.enqueue(
          encoder.encode(`__CONSENT_ID__${consentId}__END_ID__\n`)
        );
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: "Failed to generate consent form. Please try again." },
      { status: 500 }
    );
  }
}