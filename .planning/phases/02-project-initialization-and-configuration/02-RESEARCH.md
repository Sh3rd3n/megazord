# Phase 2: Project Initialization and Configuration - Research

**Researched:** 2026-02-17
**Domain:** Claude Code skill-based project initialization, config schema design, ASCII art design systems
**Confidence:** HIGH

## Summary

Phase 2 transforms the `/mz:init` stub skill (currently `disable-model-invocation: true` with placeholder text) into a full interactive initialization flow. The skill operates entirely within Claude Code's skill system -- it is a `SKILL.md` that Claude interprets and executes, using `AskUserQuestion` for structured prompts and standard file I/O for creating `.planning/` artifacts. There is no TypeScript runtime to build for the init flow itself; the skill is markdown instructions that Claude follows.

The core deliverables are: (1) the `/mz:init` skill.md with deep context gathering and preset-based configuration, (2) the `megazord.config.json` Zod schema in `src/lib/config.ts` that validates and types the config for downstream TypeScript consumers, (3) the `/mz:settings` skill for post-init config changes, and (4) a shared design system file defining Megazord's visual identity tokens (banners, boxes, separators, symbols).

**Primary recommendation:** Build the init skill as a preset-first flow (user picks Strict/Balanced/Minimal, then overrides individual toggles), with the config schema as the single source of truth defined in TypeScript with Zod v4 and exported as a JSON-serializable default for the skill to reference.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Init flow experience: Claude decides the optimal flow structure (wizard vs preset-based) -- user deferred this choice
- Deep context gathering like GSD: vision, requirements, tech stack, conventions, constraints
- Auto-detect codebase when existing code present: analyze package.json, git history, file patterns -> pre-compile answers -> user validates/corrects
- When `.planning/` already exists (GSD migration): migrate and adapt existing structure to Megazord format automatically
- `--quick` flag for minimal setup: project name + default preset, skip deep gathering
- Full mode can be lengthy -- no artificial question limit. `--quick` is the escape hatch
- Post-init: show created files summary + suggest next step (e.g., "run /mz:plan to create roadmap")
- For greenfield projects: auto-advance option to roadmap creation after init completes
- Philosophy: Opinionated/strict -- everything enabled by default, users opt-out what they don't want
- Default model: Quality (Opus) -- quality-first approach, user decides during init
- Three preset profiles with override: Strict (everything on), Balanced (review + brainstorming on, TDD and CORTEX off), Minimal (only essential base features)
- Users pick a profile, then override individual toggles if desired
- Deep context like GSD: vision, requirements, tech stack, conventions, constraints -> full PROJECT.md
- Auto-detect pre-compiles answers from codebase analysis -- user validates/corrects rather than answering from scratch
- PROJECT.md structure: Claude decides (adaptive to project type vs fixed sections)
- Primary interface: `/mz:settings` -- overview of all current settings, user selects what to change
- JSON is well-structured and manually editable as fallback/escape hatch
- Config is global only -- no per-phase overrides. One set of settings for the entire project
- Hot reload behavior: Claude decides the most practical approach
- ASCII banner/logo at init startup -- "MEGAZORD" branding, first impression matters
- Framework-wide consistency -- every Megazord output follows the same visual style
- Tech/mecha/power tone -- reflects the Megazord name. Angular borders, energetic symbols, powerful feeling
- Not a TUI -- platform constraint: Claude Code skills use AskUserQuestion, not stdin. Rich markdown + ASCII art within text output
- Design system (shared visual tokens for boxes, separators, banners): Claude decides where to define it (within Phase 2 or as a shared utility)

