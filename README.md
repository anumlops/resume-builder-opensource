# Resume Builder - Professional Skill for OpenCode

**An AI-powered resume generation engine using PAR framework, Harvard format, and ATS optimization.**

Stop writing generic resumes that get filtered by automated systems. This project gives you a structured, expert-driven pipeline that transforms raw experience into interview-winning resume content — all running locally through OpenCode/OpenDesign.

---

## Intent & Philosophy

Paid tools like Rezi ($25-70/mo), TopResume ($15-50/mo), and Teal lock career advice behind subscriptions. This is an **open-source alternative** built on the same professional frameworks used by Harvard Career Services, MIT CAPD, and executive recruiters.

Whats inside:

- **PAR/XYZ Framework** — Every bullet follows: Action Verb + Context + Quantified Result
- **Tiered Action Verb System** — 80+ power verbs ranked by impact (Tier 1/2/3)
- **ATS Optimization Engine** — Keyword matching, formatting validation, scoring (target 85%+)
- **Harvard Format** — Industry-standard resume structure, length rules, section ordering
- **Metric Enforcement** — Hard metrics, soft metrics, or estimation — every bullet quantified
- **Multi-LLM** — Works with Claude (best quality) or DeepSeek ($0.003/resume)

---

## How to Use in OpenCode / OpenDesign

This skill is registered at `C:\Users\Anu\.opencode\skills\professional-resume-builder\SKILL.md`.

### Method 1: In-Session (Recommended)

OpenCode/OpenDesign automatically discovers skills. When you need resume help:

```
# Start any session
# The skill loads automatically when you invoke it:

Skill -> professional-resume-builder

# Then provide your inputs:
```

The skill guides you through a 6-stage pipeline:

```
1. JOB DESCRIPTION ANALYSIS
   You: Paste the job description
   Skill: Extracts top 10 keywords, hard/soft skills, achievement domains,
          recommended action verbs, ATS strategy

2. ACHIEVEMENT ENRICHMENT
   You: Describe what you did (raw, in your own words)
   Skill: Identifies core achievement, impact category, potential metrics,
          baseline context, proof points, missing information to probe

3. BULLET GENERATION (3 options)
   Skill: Generates Results-First, Challenge-First, and Scope+Impact versions
          Each with: impact score, word count, keyword matches, recommendation

4. HARVARD FORMAT ASSEMBLY
   Skill: Compiles full resume with: Header -> Summary -> Experience ->
          Education -> Skills -> Optional sections + ATS metadata report

5. ATS COMPATIBILITY CHECK
   Skill: Scores keyword match %, verb quality, metric density, PAR compliance
          Flags weak verbs, missing keywords, formatting violations

6. REFINEMENT COACHING
   You: "Make bullet X stronger" or "Optimize for this keyword"
   Skill: Provides 3 new options with explanations of WHY each works better
```

### Method 2: CLI Tool

```bash
# 1. Install dependencies
npm install

# 2. Set up API keys in .env
#    MODEL_PROVIDER=deepseek (cheap) or anthropic (best quality)

# 3. Run commands
npm run cli -- analyze-jd < examples/sample-job-description.txt
npm run cli -- enrich "Led team of 5 engineers to redesign platform"
npm run cli -- generate "Reduced onboarding from 4 weeks to 2"
npm run cli -- refine "Responsible for managing social media accounts"

# 4. Full interactive session
npm run start -- --interactive
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/anumlops/resume-builder-opensource
cd resume-builder-opensource

# Install
npm install

# Set API key (get from https://platform.deepseek.com/api)
echo "DEEPSEEK_API_KEY=sk-your-key" > .env

# Run
npm run start -- --interactive
```

---

## Why This vs. Paid Tools

