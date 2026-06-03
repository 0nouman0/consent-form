import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
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
      content: `You are ConsentGen AI, a specialized medico-legal assistant for doctors. 
      Your purpose is to answer questions related to medical procedures, informed consent requirements (especially regarding Indian medical law like the Narayan Reddy guidelines), patient rights, and clinical documentation. 
      Keep your answers concise, professional, and directly useful to a doctor filling out a consent form. Do not provide actual medical diagnoses.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [systemPrompt, ...messages],
      model: "llama3-8b-8192", // Fast and capable model
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