### Claude's Discretion
- Init flow structure (wizard vs preset-first)
- PROJECT.md section organization (adaptive vs fixed)
- Hot reload vs next-session for config changes
- CLAUDE.md handling (generate, suggest, or leave to user)
- Design system placement (Phase 2 internal or shared module)
- Exact banner/logo ASCII art design

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-01 | User can initialize a project with `/mz:init` that creates `.planning/` structure (PROJECT.md, STATE.md, config) | Skill.md architecture pattern, AskUserQuestion flow, file creation via Claude tool calls |
| CONF-01 | `/mz:init` collects workflow preferences: mode (YOLO/interactive), depth, parallelization, git tracking | AskUserQuestion multi-question pattern from GSD reference, preset-first flow structure |
| CONF-02 | Workflow agents configurable: research before planning, plan verification, post-phase verification | Config schema `workflow` section with boolean toggles, preset profiles |
| CONF-03 | AI model selection for planning agents: quality (Opus), balanced (Sonnet), budget (Haiku) | Config schema `model_profile` enum, preset defaults |
| CONF-04 | All settings persistable and modifiable after init | `/mz:settings` skill reads/writes `megazord.config.json`, Zod schema validates |
| QUAL-05 | Quality settings configurable at init time: TDD on/off, review auto/manual/off, brainstorming on/off, debug systematic/quick | Config schema `quality` section, preset profiles define defaults |
| QUAL-07 | Quality configuration stored in `megazord.config.json` and respected by all execution workflows | Zod schema in `src/lib/config.ts` is the single source of truth, downstream skills import and parse |
| CRTX-06 | CORTEX configurable at init: on/off like other quality settings | Config schema `quality.cortex` boolean toggle, included in preset profiles |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.3.0 | Config schema validation + TypeScript type inference | Already a dependency; v4 has 14x faster parsing, `z.infer` generates types from schema |
| fs-extra | ^11.0.0 | File system operations (ensureDir, readJson, writeJson, pathExists) | Already a dependency; convenience wrappers over `node:fs` for recursive mkdir, JSON read/write |
| gray-matter | ^4.0.3 | YAML frontmatter parsing for skill.md files | Already a dependency; needed if config loader needs to parse skill metadata |
| picocolors | ^1.1.0 | Terminal color output for CLI messages | Already a dependency; used in existing `src/cli/utils/colors.ts` |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.0 | Unit testing for config schema validation and migration logic | Test config parsing, preset application, GSD migration |
| biome | ^2.3.0 | Linting and formatting | All TypeScript source files |
| tsdown | ^0.20.0 | Build pipeline | Bundling TypeScript to ESM |

### No Additional Dependencies Needed

Phase 2 requires zero new npm dependencies. Everything needed is already installed from Phase 1. The init flow itself is a skill.md (markdown instructions that Claude executes), not a compiled program. The only TypeScript code needed is the config schema definition and loader in `src/lib/config.ts`.

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 Additions)
```
src/
├── cli/               # Existing CLI (install/uninstall)
│   ├── index.ts
│   ├── commands/
│   └── utils/
└── lib/
    ├── paths.ts       # Existing path constants
    ├── config.ts      # NEW: Zod schema, types, defaults, presets, load/save
    └── design.ts      # NEW: Shared design system tokens (banners, boxes, symbols)

skills/
├── init/
│   ├── skill.md       # REPLACE: Full init flow (currently stub)
│   ├── questioning.md # NEW: Deep questioning reference (adapted from GSD)
│   ├── presets.md     # NEW: Preset profile definitions for Claude reference
│   └── migration.md   # NEW: GSD migration logic reference
├── settings/
│   └── skill.md       # NEW: /mz:settings skill
└── help/
    └── skill.md       # UPDATE: Mark init as Available, add settings
```

### Pattern 1: Skill-Driven Init (No TypeScript Runtime for Init)
**What:** The `/mz:init` skill is a SKILL.md file containing markdown instructions. Claude reads and follows these instructions, using its built-in tools (AskUserQuestion, Read, Write, Bash, Glob, Grep) to execute the flow. There is no TypeScript program that runs the init wizard.
**When to use:** Always -- this is how Claude Code skills work.
**Why this matters:** The skill.md IS the init program. Claude is the runtime. AskUserQuestion is the UI framework. The only TypeScript needed is the config schema definition that downstream skills import.

```markdown
# Example: Skill.md driving init flow (simplified)
---
name: init
description: Initialize a Megazord project with configuration and planning structure
disable-model-invocation: true
---

## Step 1: Display Banner
[ASCII art banner here]

## Step 2: Environment Check
Read the current directory. Check if `.planning/` exists.
If `.planning/PROJECT.md` exists: check for GSD format -> migrate.
If no `.planning/`: fresh init.

## Step 3: Preset Selection
Use AskUserQuestion:
- header: "Profile"
- question: "Select your quality profile"
- options:
  - "Strict (Recommended)" -- Everything on: TDD, review, brainstorming, CORTEX, debug mode
  - "Balanced" -- Review + brainstorming on, TDD and CORTEX off
  - "Minimal" -- Essential base features only
```

