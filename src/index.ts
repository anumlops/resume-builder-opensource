import dotenv from "dotenv";
dotenv.config();

import { loadPrompts } from "./handlers/prompt-loader";
import { analyzeJobDescription } from "./handlers/jd-analyzer";
import { enrichAchievement } from "./handlers/achievement-enricher";
import { generateBulletOptions } from "./handlers/bullet-generator";
import { checkATS } from "./handlers/ats-checker";
import { assembleResume } from "./handlers/resume-assembler";
import { getCoachingGuidance } from "./handlers/coaching-engine";
import { saveResumeToFile } from "./api/storage";
import type { AssemblerInput } from "./handlers/resume-assembler";

const prompts = loadPrompts();

export type Stage =
  | "analyze_jd"
  | "enrich_achievement"
  | "generate_bullets"
  | "assemble_resume"
  | "check_ats"
  | "refine";

export interface ResumeRequest {
  stage: Stage;
  jobDescription?: string;
  achievement?: string;
  role?: string;
  company?: string;
  industry?: string;
  keywords?: string[];
  impactCategory?: string;
  metric?: string;
  resume?: string;
  feedback?: string;
  assembly?: AssemblerInput;
  currentBullet?: string;
  jobTitle?: string;
}

export async function processRequest(request: ResumeRequest): Promise<string> {
  switch (request.stage) {
    case "analyze_jd": {
      if (!request.jobDescription) throw new Error("jobDescription required");
      const analysis = await analyzeJobDescription(
        { jobDescription: request.jobDescription },
        prompts
      );
      return JSON.stringify(analysis, null, 2);
    }

    case "enrich_achievement": {
      if (!request.achievement) throw new Error("achievement required");
      const enriched = await enrichAchievement(
        { achievement: request.achievement, role: request.role, company: request.company },
        prompts
      );
      return JSON.stringify(enriched, null, 2);
    }

    case "generate_bullets": {
      if (!request.achievement) throw new Error("achievement required");
      const options = await generateBulletOptions(
        {
          achievement: request.achievement,
          industry: request.industry || "General",
          keywords: request.keywords || [],
          impact_category: request.impactCategory || "GROWTH",
          metric: request.metric || "improved results",
        },
        prompts
      );
      return JSON.stringify(options, null, 2);
    }

    case "assemble_resume": {
      if (!request.assembly) throw new Error("assembly data required");
      const result = await assembleResume(request.assembly, prompts);
      return result.content;
    }

    case "check_ats": {
      if (!request.resume || !request.jobDescription)
        throw new Error("resume and jobDescription required");
      const report = await checkATS(
        { resume: request.resume, jobDescription: request.jobDescription },
        prompts
      );
      return JSON.stringify(report, null, 2);
    }

    case "refine": {
      if (!request.currentBullet || !request.jobTitle)
        throw new Error("currentBullet and jobTitle required");
      const guidance = await getCoachingGuidance(
        {
          currentBullet: request.currentBullet,
          jobTitle: request.jobTitle,
          industry: request.industry || "General",
          userFeedback: request.feedback || "Make this stronger",
        },
        prompts
      );
      return guidance;
    }

    default:
      throw new Error(`Unknown stage: ${request.stage}`);
  }
}

export async function runFullPipeline(
  jobDescription: string,
  experiences: { achievement: string; role?: string; company?: string }[],
  assemblyData: Omit<AssemblerInput, "jobDescription">
): Promise<{ analysis: string; enriched: string[]; bullets: string[]; resume: string }> {
  console.log("STAGE 1: Analyzing job description...");
  const analysis = await processRequest({ stage: "analyze_jd", jobDescription });
  const analysisObj = JSON.parse(analysis);
  const keywords = analysisObj.keywords_to_match || [];

  const enriched: string[] = [];
  const bullets: string[] = [];

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    console.log(`STAGE 2: Enriching achievement ${i + 1}...`);
    const enrichedStr = await processRequest({
      stage: "enrich_achievement",
      achievement: exp.achievement,
      role: exp.role,
      company: exp.company,
    });
    enriched.push(enrichedStr);

    const enrichedObj = JSON.parse(enrichedStr);
    console.log(`STAGE 3: Generating bullets for achievement ${i + 1}...`);
    const bulletStr = await processRequest({
      stage: "generate_bullets",
      achievement: exp.achievement,
      industry: analysisObj.industry || "General",
      keywords,
      impactCategory: enrichedObj.impact_category || "GROWTH",
      metric: "measurable results",
    });
    bullets.push(bulletStr);
  }

  console.log("STAGE 4: Assembling resume...");
  const resume = await processRequest({
    stage: "assemble_resume",
    assembly: { ...assemblyData, jobDescription },
  });

  return { analysis, enriched, bullets, resume };
}

async function interactiveMode(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("  RESUME BUILDER - Interactive Mode");
  console.log("=".repeat(60) + "\n");

  const readline = (await import("readline")).default;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log("\nSTEP 1: Paste the job description (Ctrl+D / empty line to finish):");
    const jdLines: string[] = [];
    for await (const line of rl) {
      if (line.trim() === "") break;
      jdLines.push(line);
    }
    const jobDescription = jdLines.join("\n");

    console.log("\nAnalyzing job description...");
    const analysis = await processRequest({ stage: "analyze_jd", jobDescription });
    console.log("\nAnalysis:", analysis);

    const achievements: string[] = [];
    console.log("\nSTEP 2: Describe your achievements (one per prompt, 'done' to finish):");
    while (true) {
      const achievement = await question("Achievement: ");
      if (achievement.toLowerCase() === "done") break;
      achievements.push(achievement);

      console.log("\nEnriching...");
      const enriched = await processRequest({ stage: "enrich_achievement", achievement });
      console.log("\nEnriched:", enriched);

      console.log("\nGenerating bullet options...");
      const bullets = await processRequest({ stage: "generate_bullets", achievement });
      console.log("\nBullets:", bullets);
    }

    console.log("\nDone! Resume data saved. Run with assemble command to build final resume.");
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes("--interactive") || args.includes("-i")) {
    interactiveMode().catch(console.error);
  } else {
    console.log("Professional Resume Builder - Open Source Edition");
    console.log("Usage: npm run start -- --interactive");
    console.log("   or: npm run cli -- [command] [args]");
  }
}
