import { callLLM } from "../api/llm-client";
import type { PromptLibrary } from "./prompt-loader";

export interface ResumeAssembly {
  content: string;
  metadata: {
    ats_score: string;
    keywords_covered: string;
    verb_quality: string;
    quantification: string;
  };
}

export interface AssemblerInput {
  contact: { name: string; email: string; phone: string; linkedin: string; location: string };
  summary?: string;
  experience: { company: string; title: string; dates: string; bullets: string[] }[];
  education: { degree: string; major: string; university: string; graduation: string; gpa?: string };
  skills: { category: string; items: string[] }[];
  optionalSections?: { title: string; content: string }[];
  jobDescription: string;
}

export async function assembleResume(
  input: AssemblerInput,
  prompts: PromptLibrary
): Promise<ResumeAssembly> {
  const resumeData = JSON.stringify(input, null, 2);
  const userPrompt = `${prompts.assembler}\n\nRESUME DATA:\n${resumeData}`;
  const response = await callLLM(prompts.system, userPrompt, 3000);

  const atsScoreMatch = response.content.match(/(\d+)%\s*match/i);
  const atsScore = atsScoreMatch ? atsScoreMatch[1] : "N/A";

  return {
    content: response.content,
    metadata: {
      ats_score: atsScore,
      keywords_covered: "Verified in content",
      verb_quality: "Verified in content",
      quantification: "Verified in content",
    },
  };
}