### Pattern 2: Config Schema as Single Source of Truth
**What:** The `megazord.config.json` schema is defined once in `src/lib/config.ts` using Zod. The TypeScript type is inferred from the schema. Preset profiles are also defined in this file. The skill.md references the schema's defaults but the schema itself is the canonical definition.
**When to use:** For any config read/write operation in downstream phases.

```typescript
// src/lib/config.ts
import { z } from "zod";

export const qualitySchema = z.object({
  tdd: z.boolean().default(true),
  review: z.enum(["auto", "manual", "off"]).default("auto"),
  brainstorming: z.boolean().default(true),
  cortex: z.boolean().default(true),
  debug: z.enum(["systematic", "quick"]).default("systematic"),
});

export const workflowSchema = z.object({
  research: z.boolean().default(true),
  plan_check: z.boolean().default(true),
  verifier: z.boolean().default(true),
});

export const configSchema = z.object({
  version: z.literal(1).default(1),
  project_name: z.string(),
  mode: z.enum(["yolo", "interactive"]).default("yolo"),
  depth: z.enum(["quick", "standard", "comprehensive"]).default("comprehensive"),
  parallelization: z.boolean().default(true),
  commit_docs: z.boolean().default(true),
  model_profile: z.enum(["quality", "balanced", "budget"]).default("quality"),
  quality: qualitySchema.default({}),
  workflow: workflowSchema.default({}),
});

export type MegazordConfig = z.infer<typeof configSchema>;

export const presets = {
  strict: { quality: { tdd: true, review: "auto", brainstorming: true, cortex: true, debug: "systematic" } },
  balanced: { quality: { tdd: false, review: "auto", brainstorming: true, cortex: false, debug: "quick" } },
  minimal: { quality: { tdd: false, review: "off", brainstorming: false, cortex: false, debug: "quick" } },
} as const;
```

### Pattern 3: AskUserQuestion Multi-Round Flow
**What:** Claude Code's AskUserQuestion supports multi-question arrays in a single call. Each question has a header (max 12 chars), question text, options array (with label + description), and optional multiSelect flag. Skills use this for structured user input.
**When to use:** Every configuration choice in the init flow.
**Constraint:** AskUserQuestion is NOT stdin. It is a Claude Code tool that presents structured options to the user. Skills cannot use readline, inquirer, or any terminal input library. All user interaction goes through AskUserQuestion or freeform conversation.

```markdown
## Example: Preset selection with override

Use AskUserQuestion:
```
questions: [
  {
    header: "Profile",
    question: "Select your quality profile (you can override individual settings next)",
    multiSelect: false,
    options: [
      { label: "Strict (Recommended)", description: "Everything on: TDD, review, brainstorming, CORTEX, systematic debug" },
      { label: "Balanced", description: "Review + brainstorming on, TDD and CORTEX off" },
      { label: "Minimal", description: "Essential base features only" }
    ]
  },
  {
    header: "Model",
    question: "AI model profile for planning agents",
    multiSelect: false,
    options: [
      { label: "Quality (Recommended)", description: "Opus everywhere — highest quality, higher cost" },
      { label: "Balanced", description: "Opus for planning, Sonnet for execution" },
      { label: "Budget", description: "Sonnet/Haiku — fastest, lowest cost" }
    ]
  }
]
```

### Pattern 4: GSD Migration Detection and Conversion
**What:** When `.planning/` exists with GSD-format files (config.json without version field, PROJECT.md with GSD-specific sections), the init skill detects this and migrates to Megazord format instead of starting fresh.
**When to use:** Automatically when `.planning/` is detected during init.

```markdown
## Migration detection logic (for skill.md)

