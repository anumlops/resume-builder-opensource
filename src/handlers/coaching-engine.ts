import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface CoachingInput {
  currentBullet: string;
  jobTitle: string;
  industry: string;
  userFeedback: string;
}

export async function getCoachingGuidance(
  input: CoachingInput,
  prompts: PromptLibrary
): Promise<string> {
  const context = `
Current Bullet: ${input.currentBullet}
Target Job Title: ${input.jobTitle}
Industry: ${input.industry}
User Request: ${input.userFeedback}`;

  const userPrompt = `${prompts.coach}\n\nCOACHING CONTEXT:\n${context}`;
  const response = await callLLM(prompts.system, userPrompt, 1500);
  return response.content;
}
