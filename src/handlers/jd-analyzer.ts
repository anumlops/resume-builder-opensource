import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface JDAnalysis {
  job_title: string;
  seniority_level: string;
  industry: string;
  hard_skills: { skill: string; importance: string; frequency: string }[];
  soft_skills: { skill: string; evidence: string }[];
  keywords_to_match: string[];
  achievement_domains: Record<string, string>;
  technical_tools_mentioned: string[];
  compensation_signals: { expected_impact: string; team_size: string };
  recommended_action_verbs: string[];
  resume_strategy: string;
}

export interface JDAnalyzerInput {
  jobDescription: string;
}

export async function analyzeJobDescription(
  input: JDAnalyzerInput,
  prompts: PromptLibrary
): Promise<JDAnalysis> {
  const userPrompt = `${prompts.analyzer}\n\nJOB DESCRIPTION:\n${input.jobDescription}`;

  const response = await callLLM(prompts.system, userPrompt, 2000);

  try {
    const cleaned = response.content
      .replace(/```(json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return JSON.parse(cleaned) as JDAnalysis;
  } catch {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as JDAnalysis;
    }
    throw new Error(
      "Failed to parse JD analysis. LLM response was not valid JSON."
    );
  }
}