1. Check if `.planning/config.json` exists
2. Read it -- if no `version` field, it's GSD format
3. Read `.planning/PROJECT.md` -- GSD format has same template structure
4. Migration steps:
   a. Read GSD config.json values (mode, depth, parallelization, commit_docs, model_profile, workflow)
   b. Map to Megazord schema: add version:1, add quality section (default to strict preset), rename file
   c. Preserve PROJECT.md as-is (compatible format)
   d. Create STATE.md if missing or update format
   e. Write megazord.config.json
   f. Optionally remove old config.json (or keep as backup)
5. Show user what was migrated, let them confirm/adjust
```

### Pattern 5: Design System as Shared Reference
**What:** A shared file defining Megazord's visual identity tokens: ASCII banners, box styles, separators, status symbols, progress indicators. All skills reference this file for consistent visual output.
**When to use:** Every user-facing output from any Megazord skill.

**Recommendation (Claude's Discretion): Place in `skills/init/design-system.md` as a supporting file, then copy/adapt to a shared location at `src/lib/design.ts` for programmatic use.** The design system should live as both:
1. A markdown reference file that skills can `@`-reference for visual tokens
2. A TypeScript module that exports string constants for any compiled code

### Anti-Patterns to Avoid
- **Building a TUI for init:** Claude Code skills cannot use stdin. Do not use inquirer, prompts, or any interactive terminal library. AskUserQuestion is the only structured input mechanism.
- **Putting all logic in TypeScript:** The init flow should be in skill.md, not compiled code. Claude IS the runtime. TypeScript is only for the schema definition and utilities that downstream phases need.
- **One giant skill.md:** Split supporting content (questioning guide, presets, migration logic) into separate files in the skill directory. Keep SKILL.md under 500 lines per Claude Code docs.
- **Config without schema validation:** Never read `megazord.config.json` directly with `JSON.parse`. Always parse through the Zod schema for type safety and default application.
- **Per-phase config overrides:** User explicitly decided against this. One global config for the entire project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config validation | Custom JSON validation logic | Zod v4 `configSchema.safeParse()` | Type inference, defaults, error messages all free |
| File creation with nested dirs | Manual `mkdirSync` + `writeFileSync` chains | `fs-extra` `ensureDir` + `writeJson` | Handles recursive creation, JSON formatting |
| Codebase detection | Custom file scanning | `glob` patterns + `package.json` reading | Already proven in GSD's brownfield detection |
| User interaction | Terminal prompts / readline | AskUserQuestion tool | Platform constraint: only way to get structured input in Claude Code skills |
| Markdown template rendering | String concatenation | Template files in skill directory | Cleaner, editable, versionable |

**Key insight:** The init flow is a SKILL that Claude executes, not a program you compile. The only compiled code is the config schema and utilities. Everything else is Claude following markdown instructions.

## Common Pitfalls

### Pitfall 1: Confusing Skill Execution with Program Execution
**What goes wrong:** Treating skill.md as a specification that a TypeScript program implements, rather than as instructions Claude directly follows.
**Why it happens:** Developer instinct is to write code. But Claude Code skills are interpreted by Claude, not compiled.
**How to avoid:** The skill.md IS the init program. Claude reads it, follows the steps, calls AskUserQuestion, writes files. No TypeScript wrapper needed for the flow itself.
**Warning signs:** Creating a `src/cli/commands/init.ts` that replicates what the skill does.

### Pitfall 2: AskUserQuestion Header Length Violation
**What goes wrong:** AskUserQuestion headers longer than 12 characters are rejected by Claude Code.
**Why it happens:** Natural tendency to use descriptive headers like "Quality Settings" (16 chars).
**How to avoid:** Keep headers to single words: "Profile", "Model", "Mode", "Depth", "Quality", "TDD", "Review", "Research", "Git".
**Warning signs:** Headers like "Brainstorming", "Parallelization", "Configuration".

### Pitfall 3: Config Schema Drift Between Skill and TypeScript
**What goes wrong:** The skill.md describes config options that don't match the Zod schema, or the schema has fields the skill doesn't set.
**Why it happens:** Skill and schema are maintained separately.
**How to avoid:** The Zod schema is the single source of truth. The skill.md references it. When adding a config option, update the schema FIRST, then update the skill. Preset definitions should be in TypeScript (exported from config.ts) and mirrored in the skill's presets.md reference file.
**Warning signs:** Runtime Zod parse errors when loading config created by init.

### Pitfall 4: Losing GSD Config During Migration
**What goes wrong:** Migration overwrites GSD config.json before reading it, or fails to map all GSD fields to Megazord equivalents.
**Why it happens:** GSD config has fields like `workflow.auto_advance` and `git.branching_strategy` that Megazord may not have 1:1 equivalents for yet.
**How to avoid:** Read GSD config FIRST, create Megazord config from mapped values, preserve unmapped values in a `_migrated_from_gsd` metadata field, write new file, keep backup.
**Warning signs:** Users who migrate lose their mode/depth/model preferences.

### Pitfall 5: Context Budget Bloat from Large Skill Files
**What goes wrong:** The init skill.md exceeds context budget, pushing out other skills' descriptions.
**Why it happens:** Cramming everything (questioning guide, all presets, migration logic, design system) into one file.
**How to avoid:** Use supporting files. Keep SKILL.md under 500 lines. Reference `questioning.md`, `presets.md`, `migration.md` as supporting files that Claude reads on demand. Since init has `disable-model-invocation: true`, its description is NOT loaded into context until the user invokes it.
**Warning signs:** Running `/context` shows skill budget exceeded.

### Pitfall 6: Not Handling Existing `.planning/` That Is NOT GSD
**What goes wrong:** User has a `.planning/` directory from some other tool or manual creation. Init assumes it's either fresh or GSD.
**Why it happens:** Only testing happy paths (fresh dir, GSD migration).
**How to avoid:** Check for `megazord.config.json` (already initialized), then `config.json` without version field (GSD), then unknown `.planning/` (ask user what to do: overwrite, merge, abort).
**Warning signs:** Silently overwriting user's existing planning documents.

## Code Examples

### Config Schema with Presets (Zod v4)

```typescript
// src/lib/config.ts
// Source: Zod v4 docs (https://zod.dev/api)
import { z } from "zod";

