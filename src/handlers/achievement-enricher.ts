import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface EnrichedAchievement {
  raw_achievement: string;
  core_achievement: string;
  impact_category: string;
  quantifiable_elements: {
    hard_metrics: string[];
    soft_metrics: string[];
    scope_indicators: string[];
  };
  baseline_context_options: {
    scenario: string;
    baseline: string;
    improvement: string;
  }[];
  proof_points: string[];
  business_impact: {
    direct: string;
    secondary: string;
    strategic: string;
  };
  enrichment_suggestions: string[];
}

export interface EnricherInput {
  achievement: string;
  role?: string;
  company?: string;
}

export async function enrichAchievement(
  input: EnricherInput,
  prompts: PromptLibrary
): Promise<EnrichedAchievement> {
  const context = `
Role: ${input.role || "N/A"}
Company: ${input.company || "N/A"}
Achievement: ${input.achievement}`;

  const userPrompt = `${prompts.enricher}\n\nUSER ACHIEVEMENT INPUT:\n${context}`;
  const response = await callLLM(prompts.system, userPrompt, 2000);

  try {
    const cleaned = response.content
      .replace(/```(json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return JSON.parse(cleaned) as EnrichedAchievement;
  } catch {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as EnrichedAchievement;
    }
    throw new Error(
      "Failed to parse enriched achievement. LLM response was not valid JSON."
    );
  }
}
