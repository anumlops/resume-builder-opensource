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
import { validateBullet } from "./api/validation";
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

export async function processRequest(
  request: ResumeRequest
): Promise<string> {
  switch (request.stage) {
    case "analyze_jd": {
      if (!request.jobDescription) throw new Error("jobDescription required");
      console.log("\nAnalyzing job description...");
      const analysis = await analyzeJobDescription(
        { jobDescription: request.jobDescription },
        prompts
      );
      return JSON.stringify(analysis, null, 2);
    }

    case "enrich_achievement": {
      if (!request.achievement) throw new Error("achievement required");
      console.log("\nEnriching achievement...");
      const enriched = await enrichAchievement(
        {
          achievement: request.achievement,
          role: request.role,
          company: request.company,
        },
        prompts
      );
      return JSON.stringify(enriched, null, 2);
    }

    case "generate_bullets": {
      if (!request.achievement) throw new Error("achievement required");
      console.log("\nGenerating bullet options...");
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
      console.log("\nAssembling resume...");
      const result = await assembleResume(request.assembly, prompts);
      return result.content;
    }

    case "check_ats": {
      if (!request.resume || !request.jobDescription)
        throw new Error("resume and jobDescription required");
      console.log("\nChecking ATS compatibility...");
      const report = await checkATS(
        { resume: request.resume, jobDescription: request.jobDescription },
        prompts
      );
      return JSON.stringify(report, null, 2);
    }

    case "refine": {
      if (!request.currentBullet || !request.jobTitle)
        throw new Error("currentBullet and jobTitle required");
      console.log("\nGetting coaching guidance...");
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

function printHeader(): void {
  console.log("\n" + "=".repeat(60));
  console.log("  PROFESSIONAL RESUME BUILDER - Open Source Edition");
  console.log("  PAR Framework | ATS Optimization | Harvard Format");
  console.log("=".repeat(60) + "\n");
}

function printHelp(): void {
  console.log("Usage:");
  console.log("  npm run cli -- analyze-jd < file.txt");
  console.log("  npm run cli -- enrich < achievement-text");
  console.log("  npm run cli -- generate < achievement > output.json");
  console.log("  npm run cli -- assemble < data.json");
  console.log("  npm run cli -- check-ats < resume.txt > report.json");
  console.log("  npm run cli -- refine < bullet-text > guidance.txt");
  console.log("\nOr pipe input:");
  console.log("  cat job-description.txt | npm run cli -- analyze-jd");
  console.log("\nInteractive mode:");
  console.log("  npm run start");
  console.log("");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHeader();
    printHelp();
    return;
  }

  printHeader();

  try {
    let result: string;

    switch (command) {
      case "analyze-jd": {
        let jd = args.slice(1).join(" ");
        if (!jd && !process.stdin.isTTY) {
          jd = await readStdin();
        }
        if (!jd) throw new Error("Provide job description text or pipe via stdin");
        result = await processRequest({ stage: "analyze_jd", jobDescription: jd });
        break;
      }

      case "enrich": {
        let achievement = args.slice(1).join(" ");
        if (!achievement && !process.stdin.isTTY) {
          achievement = await readStdin();
        }
        if (!achievement) throw new Error("Provide achievement text or pipe via stdin");
        result = await processRequest({ stage: "enrich_achievement", achievement });
        break;
      }

      case "generate": {
        let achievement = args.slice(1).join(" ");
        if (!achievement && !process.stdin.isTTY) {
          achievement = await readStdin();
        }
        if (!achievement) throw new Error("Provide achievement text or pipe via stdin");
        result = await processRequest({ stage: "generate_bullets", achievement });
        break;
      }

      case "assemble": {
        let data = args.slice(1).join(" ");
        if (!data && !process.stdin.isTTY) {
          data = await readStdin();
        }
        if (!data) throw new Error("Provide assembly JSON or pipe via stdin");
        const assembly = JSON.parse(data) as AssemblerInput;
        result = await processRequest({ stage: "assemble_resume", assembly });
        break;
      }

      case "check-ats": {
        let resume = args.slice(1).join(" ");
        if (!resume && !process.stdin.isTTY) {
          resume = await readStdin();
        }
        if (!resume) throw new Error("Provide resume text or pipe via stdin");
        result = await processRequest({
          stage: "check_ats",
          resume,
          jobDescription: resume,
        });
        break;
      }

      case "refine": {
        let bullet = args.slice(1).join(" ");
        if (!bullet && !process.stdin.isTTY) {
          bullet = await readStdin();
        }
        if (!bullet) throw new Error("Provide bullet text or pipe via stdin");
        result = await processRequest({
          stage: "refine",
          currentBullet: bullet,
          jobTitle: args[0] || "target role",
        });
        break;
      }

      case "validate": {
        const bullet = args.slice(1).join(" ");
        if (!bullet) throw new Error("Provide bullet text to validate");
        const validation = validateBullet(bullet);
        result = JSON.stringify(validation, null, 2);
        break;
      }

      default:
        printHelp();
        return;
    }

    console.log("\n" + "-".repeat(60));
    console.log("RESULT:");
    console.log("-".repeat(60));
    console.log(result);
    console.log("-".repeat(60) + "\n");

    const saved = saveResumeToFile(result, "markdown");
    console.log(`Saved to: ${saved}\n`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8").trim()));
    process.stdin.on("error", reject);
  });
}

if (require.main === module) {
  main();
}
