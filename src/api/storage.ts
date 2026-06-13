import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "resume-output");

interface ResumeSession {
  id: string;
  createdAt: string;
  jobDescription?: string;
  keywords?: string[];
  achievements: AchievementRecord[];
  generatedBullets: BulletRecord[];
  assembledResume?: string;
  atsReport?: string;
}

interface AchievementRecord {
  raw: string;
  enriched: string;
  chosenBullets: string[];
}

interface BulletRecord {
  achievement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  chosen: string;
}

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export function saveSession(session: ResumeSession): string {
  ensureOutputDir();
  const filename = `resume-session-${session.id}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(session, null, 2), "utf-8");
  return filepath;
}

export function loadSession(id: string): ResumeSession | null {
  const filepath = path.join(OUTPUT_DIR, `resume-session-${id}.json`);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

export function saveResumeToFile(content: string, format: string): string {
  ensureOutputDir();
  const ext = format === "docx" ? "docx" : "md";
  const filename = `resume-${Date.now()}.${ext}`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, "utf-8");
  return filepath;
}

export function listSessions(): string[] {
  ensureOutputDir();
  return fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith("resume-session-"))
    .map((f) => f.replace("resume-session-", "").replace(".json", ""));
}
