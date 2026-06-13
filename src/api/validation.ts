export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export function validateBullet(bullet: string): ValidationResult {
  const errors: string[] = [];

  if (!bullet || bullet.trim().length === 0) {
    errors.push("Bullet is empty");
    return { success: false, errors };
  }

  const wordCount = bullet.split(/\s+/).length;
  if (wordCount < 5) {
    errors.push(`Bullet too short: ${wordCount} words (min 5 recommended)`);
  }
  if (wordCount > 25) {
    errors.push(
      `Bullet too long: ${wordCount} words (max 25): "${bullet.substring(0, 50)}..."`
    );
  }

  const tier3Verbs = [
    "responsible for",
    "involved in",
    "assisted with",
    "helped with",
    "worked on",
    "contributed to",
  ];
  const lower = bullet.toLowerCase();
  for (const verb of tier3Verbs) {
    if (lower.startsWith(verb)) {
      errors.push(`Starts with weak verb: "${verb}". Use Tier 1/2 verb instead`);
    }
  }

  const hasNumber = /\d+/.test(bullet);
  if (!hasNumber) {
    errors.push("No numeric metric found - every bullet needs quantification");
  }

  if (bullet.endsWith(".")) {
    errors.push("Bullet ends with period - remove trailing period");
  }

  return { success: errors.length === 0, errors };
}

export function validateJsonOutput(text: string): { parsed: any; error: string | null } {
  try {
    const cleaned = text
      .replace(/```(json)?\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return { parsed, error: null };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { parsed, error: null };
      } catch {
        return { parsed: null, error: "Invalid JSON in response" };
      }
    }
    return { parsed: null, error: "No JSON found in response" };
  }
}
