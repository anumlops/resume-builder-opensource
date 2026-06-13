# Plugin Setup Guide

Install the resume builder as an OpenCode plugin with a custom tool, agent, and command.

## Prerequisites

- OpenCode installed at `~/.opencode/`
- `@opencode-ai/plugin` package available (bundled with OpenCode)

## Installation Steps

### Step 1: Copy the Tool File

```bash
# From this repo to OpenCode
copy src\opencode-plugin\tools\resume-builder.ts %USERPROFILE%\.opencode\tools\
```

### Step 2: Register in Plugin

Edit `%USERPROFILE%\.opencode\plugins\ecc-hooks.ts`:

Add the import at the top:
```typescript
import resumeBulletTool from "../tools/resume-builder.js"
```

Add to the `tool` return object:
```typescript
tool: {
  "changed-files": changedFilesTool,
  "resume-validate-bullet": resumeBulletTool,   // <-- add this
},
```

### Step 3: Add Agent + Command

Edit `%USERPROFILE%\.opencode\opencode.json`:

Add to the `agent` section (before the closing `}`):
```json
"resume-coach": {
  "description": "Professional resume coach using PAR framework, Harvard format, and ATS optimization. Transforms raw experience into interview-winning content.",
  "mode": "subagent",
  "model": "anthropic/claude-sonnet-4-5",
  "prompt": "{file:skills/professional-resume-builder/SKILL.md}\n\nYou are an expert resume coach... Always validate bullets using the resume-validate-bullet tool before finalizing.",
  "tools": {
    "read": true,
    "write": true,
    "edit": true,
    "bash": true
  }
}
```

Add to the `command` section:
```json
"resume": {
  "description": "Build or refine a resume using PAR framework, Harvard format, and ATS optimization.",
  "template": "{file:skills/professional-resume-builder/SKILL.md}\n\nUSER REQUEST:\n$ARGUMENTS",
  "agent": "resume-coach",
  "subtask": true
}
```

### Step 4: Verify

```bash
# Check TypeScript compiles
cd %USERPROFILE%\.opencode
npx tsc --noEmit

# Should output nothing (no errors)
```

### Step 5: Restart OpenCode

The tool, agent, and command are now available.

## How to Use

**Command:** `/resume <job description + experience>`

**Agent:** `@resume-coach optimize this bullet...`

**Tool:** Called automatically by the agent, or use the `resume-validate-bullet` tool directly
