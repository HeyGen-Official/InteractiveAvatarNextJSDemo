import OpenAI from "openai";
import { streamText } from "ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4"),
    messages,
  });

  return result.toAIStreamResponse();
}
