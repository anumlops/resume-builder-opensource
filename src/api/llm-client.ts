import dotenv from "dotenv";
dotenv.config();

interface LLMResponse {
  content: string;
  model: string;
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000
): Promise<LLMResponse> {
  const provider = process.env.MODEL_PROVIDER || "deepseek";

  if (provider === "anthropic") {
    return callAnthropic(systemPrompt, userPrompt, maxTokens);
  }
  return callDeepSeek(systemPrompt, userPrompt, maxTokens);
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LLMResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return { content: text, model: "claude-sonnet-4-20250514" };
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LLMResponse> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
  });

  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return {
    content: response.choices[0]?.message?.content || "",
    model: "deepseek-chat",
  };
}