| Feature | Rezi | TopResume | Teal | Ours |
|---------|------|-----------|------|------|
| **Cost** | $25-70/month | $15-50/month | Free tier available | **FREE (API only)** |
| **Open Source** | ❌ | ❌ | ❌ | ✅ |
| **Customizable Prompts** | ❌ | ❌ | Limited | ✅ Full |
| **PAR Framework** | ✅ | ✅ | ✅ | ✅ Built-in |
| **ATS Optimization** | ✅ | ✅ | ✅ | ✅ |
| **Harvard Format** | ✅ | ✅ | ✅ | ✅ Default |
| **Self-Hosted** | ❌ | ❌ | ❌ | ✅ |
| **Multi-LLM** | ❌ | ❌ | ❌ | ✅ Claude/DeepSeek |

---

## Architecture

```
resume-builder-opensource/
  src/
    prompts/          # 7 modular prompt files (system + 6 components)
      system.prompt.txt          # Master system prompt (12 sections)
      analyze-jd.prompt.txt      # Component 1: JD analyzer
      enrich-achievement.txt     # Component 2: Achievement enricher
      generate-bullets.txt       # Component 3: Bullet generator
      check-ats.prompt.txt       # Component 4: ATS checker
      assemble-resume.txt        # Component 5: Resume assembler
      coach.prompt.txt           # Component 6: Refinement coach

    handlers/         # TypeScript wrappers for each stage
    api/              # LLM client (Anthropic + DeepSeek), validation, storage
    cli.ts            # CLI entry point
    index.ts          # Library entry point + interactive mode

  examples/           # Sample JD, experience, output
  tests/              # Test suite

  docs/
    plugin-setup.md     # Plugin installation guide for OpenCode

  src/opencode-plugin/
    tools/
      resume-builder.ts # Custom tool for bullet validation
```

**Cost estimate:** ~$0.003 per resume with DeepSeek, ~$0.11 with Claude.

---

## Example: Before & After

**Before (generic, no metrics, weak verb):**
"Responsible for managing customer relationships and improving satisfaction"

**After (PAR-compliant, Tier 1 verb, baseline context, business impact):**
"Spearheaded customer success strategy, increasing retention by 22% (78% to 95%) through personalized onboarding, preventing $340K churn annually"

---

## OpenCode Plugin Integration

This project includes a full OpenCode plugin that adds resume tools, a dedicated agent, and a `/resume` command.

### Plugin Files

The plugin is installed at `~/.opencode/` and consists of:

```
~/.opencode/
  tools/
    resume-builder.ts       # Custom tool: resume-validate-bullet
  plugins/
    ecc-hooks.ts            # Plugin registers the tool + event hooks
  skills/
    professional-resume-builder/
      SKILL.md              # Master skill prompt (12 sections)
  opencode.json             # Config: registers resume-coach agent + /resume command
```

### What Gets Registered

| Component | Name | Purpose |
|-----------|------|---------|
| **Tool** | `resume-validate-bullet` | Validates bullets against PAR rules (verb tier, word count, metrics, keywords). Returns score + fix suggestions. |
| **Agent** | `resume-coach` | Dedicated subagent that loads the SKILL.md automatically and calls the validation tool |
| **Command** | `/resume` | Quick access: `/resume <job description + experience>` dispatches to resume-coach |

### How to Install

```bash
# 1. Clone this repo
git clone https://github.com/anumlops/resume-builder-opensource
cd resume-builder-opensource

# 2. Copy plugin files to OpenCode
copy src\opencode-plugin\tools\resume-builder.ts %USERPROFILE%\.opencode\tools\
# (Update ecc-hooks.ts import + opencode.json agent/command as shown in docs/plugin-setup.md)

# 3. Restart OpenCode
# The tool, agent, and command are now available
```

### Using the Plugin

**Via command (easiest):**
```
/resume Senior Product Manager role at SaaS Co...
Looking for someone with technical background. My experience: I led 5 engineers...
```

**Via agent:**
```
@resume-coach I need to optimize this resume for a PM role...
```

**Via tool (called automatically by agent):**
The `resume-validate-bullet` tool checks: word count, verb tier (flags Tier 3 like "responsible for"), quantification (detects %, $, baseline context), keyword alignment against your JD, PAR compliance.

---

## License

MIT — Use freely for personal and commercial projects.

---

## Acknowledgments

Built with research from Harvard FAS Mignone Center for Career Success, MIT CAPD, Yale Career Office, and recruiting industry best practices.
