import fs from "fs";
import path from "path";

export interface PromptLibrary {
  system: string;
  analyzer: string;
  enricher: string;
  generator: string;
  ats: string;
  assembler: string;
  coach: string;
}

const PROMPT_DIR = path.join(process.cwd(), "src", "prompts");

export function loadPrompts(): PromptLibrary {
  return {
    system: readPrompt("system.prompt.txt"),
    analyzer: readPrompt("analyze-jd.prompt.txt"),
    enricher: readPrompt("enrich-achievement.prompt.txt"),
    generator: readPrompt("generate-bullets.prompt.txt"),
    ats: readPrompt("check-ats.prompt.txt"),
    assembler: readPrompt("assemble-resume.prompt.txt"),
    coach: readPrompt("coach.prompt.txt"),
  };
}

function readPrompt(filename: string): string {
  const filepath = path.join(PROMPT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: Prompt file not found: ${filepath}`);
    return "";
  }
  return fs.readFileSync(filepath, "utf-8").trim();
}
