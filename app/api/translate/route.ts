import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage || targetLanguage === "English") {
      return Response.json({ translatedText: text || "" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ translatedText: text });
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are a medical translator in India. Translate the provided English medical consent text into ${targetLanguage}.
Maintain all markdown formatting, headings (##), lists (-), and medical accuracy.
Return ONLY the translated markdown text. No preamble or conversational text.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || text;

    return Response.json({ translatedText });
  } catch (error: any) {
    console.error("Translation API error:", error);
    // Return original text rather than 500 error so frontend never breaks
    return Response.json({ translatedText: "" }, { status: 200 });
  }
}
