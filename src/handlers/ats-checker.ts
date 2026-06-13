import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface ATSReport {
  ats_compatibility: { overall_score: string; pass_fail: string };
  formatting_analysis: Record<string, { status: string; finding: string }>;
  keyword_matching_analysis: {
    job_description_keywords: {
      keyword: string;
      importance: string;
      found_in_resume: string;
      context: string;
      match_type: string;
      match_score: string;
    }[];
    total_keyword_coverage: string;
    critical_keywords_missing: {
      keyword: string;
      section: string;
      suggestion: string;
    }[];
  };
  verb_quality_analysis: {
    power_verb_percentage: string;
    weak_verb_flags: { bullet: string; verb: string; suggestion: string }[];
    verb_diversity_score: string;
  };
  quantification_analysis: {
    bullets_with_metrics: string;
    metrics_by_type: Record<string, string>;
    quantification_score: string;
  };
  improvement_priority_recommendations: {
    priority: string;
    issue: string;
    impact: string;
    fix: string;
  }[];
  estimated_ats_performance: Record<string, string>;
}

export interface ATSInput {
  resume: string;
  jobDescription: string;
}

export async function checkATS(
  input: ATSInput,
  prompts: PromptLibrary
): Promise<ATSReport> {
  const userPrompt = `${prompts.ats}\n\nRESUME:\n${input.resume}\n\nJOB DESCRIPTION:\n${input.jobDescription}`;
  const response = await callLLM(prompts.system, userPrompt, 2000);

  try {
    const cleaned = response.content
      .replace(/```(json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return JSON.parse(cleaned) as ATSReport;
  } catch {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ATSReport;
    }
    throw new Error(
      "Failed to parse ATS report. LLM response was not valid JSON."
    );
  }
}
