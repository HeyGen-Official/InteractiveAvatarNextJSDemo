import { Configuration, OpenAIApi } from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    const { userText } = await request.json();

    const configuration = new Configuration({
      apiKey: OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: process.env.OPENAI_SYSTEM_PROMPT || "" },
        { role: "user", content: userText },
      ],
      max_tokens: 150,
    });

    const openaiResponse = response.data.choices[0].message?.content || "";

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
