import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { getUserWithRole, hasPermission } from "@/lib/rbac";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { reportError } from "@/lib/monitor";
import { buildTranslationPrompt } from "@/lib/consent-template";

const MAX_TRANSLATE_CHARS = 20000;

export async function POST(req: NextRequest) {
  const user = await getUserWithRole();
  if (!user || !hasPermission(user.role, "generate")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`translate:${user.id}`, 15, 60_000);
  if (!limited.ok) return tooManyRequests(limited.retryAfter);

  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage || targetLanguage === "English") {
      return Response.json({ translatedText: text || "" });
    }
    if (typeof text !== "string" || typeof targetLanguage !== "string" || text.length > MAX_TRANSLATE_CHARS || targetLanguage.length > 40) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ translatedText: text });
    }

    const groq = new Groq({ apiKey });

    // Same strengthened prompt as the generator. The old 2,000-token cap cut Indian-language forms off mid-way
    // (a full form needs roughly 3,500-5,000 tokens).
    const tp = buildTranslationPrompt(text, targetLanguage);
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: tp.system },
        { role: "user", content: tp.user },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || text;

    return Response.json({ translatedText });
  } catch (error: any) {
    console.error("Translation API error:", error);
    void reportError("api/translate", error, { userId: user.id });
    // Return original text rather than 500 error so frontend never breaks
    return Response.json({ translatedText: "" }, { status: 200 });
  }
}
