import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface BulletOptions {
  achievement_summary: string;
  selected_verb_tier: string;
  quantification_strategy: string;
  option_a_results_first: BulletOption;
  option_b_challenge_first: BulletOption;
  option_c_scope_impact: BulletOption;
  recommendation: string;
  quality_checks: Record<string, string>;
}

export interface BulletOption {
  bullet: string;
  word_count: number;
  power_verb: string;
  metric: string;
  method: string;
  impact_score: number;
  keyword_matches: string[];
  reasoning: string;
}

export interface GeneratorInput {
  achievement: string;
  industry: string;
  keywords: string[];
  impact_category: string;
  metric: string;
}

export async function generateBulletOptions(
  input: GeneratorInput,
  prompts: PromptLibrary
): Promise<BulletOptions> {
  const context = `
Achievement: ${input.achievement}
Industry: ${input.industry}
Job Keywords: ${input.keywords.join(", ")}
Impact Category: ${input.impact_category}
Primary Metric: ${input.metric}`;

  const userPrompt = `${prompts.generator}\n\nINPUTS:\n${context}`;
  const response = await callLLM(prompts.system, userPrompt, 2000);

  try {
    const cleaned = response.content
      .replace(/```(json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return JSON.parse(cleaned) as BulletOptions;
  } catch {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as BulletOptions;
    }
    throw new Error(
      "Failed to parse bullet options. LLM response was not valid JSON."
    );
  }
}
