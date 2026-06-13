/**
 * Resume Builder Tool for OpenCode
 *
 * Provides deterministic resume bullet validation against the
 * PAR framework, Tier 1-2 verb system, and ATS formatting rules.
 *
 * Designed to work alongside the professional-resume-builder skill.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

const TIER_1_VERBS = [
  "accelerated", "amplified", "boosted", "capitalized", "drove",
  "elevated", "multiplied", "skyrocketed", "surged",
  "decreased", "eliminated", "halved", "minimized", "optimized",
  "slashed", "streamlined", "trimmed",
  "architected", "built", "conceived", "designed", "engineered",
  "founded", "pioneered", "prototyped",
  "championed", "directed", "galvanized", "orchestrated",
  "spearheaded", "stewarded", "transformed",
  "enhanced", "fortified", "perfected", "polished", "refined",
  "solidified", "strengthened",
]

const TIER_2_VERBS = [
  "analyzed", "assessed", "diagnosed", "evaluated", "examined", "investigated",
  "created", "developed", "executed", "implemented", "launched", "structured",
  "coordinated", "delegated", "directed", "led", "managed", "mentored", "supervised",
  "articulated", "communicated", "conveyed", "presented", "pitched", "proposed",
]

const TIER_3_PHRASES = [
  "responsible for", "involved in", "assisted with", "helped with",
  "worked on", "contributed to",
]

const resumeBulletTool: ToolDefinition = tool({
  description:
    "Validate a resume bullet against PAR framework rules (Tier 1/2 verb, quantified metric, word count, baseline context). Returns pass/fail with specific fix suggestions.",

  args: {
    bullet: tool.schema
      .string()
      .describe("The resume bullet text to validate"),

    jobKeywords: tool.schema
      .string()
      .optional()
      .describe("Comma-separated keywords from the target job description for alignment check"),

    industry: tool.schema
      .string()
      .optional()
      .describe("Industry for verb recommendation (tech, sales, marketing, finance, management)"),
  },

  async execute(args) {
    const { bullet, jobKeywords, industry } = args
    const checks: Record<string, { status: "pass" | "fail" | "warn"; message: string }> = {}
    const suggestions: string[] = []
    let score = 100

    // Check 1: Word count
    const words = bullet.split(/\s+/).filter(Boolean)
    const wc = words.length
    if (wc < 5) {
      checks.wordCount = { status: "fail", message: `Too short: ${wc} words (min 5)` }
      suggestions.push("Add more context about the challenge, method, and result")
      score -= 20
    } else if (wc > 25) {
      checks.wordCount = { status: "fail", message: `Too long: ${wc} words (max 25)` }
      suggestions.push(`Trim ${wc - 25} words. Remove adverbs and redundant phrases.`)
      score -= 15
    } else if (wc > 20) {
      checks.wordCount = { status: "warn", message: `${wc} words (target 15-20)` }
      score -= 5
    } else {
      checks.wordCount = { status: "pass", message: `${wc} words (excellent)` }
    }

    // Check 2: Verb quality
    const lower = bullet.toLowerCase().trim()
    let startsWithTier3 = false
    for (const phrase of TIER_3_PHRASES) {
      if (lower.startsWith(phrase)) {
        startsWithTier3 = true
        checks.verbQuality = {
          status: "fail",
          message: `Starts with weak verb: "${phrase}" (Tier 3 - AVOID)`,
        }
        const recommendation = getVerbSuggestion(phrase, industry || "general")
        suggestions.push(`Replace "${phrase}" with a Tier 1/2 verb like "${recommendation}"`)
        score -= 25
        break
      }
    }

    if (!startsWithTier3) {
      const firstWord = lower.split(/\s+/)[0]
      if (TIER_1_VERBS.includes(firstWord)) {
        checks.verbQuality = { status: "pass", message: `Starts with Tier 1 power verb: "${firstWord}"` }
      } else if (TIER_2_VERBS.includes(firstWord)) {
        checks.verbQuality = { status: "warn", message: `Starts with Tier 2 strong verb: "${firstWord}" (Tier 1 available)` }
        score -= 5
        const tier1 = getTier1Suggestion(firstWord)
        if (tier1) suggestions.push(`Consider "${tier1}" instead of "${firstWord}" for more impact`)
      } else {
        checks.verbQuality = { status: "warn", message: `First word "${firstWord}" not in verb library. Use Tier 1 or Tier 2.` }
        suggestions.push(`Replace "${firstWord}" with a recognized action verb`)
        score -= 10
      }
    }

    // Check 3: Quantification
    const hasNumber = /\d+/.test(bullet)
    const hasPercent = /%/.test(bullet)
    const hasDollar = /[\$€£]/.test(bullet)
    if (hasNumber) {
      const detail = [hasPercent ? "%" : null, hasDollar ? "$" : null].filter(Boolean).join(" + ")
      checks.quantification = { status: "pass", message: `Contains metrics (number${detail ? ` + ${detail}` : ""})` }
      // Check for baseline context when percentage present
      if (hasPercent) {
        const hasBaseline = /from\s+\d/.test(lower) || /\(/.test(bullet)
        if (!hasBaseline) {
          checks.quantification = { status: "warn", message: "Percentage found but no baseline context (e.g., 'from X to Y'). Add baseline." }
          suggestions.push("Add baseline context: 'increased X by Y% (from A to B)'")
          score -= 10
        }
      }
    } else {
      checks.quantification = { status: "fail", message: "No numeric metric found. Every bullet needs quantification." }
      suggestions.push("Add a hard metric (%, $, count) or soft metric (scope indicator, timeline)")
      score -= 25
    }

    // Check 4: Punctuation
    if (bullet.endsWith(".")) {
      checks.punctuation = { status: "fail", message: "Ends with period. Remove trailing period." }
      suggestions.push("Delete the '.' at the end")
      score -= 5
    } else {
      checks.punctuation = { status: "pass", message: "No trailing period" }
    }

    // Check 5: Tense
    const ingEnding = /\w+ing\s/.test(bullet)
    if (ingEnding) {
      checks.tense = { status: "warn", message: "May use present participle (-ing). Use simple past tense." }
      score -= 5
    } else {
      checks.tense = { status: "pass", message: "Tense appears correct" }
    }

    // Check 6: PAR structure
    const hasAction = TIER_1_VERBS.some(v => bullet.toLowerCase().startsWith(v)) ||
                      TIER_2_VERBS.some(v => bullet.toLowerCase().startsWith(v))
    const hasContext = words.length >= 8
    const hasResult = hasNumber
    const parScore = [hasAction, hasContext, hasResult].filter(Boolean).length
    if (parScore < 3) {
      const missing: string[] = []
      if (!hasAction) missing.push("Action verb")
      if (!hasContext) missing.push("Context (scope/what you did)")
      if (!hasResult) missing.push("Quantified Result")
      checks.parCompliance = { status: "warn", message: `PAR: ${parScore}/3 complete. Missing: ${missing.join(", ")}` }
      if (missing.length > 1) score -= 10
      else score -= 5
    } else {
      checks.parCompliance = { status: "pass", message: "PAR: 3/3 elements present (Action + Context + Result)" }
    }

    // Check 7: Keyword alignment
    if (jobKeywords) {
      const keywords = jobKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean)
      const lowerBullet = bullet.toLowerCase()
      const matched = keywords.filter(k => lowerBullet.includes(k))
      const matchRate = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0
      if (matchRate >= 50) {
        checks.keywordAlignment = { status: "pass", message: `${matched.length}/${keywords.length} keywords matched (${matchRate}%)` }
      } else if (matchRate > 0) {
        checks.keywordAlignment = { status: "warn", message: `${matched.length}/${keywords.length} keywords matched (${matchRate}%). Add more JD keywords.` }
        const missing = keywords.filter(k => !lowerBullet.includes(k)).slice(0, 3)
        suggestions.push(`Incorporate keywords: ${missing.join(", ")}`)
        score -= 10
      } else {
        checks.keywordAlignment = { status: "fail", message: "0 keywords matched from job description" }
        suggestions.push(`Add keywords: ${keywords.join(", ")}`)
        score -= 15
      }
    } else {
      checks.keywordAlignment = { status: "pass", message: "No JD keywords provided for comparison" }
    }

    const finalScore = Math.max(0, score)
    const verdict = finalScore >= 80 ? "EXCELLENT" : finalScore >= 60 ? "GOOD" : finalScore >= 40 ? "NEEDS WORK" : "REWRITE"

    return JSON.stringify({
      bullet,
      wordCount: wc,
      overallScore: finalScore,
      verdict,
      checks,
      suggestions: suggestions.slice(0, 5),
      summary:
        finalScore >= 80
          ? "This bullet is strong. Minor tweaks only if needed."
          : finalScore >= 60
            ? "Solid foundation. Address warnings to strengthen."
            : "Needs significant revision. Focus on verb + metric first.",
    })
  },
})

export default resumeBulletTool

function getVerbSuggestion(tier3Phrase: string, industry: string): string {
  const map: Record<string, Record<string, string[]>> = {
    "responsible for": {
      tech: ["Architected", "Engineered", "Built"],
      sales: ["Accelerated", "Closed", "Cultivated"],
      marketing: ["Amplified", "Drove", "Generated"],
      finance: ["Optimized", "Streamlined", "Forecasted"],
      management: ["Championed", "Developed", "Transformed"],
      general: ["Led", "Managed", "Delivered"],
    },
    "involved in": {
      general: ["Led", "Executed", "Contributed"],
    },
    "assisted with": {
      general: ["Supported", "Facilitated", "Enabled"],
    },
    "helped with": {
      general: ["Enabled", "Improved", "Strengthened"],
    },
    "worked on": {
      general: ["Built", "Developed", "Designed"],
    },
    "contributed to": {
      general: ["Drove", "Delivered", "Advanced"],
    },
  }
  const phrase = tier3Phrase.toLowerCase()
  const norm = Object.keys(map).find(k => phrase.includes(k))
  if (!norm) return "Led, Managed, or Spearheaded"
  const verbs = map[norm]?.[industry] || map[norm]?.general || map["responsible for"].general
  return verbs[0] || "Led"
}

function getTier1Suggestion(tier2Verb: string): string | null {
  const upgrades: Record<string, string> = {
    led: "Spearheaded",
    managed: "Orchestrated",
    created: "Architected",
    developed: "Engineered",
    implemented: "Deployed",
    mentored: "Elevated",
    analyzed: "Diagnosed",
    evaluated: "Assessed",
    executed: "Delivered",
    launched: "Pioneered",
  }
  return upgrades[tier2Verb] || null
}