// Quality settings schema
export const qualitySchema = z.object({
  tdd: z.boolean().default(true),
  review: z.enum(["auto", "manual", "off"]).default("auto"),
  brainstorming: z.boolean().default(true),
  cortex: z.boolean().default(true),
  debug: z.enum(["systematic", "quick"]).default("systematic"),
});

// Workflow agent settings
export const workflowSchema = z.object({
  research: z.boolean().default(true),
  plan_check: z.boolean().default(true),
  verifier: z.boolean().default(true),
});

// Full config schema
export const configSchema = z.object({
  // Schema version for future migrations
  version: z.literal(1).default(1),

  // Project identity
  project_name: z.string(),

  // Workflow preferences
  mode: z.enum(["yolo", "interactive"]).default("yolo"),
  depth: z.enum(["quick", "standard", "comprehensive"]).default("comprehensive"),
  parallelization: z.boolean().default(true),
  commit_docs: z.boolean().default(true),

  // AI model selection
  model_profile: z.enum(["quality", "balanced", "budget"]).default("quality"),

  // Quality discipline
  quality: qualitySchema.default({}),

  // Workflow agents
  workflow: workflowSchema.default({}),
});

// Inferred TypeScript type
export type MegazordConfig = z.infer<typeof configSchema>;

// Preset profiles
export const presets: Record<string, Partial<MegazordConfig>> = {
  strict: {
    model_profile: "quality",
    quality: {
      tdd: true,
      review: "auto",
      brainstorming: true,
      cortex: true,
      debug: "systematic",
    },
    workflow: {
      research: true,
      plan_check: true,
      verifier: true,
    },
  },
  balanced: {
    model_profile: "balanced",
    quality: {
      tdd: false,
      review: "auto",
      brainstorming: true,
      cortex: false,
      debug: "quick",
    },
    workflow: {
      research: true,
      plan_check: true,
      verifier: true,
    },
  },
  minimal: {
    model_profile: "budget",
    quality: {
      tdd: false,
      review: "off",
      brainstorming: false,
      cortex: false,
      debug: "quick",
    },
    workflow: {
      research: false,
      plan_check: false,
      verifier: false,
    },
  },
};
```

### Config Load/Save Utilities

```typescript
// src/lib/config.ts (continued)
import { readJsonSync, writeJsonSync, pathExistsSync } from "fs-extra";
import { join } from "node:path";

