import { OpenAI } from "openai";
import fs from 'fs';
import path from 'path';

const systemPromptPath = path.resolve(process.cwd(), 'systemPromptGC.txt');
const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    const { userText } = await request.json();


    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt.toString() || process.env.OPENAI_SYSTEM_PROMPT || "" },
        { role: "user", content: userText },
      ],
      max_tokens: 150,
    });

    const openaiResponse = response.choices[0].message?.content || "";

    return new Response(JSON.stringify({ content: openaiResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching OpenAI response:", error);

    return new Response("Failed to fetch OpenAI response", {
      status: 500,
    });
  }
}