const CONFIG_FILENAME = "megazord.config.json";

/** Load and validate config from .planning/ directory */
export function loadConfig(planningDir: string): MegazordConfig {
  const configPath = join(planningDir, CONFIG_FILENAME);
  if (!pathExistsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}. Run /mz:init first.`);
  }
  const raw = readJsonSync(configPath);
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }
  return result.data;
}

/** Save config to .planning/ directory */
export function saveConfig(planningDir: string, config: MegazordConfig): void {
  const configPath = join(planningDir, CONFIG_FILENAME);
  writeJsonSync(configPath, config, { spaces: 2 });
}

/** Apply a preset to a partial config */
export function applyPreset(
  presetName: keyof typeof presets,
  overrides?: Partial<MegazordConfig>
): Partial<MegazordConfig> {
  const preset = presets[presetName];
  return { ...preset, ...overrides };
}
```

### GSD Migration Detection

```typescript
// src/lib/config.ts (continued)

interface GsdConfig {
  mode?: string;
  depth?: string;
  parallelization?: boolean;
  commit_docs?: boolean;
  model_profile?: string;
  workflow?: {
    research?: boolean;
    plan_check?: boolean;
    verifier?: boolean;
    auto_advance?: boolean;
  };
  git?: {
    branching_strategy?: string;
  };
}

/** Detect if .planning/ contains GSD-format config */
export function detectGsdConfig(planningDir: string): GsdConfig | null {
  const configPath = join(planningDir, "config.json");
  if (!pathExistsSync(configPath)) return null;

  const raw = readJsonSync(configPath);
  // GSD config has no `version` field; Megazord configs always have version: 1
  if (raw.version !== undefined) return null;

  return raw as GsdConfig;
}

/** Migrate GSD config to Megazord format */
export function migrateGsdConfig(gsd: GsdConfig, projectName: string): MegazordConfig {
  const partial: Record<string, unknown> = {
    project_name: projectName,
    mode: gsd.mode ?? "yolo",
    depth: gsd.depth ?? "comprehensive",
    parallelization: gsd.parallelization ?? true,
    commit_docs: gsd.commit_docs ?? true,
    model_profile: gsd.model_profile ?? "quality",
    workflow: {
      research: gsd.workflow?.research ?? true,
      plan_check: gsd.workflow?.plan_check ?? true,
      verifier: gsd.workflow?.verifier ?? true,
    },
    // Quality defaults to strict preset for GSD migrations
    quality: presets.strict.quality,
  };

  return configSchema.parse(partial);
}
```

### Codebase Auto-Detection Pattern

```typescript
// Pattern for auto-detect (skill uses via Bash/Read tools, not compiled)
// This shows what the skill.md instructs Claude to do:

// 1. Check for package.json
//    Read package.json -> extract: name, dependencies, devDependencies, scripts
//    Infer: language (TS if typescript in devDeps), framework, test runner, build tool

// 2. Check git history
//    Run: git log --oneline -20
//    Infer: team size (author count), activity level, conventional commits

// 3. Check file patterns
//    Glob: src/**/*.{ts,tsx,js,jsx} -> language distribution
//    Glob: *.config.{ts,js,json} -> tooling (eslint, prettier, vitest, etc.)
//    Glob: **/*.test.* -> test presence and patterns

// 4. Pre-compile answers
//    "I detected: TypeScript project using Bun, Vitest for testing,
//     Biome for linting, tsdown for building. Does this match?"
```

### ASCII Banner Design (Megazord Visual Identity)

```
// Recommended banner for /mz:init startup
// Tech/mecha aesthetic with angular borders

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███╗   ███╗███████╗ ██████╗  █████╗ ███████╗       ║
║   ████╗ ████║██╔════╝██╔════╝ ██╔══██╗██╔══██╗       ║
║   ██╔████╔██║█████╗  ██║  ███╗███████║██████╔╝       ║
║   ██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║██╔══██╗       ║
║   ██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║██║  ██║       ║
║   ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝       ║
║                                                       ║
║   ⚡ MEGAZORD v0.1.0                                  ║
║   Project Management × Code Quality × Agent Teams     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Design System Tokens (Megazord Brand)

```markdown
# Megazord Design System

## Stage Banners (replacing GSD's ━━━ pattern)
╔═══════════════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► {STAGE NAME}                           ║
╚═══════════════════════════════════════════════════════╝

## Action Boxes
╔═══════════════════════════════════════════════════════╗
║  {TITLE}                                              ║
╠═══════════════════════════════════════════════════════╣
║  {Content}                                            ║
╚═══════════════════════════════════════════════════════╝

## Separators
═══════════════════════════════════════════════════════

## Status Symbols
⚡ Active / Current / Power
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚠  Warning

## Progress Display
Power: ██████████░░░░░░░░░░ 50%

## Section Headers
▸ {Section Name}

## Next Up Block
═══════════════════════════════════════════════════════
▸ Next Up
**{Phase/Task Name}** — {description}
`/mz:command`
═══════════════════════════════════════════════════════
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD `.planning/config.json` (unversioned) | `megazord.config.json` with `version: 1` field | Phase 2 | Enables future config migrations |
| GSD: workflow config only | Megazord: workflow + quality + CORTEX in one schema | Phase 2 | Single config file for all settings |
| Superpowers: always-on skills, no config | Megazord: configurable quality toggles | Phase 2 | Users can opt-out of TDD, review, etc. |
| GSD: `config.json` + manual editing | Megazord: `/mz:settings` skill + JSON fallback | Phase 2 | Structured settings UI + escape hatch |
| GSD: separate questioning reference | Megazord: questioning guide as skill supporting file | Phase 2 | Co-located with the skill that uses it |

**Deprecated/outdated:**
- GSD's `~/.gsd/defaults.json` global defaults: Megazord does not need global defaults since presets serve the same purpose (pick Strict/Balanced/Minimal and go)

## Recommendations (Claude's Discretion Areas)

### 1. Init Flow Structure: Preset-First (Recommended)

**Recommendation: Preset-first, then override.**

Rationale: The user already decided on three presets (Strict/Balanced/Minimal). A preset-first flow lets users get to a working config in 2 questions (profile + model), then optionally drill into individual settings. This is faster than a sequential wizard that asks every toggle one by one.

Flow:
1. Banner display
2. Environment detection + GSD migration check
3. Quick mode check (`--quick` flag)
4. Preset selection (Strict/Balanced/Minimal)
5. Model selection (Quality/Balanced/Budget)
6. "Customize further?" gate -> if yes, individual toggle overrides
7. Workflow preferences (mode, depth, parallelization, git tracking)
8. Deep context gathering (project vision, tech stack, conventions)
9. Write files (megazord.config.json, PROJECT.md, STATE.md)
10. Summary + next step suggestion

### 2. PROJECT.md Structure: Fixed Sections (Recommended)

**Recommendation: Fixed section structure, same as GSD template.**

Rationale: The GSD PROJECT.md template (What This Is, Core Value, Requirements, Context, Constraints, Key Decisions) is battle-tested and works well. Adaptive sections add complexity without clear benefit for the init phase. Future phases can add project-type-specific sections if needed.

### 3. Hot Reload vs Next-Session: Next-Session (Recommended)

**Recommendation: Config changes take effect next session (or on next skill invocation).**

Rationale: Claude Code skills load at session start or on invocation. There is no "hot reload" mechanism in the skill system itself. Config is read from `megazord.config.json` each time a skill runs. Since skills read config at invocation time (not cached globally), changes via `/mz:settings` automatically take effect on the next skill invocation within the same session. This is effectively "hot reload" without any special mechanism.

### 4. CLAUDE.md Handling: Suggest, Don't Generate (Recommended)

**Recommendation: After init, suggest adding Megazord-relevant entries to CLAUDE.md but do NOT auto-generate or modify it.**

Rationale: CLAUDE.md is the user's space. Auto-modifying it would be presumptuous. Instead, show a suggestion block:
```
Tip: Add to your project's .claude/CLAUDE.md:
  "This project uses Megazord. Run /mz:status for current state."
```

### 5. Design System Placement: Shared Supporting File (Recommended)

**Recommendation: Create `skills/init/design-system.md` as the canonical design system, then reference it from other skills as they're built in later phases.**

Rationale: In Phase 2, only init and settings need the design system. Creating a TypeScript module (`src/lib/design.ts`) is overkill until compiled code needs visual output (Phase 3+). Start with a markdown file that skills reference. Evolve to TypeScript module when needed.

Practical approach:
- Phase 2: `skills/init/design-system.md` (markdown reference for init + settings skills)
- Phase 3+: If compiled code needs design tokens, create `src/lib/design.ts` exporting string constants

### 6. ASCII Banner Design: Angular Tech Aesthetic

**Recommendation: Use double-line box drawing characters (═, ║, ╔, ╗, ╚, ╝) for all Megazord UI elements.** The ⚡ symbol as the Megazord icon. "MEGAZORD" in block letters for the init banner only; simpler `⚡ MEGAZORD ►` prefix for stage banners during regular operations.

This creates visual distinction from GSD (which uses ━━━ single-line) and Superpowers (which has no consistent design system).

## Open Questions

1. **`megazord.config.json` location: `.planning/` root or project root?**
   - What we know: Requirements say "creates `.planning/` directory with PROJECT.md, STATE.md, and `megazord.config.json`" -- implying all three are in `.planning/`
   - What's unclear: Some frameworks place config at project root (`.megazordrc.json`, `megazord.config.json`) for discoverability
   - Recommendation: Place in `.planning/` as specified. The config is project-planning config, not a toolchain config. Downstream skills know to look in `.planning/`.

2. **Should `--quick` flag create PROJECT.md at all?**
   - What we know: Quick mode = "project name + default preset, skip deep gathering"
   - What's unclear: Without deep questioning, PROJECT.md would be very thin (just name + "What This Is" stub)
   - Recommendation: Create a minimal PROJECT.md with just the project name and a placeholder. User can flesh it out later or re-run without `--quick`.

3. **Config file format: `.json` vs `.jsonc` (JSON with comments)?**
   - What we know: User wants it "well-structured and manually editable"
   - What's unclear: Standard JSON doesn't support comments; JSONC does but needs different parsers
   - Recommendation: Use standard `.json`. Add a `"$schema"` field pointing to a future JSON schema for editor autocomplete, and use descriptive field names that serve as self-documentation.

## Sources

### Primary (HIGH confidence)
- Claude Code Skills documentation (https://code.claude.com/docs/en/skills) - Skill.md format, frontmatter, AskUserQuestion, supporting files, context constraints
- Zod v4 API (https://zod.dev/api) - Schema definition, defaults, enums, type inference, safeParse
- Existing Megazord codebase (Phase 1 output) - `src/`, `skills/`, `package.json`, `tsdown.config.ts` - verified current architecture

### Secondary (MEDIUM confidence)
- GSD `new-project.md` workflow (local: `~/.claude/get-shit-done/workflows/new-project.md`) - Reference implementation for init flow, AskUserQuestion patterns, config.json format
- GSD `settings.md` workflow (local: `~/.claude/get-shit-done/workflows/settings.md`) - Reference for post-init settings management
- GSD `questioning.md` reference (local: `~/.claude/get-shit-done/references/questioning.md`) - Deep questioning methodology
- GSD `ui-brand.md` reference (local: `~/.claude/get-shit-done/references/ui-brand.md`) - Visual pattern tokens (to adapt, not copy)
- Superpowers plugin (local: `~/.claude/plugins/cache/claude-plugins-official/superpowers/4.3.0/`) - Quality skill structure reference

### Tertiary (LOW confidence)
- AskUserQuestion behavior in skills (https://github.com/anthropics/claude-code/issues/9846) - Known bug: AskUserQuestion may not work in skills until plan mode is toggled. Flagged for validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, APIs verified against official docs
- Architecture: HIGH - Skill-based architecture verified against Claude Code docs, GSD reference implementation examined
- Config schema: HIGH - Zod v4 API verified, schema design informed by both GSD config and Superpowers quality settings
- Design system: MEDIUM - Visual design is subjective; ASCII art rendering varies by terminal
- GSD migration: MEDIUM - Migration logic inferred from GSD source code analysis, not tested
- Pitfalls: HIGH - AskUserQuestion constraints verified via Claude Code docs and GSD usage patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days - stable domain, no fast-moving dependencies)
