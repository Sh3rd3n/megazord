# Phase 3: Core Skills and State Management - Research

**Researched:** 2026-02-17
**Domain:** Claude Code skill authoring, state lifecycle management, git stash integration, subagent orchestration patterns
**Confidence:** HIGH

## Summary

Phase 3 transforms five stub skills (`/mz:plan`, `/mz:status`, `/mz:pause`, `/mz:resume`, `/mz:quick`) into functional implementations and updates all remaining stub skills with informative phase-specific messages. This is a skill-authoring phase -- the deliverables are SKILL.md files that Claude interprets at runtime, plus supporting TypeScript tooling in `src/lib/` for state management operations that Markdown skills cannot reliably perform (JSON parsing, structured file updates, git stash operations, progress calculations).

The architecture is already established from Phase 2: skills are Markdown instructions that Claude follows, using Read/Write/Bash/Glob/Grep/AskUserQuestion tools. The design system (`skills/init/design-system.md`) defines all visual tokens. The config schema (`src/lib/config.ts`) is the single source of truth for project settings. STATE.md is the cross-session persistence layer. Phase 3 extends this foundation with the state lifecycle (create state -> update state -> pause -> resume -> track progress) and the planning workflow (research -> plan -> track).

Context management (PROJ-11) is addressed through the existing patterns: fresh subagent spawning for plan/execute operations, dimensioned state files (STATE.md is compact and structured for lazy loading), and skills reading only what they need via targeted file reads. No new context management infrastructure is needed -- the existing file-on-disk approach with structured markdown sections provides the necessary dimensioning.

**Primary recommendation:** Build skills as Markdown SKILL.md files following the Phase 2 patterns (design-system reference, AskUserQuestion for interaction, supporting files for complex logic). Add a TypeScript state management module (`src/lib/state.ts`) for structured STATE.md operations, and extend `src/cli/index.ts` with CLI subcommands that skills call via Bash. Keep the TypeScript layer thin -- it is a helper for operations Markdown cannot do, not an application framework.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Planning workflow (/mz:plan)
- Research runs by default before planning; `--skip-research` flag to skip it
- Multi-plan approach like GSD: a phase can have multiple plans (01, 02, 03...) executed in sequence; the planner decides how many are needed
- Task granularity is adaptive: simple tasks get coarse decomposition, complex tasks get fine-grained breakdown
- Soft check for CONTEXT.md: if missing, warns the user ("No context found -- run /mz:discuss first for better results, or continue without") but doesn't block

#### Status & progress (/mz:status)
- Two verbosity levels: compact by default, `--verbose` for detailed view with individual tasks and metrics
- Always suggests next action at the end ("Next Up" section with the appropriate command)
- Progress bar uses text blocks: `[###..........] 25%` (using Unicode block characters per design system)
- Shows last error context if the most recent session had problems -- helps users resume after failures

#### Session lifecycle (/mz:pause, /mz:resume)
- Pause captures snapshot + `git stash`: modified files are stashed, stash ref recorded in STATE.md. Resume does `stash pop`
- Resume shows context and suggests next step ("Would you like to continue with /mz:go?") but does NOT auto-execute
- Pause is manual only -- no auto-pause when context is running low
- If session ends without explicit pause, STATE.md still has the last known position for best-effort recovery

#### Quick task behavior (/mz:quick)
- Like GSD: atomic commit + tracked in STATE.md. Minimum discipline maintained
- Respects config quality gates: if TDD/review are enabled, quick uses them. Quick = less project ceremony, not less quality
- Always available, even with an active project -- for things that don't belong to any phase (fix typo, update README)

#### Stub behavior
- Stub commands show informative message with phase number: "This skill will be available in Phase 7: Quality and Debugging Skills. Current phase: 3."
- Every stub message ends with: "Run /mz:help to see available commands."

### Claude's Discretion
- Discuss/plan integration approach (how soft check behaves internally)
- Pause handoff detail level (what exactly goes into STATE.md beyond position + stash ref)
- Resume without explicit pause behavior (best-effort from STATE.md)
- Quick task invocation pattern (description as argument, interactive mode, or both)
- Which commands need to be registered as stubs vs. already exist from Phase 1
- Stub implementation: whether to use smart stubs (model invocation) or static templates (zero cost)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-02 | ~12 slash commands available: init, plan, go, status, resume, quick, review, debug, verify, discuss, pause, map | All 14 skills already registered as stubs from Phase 1. Phase 3 converts 5 stubs to functional (plan, status, pause, resume, quick), updates remaining stubs with informative phase messages, and updates /mz:help listing. |
| PROJ-02 | User can create a roadmap with phases, each phase having tasks with completion criteria | /mz:plan skill creates PLAN.md files with task breakdown. Roadmap creation happens in the plan flow when a user plans Phase 1 of a project. The planner agent decomposes work into plans with tasks, dependencies, and completion criteria. |
| PROJ-03 | User can plan a specific phase with `/mz:plan` that decomposes work into tasks with dependencies | /mz:plan skill orchestrates the research-then-plan pipeline via subagent delegation. Produces PLAN.md files in the phase directory following the GSD plan format with task XML, dependency graphs, and wave assignments. |
| PROJ-04 | User can track project progress with `/mz:status` showing current phase, completed tasks, next actions | /mz:status skill reads STATE.md, ROADMAP.md, and phase directories to compute progress. Two modes: compact (default) and verbose (--verbose). Always ends with "Next Up" suggestion. |
| PROJ-05 | User can pause work with `/mz:pause` creating a context handoff file for session recovery | /mz:pause skill captures current position + decisions + context into STATE.md, runs `git stash` for modified files, records stash ref. STATE.md becomes the handoff file (no separate .continue-here.md needed). |
| PROJ-06 | User can resume from any previous session with `/mz:resume` restoring full context from STATE.md | /mz:resume skill reads STATE.md, runs `git stash pop` if stash ref exists, displays context summary, suggests next action. Does NOT auto-execute. |
| PROJ-07 | User can execute quick tasks with `/mz:quick` bypassing full project ceremony | /mz:quick skill takes a task description, executes it with atomic commit, tracks in STATE.md. Respects config quality gates. Works even with an active project/phase. |
| PROJ-11 | Context management prevents context rot via fresh subagent spawning, dimensioned state files, and lazy loading | /mz:plan uses subagent spawning (Task tool) for researcher and planner agents. STATE.md is dimensioned (compact sections, structured format). Skills load only needed files via targeted reads. No new infrastructure needed. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for CLI and state management logic | Already installed, type safety for state operations |
| zod | ^4.3.0 | Config validation, state schema validation | Already installed, used in config.ts |
| fs-extra | ^11.0.0 | File system operations (readJson, writeJson, pathExists) | Already installed, used in config.ts |
| picocolors | ^1.1.0 | Terminal color output for CLI messages | Already installed, used in colors.ts |
| commander | ^14.0.0 | CLI subcommand routing for mz-tools | Already installed, used in cli/index.ts |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.0 | Unit testing for state management logic | Test state parsing, progress calculation, stash operations |
| biome | ^2.3.0 | Linting and formatting | All TypeScript source files |
| tsdown | ^0.20.0 | Build pipeline | Bundling TypeScript to ESM |
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Parsing PLAN.md frontmatter for plan metadata |
| ora | ^8.0.0 | Terminal spinners | CLI progress indicators |

### No Additional Dependencies Needed

Phase 3 requires zero new npm dependencies. All needed functionality is covered by:
- Node.js built-in `child_process.execSync` for git stash operations
- Node.js built-in `path`, `fs` for file operations
- Existing dependencies for validation, file I/O, and CLI

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (Phase 3 Additions)

```
src/
├── cli/
│   ├── index.ts               # MODIFY: Add mz-tools subcommands (state, progress, stash)
│   ├── commands/
│   │   ├── install.ts          # Existing
│   │   ├── uninstall.ts        # Existing
│   │   ├── state.ts            # NEW: State management CLI commands
│   │   └── progress.ts         # NEW: Progress calculation CLI commands
│   └── utils/
│       ├── colors.ts           # Existing
│       ├── detect-plugins.ts   # Existing
│       └── spinner.ts          # Existing
└── lib/
    ├── config.ts               # Existing (config schema, load/save)
    ├── paths.ts                # Existing (path constants)
    └── state.ts                # NEW: STATE.md parsing, updating, stash management

skills/
├── plan/
│   ├── SKILL.md                # REPLACE: Full /mz:plan orchestration skill
│   └── agents.md               # NEW: Agent definitions reference for plan skill
├── status/
│   └── SKILL.md                # REPLACE: Full /mz:status skill
├── pause/
│   └── SKILL.md                # REPLACE: Full /mz:pause skill
├── resume/
│   └── SKILL.md                # REPLACE: Full /mz:resume skill
├── quick/
│   └── SKILL.md                # REPLACE: Full /mz:quick skill
├── go/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 4)
├── review/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 5)
├── debug/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 7)
├── verify/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 5)
├── discuss/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 7)
├── map/
│   └── SKILL.md                # UPDATE: Informative stub (Phase 8)
├── init/                       # Existing (no changes)
├── settings/                   # Existing (no changes)
└── help/
    └── SKILL.md                # UPDATE: Mark plan/status/pause/resume/quick as Available

agents/
├── mz-researcher.md            # NEW: Phase researcher agent definition
└── mz-planner.md               # NEW: Phase planner agent definition
```

### Pattern 1: Skill-as-Orchestrator for /mz:plan

**What:** The `/mz:plan` skill orchestrates a multi-agent pipeline: optionally spawn a researcher agent (Task tool), then spawn a planner agent (Task tool), optionally spawn a plan-checker agent. The skill is the conductor; agents are the musicians.

**When to use:** For any skill that delegates work to subagents.

**Why this matters for Megazord:** This is the same pattern GSD uses (`/gsd:plan-phase` spawns `gsd-phase-researcher`, then `gsd-planner`, then `gsd-plan-checker`). Megazord's plan skill should follow the same orchestration flow but reference Megazord-specific agents (`mz-researcher`, `mz-planner`).

**Critical implementation detail:** The skill MUST pass all context (STATE.md content, ROADMAP.md content, CONTEXT.md content, RESEARCH.md content) as inline text in the Task prompt, NOT via `@file` references. `@file` references do not resolve across Task boundaries -- the subagent cannot read files referenced with `@` in the parent's prompt. All file contents must be read by the skill and embedded in the Task prompt string.

**Example:**
```markdown
## Step 5: Spawn Researcher

Read the following files and store their contents:
- .planning/STATE.md
- .planning/ROADMAP.md
- .planning/REQUIREMENTS.md
- Phase CONTEXT.md if exists

Spawn a researcher subagent:

Task(
  prompt="Read /path/to/agents/mz-researcher.md for your role.

  <objective>Research Phase {N}: {Name}</objective>
  <phase_context>{context_content}</phase_context>
  <additional_context>{roadmap + requirements + state}</additional_context>
  <output>Write to: {phase_dir}/{padded}-RESEARCH.md</output>",
  subagent_type="general-purpose",
  description="Research Phase {N}"
)
```

### Pattern 2: STATE.md as Structured State Machine

**What:** STATE.md serves as both the cross-session state store and the context handoff document. It has well-defined sections that are updated by different operations. The format is designed for lazy loading -- skills can read just the section they need without parsing the entire file.

**When to use:** Every skill that reads or updates project state.

**Current STATE.md sections (from Phase 2):**
1. `## Project Reference` - Core value, current focus
2. `## Current Position` - Phase, plan, status, progress bar
3. `## Performance Metrics` - Velocity data
4. `## Accumulated Context` - Decisions, todos, blockers
5. `## Session Continuity` - Last session date, resume file

**Phase 3 additions:**
- Add `stash_ref` to Session Continuity (for pause/resume git stash tracking)
- Add `last_error` to Session Continuity (for error context display in status)
- Add `### Quick Tasks Completed` table to Accumulated Context (for quick task tracking)
- Update Current Position format to include plan progress within current phase

**Example STATE.md with Phase 3 enhancements:**
```markdown
## Session Continuity

Last session: 2026-02-17
Stopped at: Phase 3 plan 02 task 2
Resume file: .planning/phases/03-core-skills/03-02-PLAN.md
Stash ref: stash@{0}
Last error: None
```

### Pattern 3: Git Stash for Pause/Resume

**What:** `/mz:pause` runs `git stash push -m "mz:pause -- {description}"` to save modified files, records the stash ref in STATE.md. `/mz:resume` reads the stash ref and runs `git stash pop` to restore files.

**When to use:** Pause/resume session lifecycle only.

**Implementation details:**
```bash
# Pause: stash modified files
git stash push -m "mz:pause -- Phase 3, Plan 02, Task 2 in progress"
# Capture the stash ref
STASH_REF=$(git stash list --format="%gd" -1)

# Resume: pop the stash
git stash pop "$STASH_REF"
```

**Edge cases to handle:**
1. **No modified files:** `git stash push` with nothing to stash exits with 0 but creates no stash. Check `git stash list` before and after to detect this.
2. **Stash conflicts on resume:** `git stash pop` can fail with merge conflicts. Detect the failure, inform the user, suggest `git stash show` and manual resolution.
3. **Stale stash ref:** If the user ran `git stash pop` manually, the stored ref is invalid. Check if the ref exists before popping.
4. **Multiple stashes:** Only track the Megazord-created stash. Use the message pattern "mz:pause --" to identify it.

### Pattern 4: Plan Format Compatibility with GSD

**What:** Megazord PLAN.md files should follow the same format as GSD PLAN.md files so the execution pipeline (Phase 4) can process them consistently. The format includes YAML frontmatter with metadata, `<objective>`, `<context>`, `<tasks>`, `<verification>`, and `<success_criteria>` sections.

**When to use:** All plan creation via `/mz:plan`.

**Plan format:**
```yaml
---
phase: XX-name
plan: NN
type: execute
wave: N
depends_on: []
files_modified: []
autonomous: true
requirements: []

must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
[What and why]
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: [Name]</name>
  <files>path/to/file.ext</files>
  <action>[Specific implementation]</action>
  <verify>[How to verify]</verify>
  <done>[Acceptance criteria]</done>
</task>
</tasks>
```

**Why GSD format:** The planner agent already knows this format well. Phase 4's executor will need to parse it. Keeping format compatibility means the executor can be built against a known specification.

### Pattern 5: Quick Task as Lightweight Plan

**What:** `/mz:quick` creates a minimal plan in `.planning/quick/NNN-slug/` with 1-3 focused tasks, executes it inline (not via subagent in Phase 3 -- subagent execution comes in Phase 4), commits atomically, and tracks in STATE.md.

**When to use:** Ad-hoc tasks that don't belong to any phase.

**Key difference from GSD:** Megazord's quick tasks in Phase 3 execute inline (Claude follows the plan directly) rather than spawning executor subagents. Subagent execution is a Phase 4 concern. The plan is still created for tracking and audit purposes, but execution is immediate.

**Quick task directory structure:**
```
.planning/
├── quick/
│   ├── 001-fix-typo/
│   │   ├── 001-PLAN.md
│   │   └── 001-SUMMARY.md
│   └── 002-update-readme/
│       ├── 002-PLAN.md
│       └── 002-SUMMARY.md
```

### Pattern 6: Informative Stub Commands

**What:** Stub skills show a helpful message with the phase they belong to, a brief description of what they will do, and the current phase number. They use `disable-model-invocation: true` for zero context cost.

**When to use:** For all skills not yet implemented (/mz:go, /mz:review, /mz:debug, /mz:verify, /mz:discuss, /mz:map).

**Example (static template -- recommended):**
```yaml
---
name: go
description: Execute the current phase plan with subagent delegation
disable-model-invocation: true
---

# /mz:go

This skill will be available in **Phase 4: Subagent Execution and Atomic Commits**.

**What it will do:** Execute the current phase plan by delegating tasks to subagents, managing dependencies between tasks, and tracking progress through completion.

**Current phase:** 3 (Core Skills and State Management)

Run `/mz:help` to see available commands.
```

**Recommendation (Claude's Discretion): Use static templates, not smart stubs.** Static stubs with `disable-model-invocation: true` have zero context cost. Smart stubs that invoke the model would consume context for a message that provides no functionality. The informative text is sufficient.

### Anti-Patterns to Avoid

- **Building mz-tools as a full application framework:** The TypeScript layer should be a thin CLI helper for state operations. Complex orchestration logic belongs in SKILL.md, not TypeScript. Phase 2 proved this pattern works.

- **Spawning subagents from quick tasks in Phase 3:** Quick task execution should be inline in Phase 3. Subagent delegation is Phase 4's concern. The quick task plan is still created for tracking, but Claude executes it directly.

- **Separate handoff files (`.continue-here.md`):** Megazord uses STATE.md as the single handoff document, unlike GSD which creates separate `.continue-here.md` files. STATE.md's Session Continuity section plus the stash ref provides all the handoff context needed. This reduces file sprawl and makes resume simpler -- read one file, not hunt for handoff files.

- **Auto-executing on resume:** User decision is explicit: resume shows context and suggests next step but does NOT auto-execute. The user must invoke the next command.

- **Blocking on missing CONTEXT.md:** User decision is explicit: soft check only. Warn and suggest but don't block planning.

- **Making /mz:plan handle roadmap creation:** /mz:plan decomposes a phase into tasks. Roadmap creation (PROJ-02) is part of the plan flow but happens when the user plans their first phase -- the planner creates ROADMAP.md if it doesn't exist, or operates within an existing roadmap. The roadmap is a natural output of the planning process, not a separate command.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar calculation | Manual string manipulation | TypeScript utility in state.ts | Need consistent 20-char bar with Unicode blocks, used by multiple skills |
| STATE.md section parsing | Regex-based markdown parsing | Structured read/write in state.ts | Markdown parsing with regex is fragile; structured helpers prevent section corruption |
| Git stash operations | Direct `git stash` in SKILL.md | TypeScript wrapper in state.ts called via Bash | Need error handling, stash validation, conflict detection |
| Plan frontmatter parsing | Manual YAML extraction | gray-matter library (already installed) | Handles edge cases in YAML frontmatter |
| Slug generation for quick tasks | Manual string processing | TypeScript utility | Need consistent lowercase, hyphenated, max-length slugs |
| Phase directory resolution | Hardcoded paths in skills | TypeScript path resolution | Phase directories have padded numbers and slugified names |
| Next phase detection | Manual ROADMAP.md parsing | TypeScript roadmap parser | Need to find current phase, next unplanned phase, phase status |

**Key insight:** State management operations (parse STATE.md, update sections, calculate progress, manage stash) are the sweet spot for TypeScript helpers. These operations need reliable parsing and structured updates that Markdown instructions alone cannot guarantee. Everything else (orchestration flow, user interaction, agent spawning) stays in SKILL.md.

## Common Pitfalls

### Pitfall 1: @file References in Task Tool Prompts
**What goes wrong:** Skill uses `@.planning/STATE.md` in a Task tool prompt to give a subagent context. The subagent cannot resolve the `@` reference and works with incomplete context.
**Why it happens:** `@file` references are a Claude Code skill feature that works within the current session. Task tool spawns a new subagent session that does not inherit `@` reference resolution.
**How to avoid:** Read all files in the skill BEFORE spawning the Task. Embed file contents as inline text in the Task prompt string. This is how GSD's plan-phase workflow works -- it reads all files into shell variables and passes them as prompt content.
**Warning signs:** Subagent produces plans that ignore STATE.md decisions or don't reference the correct roadmap phase.

### Pitfall 2: STATE.md Section Corruption
**What goes wrong:** A skill reads STATE.md, modifies one section, writes it back. But it accidentally reformats other sections, changes progress bar format, or drops the Performance Metrics table.
**Why it happens:** Reading the whole file, modifying a portion, and writing back is error-prone with Markdown. Unlike JSON, there is no structured parse/serialize cycle.
**How to avoid:** Two approaches: (1) TypeScript helper that parses STATE.md into sections, modifies the target section, and reassembles. (2) Skill uses Edit tool to make targeted replacements rather than rewriting the whole file. Approach (1) is more reliable for programmatic updates; approach (2) works for skill-driven updates.
**Warning signs:** STATE.md losing sections, progress bar format changing between updates, performance metrics table disappearing.

### Pitfall 3: Git Stash Pop Conflicts
**What goes wrong:** `/mz:resume` runs `git stash pop` and it fails with merge conflicts because files changed between pause and resume.
**Why it happens:** User or other tools modified the same files that were stashed. This is normal git behavior but unexpected for users who think pause/resume is seamless.
**How to avoid:** Check for potential conflicts before popping: `git stash show --stat` to see what the stash contains, compare with current working tree. If conflicts are likely, warn the user and suggest `git stash show` before proceeding. After a failed pop, the stash is NOT dropped -- it remains in the stash list for manual recovery.
**Warning signs:** "CONFLICT (content)" messages during resume.

### Pitfall 4: Plan Skill Context Window Exhaustion
**What goes wrong:** `/mz:plan` reads STATE.md, ROADMAP.md, REQUIREMENTS.md, RESEARCH.md, CONTEXT.md, and embeds them all in the Task prompt for the planner agent. The prompt is enormous and the planner runs out of context.
**Why it happens:** Naively embedding all project files as inline text.
**How to avoid:** Be selective about what context the planner needs. The planner needs: (1) roadmap section for the target phase, not the entire roadmap, (2) requirements relevant to this phase only, (3) research findings, (4) context decisions. The skill should extract relevant sections rather than embedding entire files. GSD's plan-phase workflow does this with targeted grep/jq extraction.
**Warning signs:** Planner producing shallow plans, ignoring later context, or failing to complete.

### Pitfall 5: Quick Task Quality Gate Confusion
**What goes wrong:** Quick task ignores TDD setting from config, or enforces TDD when the config says off.
**Why it happens:** The "quick = less ceremony, not less quality" principle is easy to misunderstand. Quick skips roadmap/phase planning, but still respects quality toggles.
**How to avoid:** Quick task skill MUST read `megazord.config.json` and respect quality settings. If TDD is on, quick tasks include test-first steps. If review is auto, quick tasks get reviewed. The only things quick skips are: roadmap, phase planning, research agent, plan verification.
**Warning signs:** Users getting different quality behavior from quick tasks vs planned tasks.

### Pitfall 6: Stub Command Model Invocation Cost
**What goes wrong:** Stub skills with `disable-model-invocation: false` get loaded by Claude when it thinks they might be relevant, consuming context for non-functional skills.
**Why it happens:** Desire to make stubs "smart" (use the model to explain what the skill will do).
**How to avoid:** All stub skills MUST have `disable-model-invocation: true`. The informative text in the SKILL.md is sufficient. Claude only loads the skill content when the user explicitly invokes the command. Zero context cost at session start.
**Warning signs:** Running `/context` shows Megazord consuming more context than expected.

## Code Examples

### STATE.md Parser and Updater (src/lib/state.ts)

```typescript
// src/lib/state.ts
import { join } from "node:path";
import fse from "fs-extra";

const STATE_FILENAME = "STATE.md";

interface StatePosition {
  phase: number;
  totalPhases: number;
  phaseName: string;
  plan: number;
  totalPlans: number;
  status: string;
  lastActivity: string;
  progressPercent: number;
}

interface SessionContinuity {
  lastSession: string;
  stoppedAt: string;
  resumeFile: string;
  stashRef: string | null;
  lastError: string | null;
}

/** Read STATE.md and extract the Current Position section */
export function readPosition(planningDir: string): StatePosition | null {
  const statePath = join(planningDir, STATE_FILENAME);
  if (!fse.pathExistsSync(statePath)) return null;

  const content = fse.readFileSync(statePath, "utf-8");
  // Parse structured sections from markdown
  // Implementation: regex-based section extraction
  // ...
}

/** Update the Current Position section in STATE.md */
export function updatePosition(planningDir: string, position: Partial<StatePosition>): void {
  // Read, parse, update section, write back
}

/** Update Session Continuity section with stash ref */
export function updateSessionContinuity(
  planningDir: string,
  continuity: Partial<SessionContinuity>
): void {
  // Read, parse, update section, write back
}

/** Calculate progress bar string (20-char Unicode blocks) */
export function progressBar(percent: number): string {
  const filled = Math.round(percent / 5); // 20 chars = 100%
  const empty = 20 - filled;
  return `[${"\u2588".repeat(filled)}${"\u2591".repeat(empty)}] ${percent}%`;
}
```

### Git Stash Helper

```typescript
// src/lib/state.ts (continued)
import { execSync } from "node:child_process";

interface StashResult {
  success: boolean;
  stashRef: string | null;
  message: string;
}

/** Stash modified files with a Megazord-tagged message */
export function stashPause(description: string): StashResult {
  try {
    // Check if there are changes to stash
    const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (!status) {
      return { success: true, stashRef: null, message: "No modified files to stash" };
    }

    // Get stash count before
    const beforeCount = execSync("git stash list", { encoding: "utf-8" }).split("\n").filter(Boolean).length;

    // Stash with message
    execSync(`git stash push -m "mz:pause -- ${description}"`, { encoding: "utf-8" });

    // Get stash count after to verify
    const afterCount = execSync("git stash list", { encoding: "utf-8" }).split("\n").filter(Boolean).length;

    if (afterCount > beforeCount) {
      const stashRef = execSync('git stash list --format="%gd" -1', { encoding: "utf-8" }).trim();
      return { success: true, stashRef, message: `Stashed ${status.split("\n").length} file(s)` };
    }

    return { success: true, stashRef: null, message: "No changes stashed (all files committed)" };
  } catch (err) {
    return { success: false, stashRef: null, message: `Stash failed: ${err}` };
  }
}

/** Pop a specific stash ref */
export function stashResume(stashRef: string): StashResult {
  try {
    // Verify stash exists
    const stashList = execSync("git stash list", { encoding: "utf-8" });
    if (!stashList.includes(stashRef)) {
      return { success: false, stashRef, message: `Stash ${stashRef} not found. It may have been popped manually.` };
    }

    // Check for potential conflicts
    const stashFiles = execSync(`git stash show ${stashRef} --name-only`, { encoding: "utf-8" });

    // Attempt pop
    execSync(`git stash pop ${stashRef}`, { encoding: "utf-8" });
    return { success: true, stashRef: null, message: "Stash restored successfully" };
  } catch (err) {
    const errStr = String(err);
    if (errStr.includes("CONFLICT")) {
      return { success: false, stashRef, message: "Stash pop failed: merge conflicts detected. Resolve conflicts manually, then run `git stash drop`." };
    }
    return { success: false, stashRef, message: `Stash pop failed: ${errStr}` };
  }
}
```

### /mz:plan Skill Orchestration (Simplified)

```markdown
---
name: plan
description: Plan a phase into executable tasks with dependencies and waves
disable-model-invocation: true
---

# /mz:plan

Plan a phase by orchestrating research and planning agents. Produces PLAN.md
files with task breakdown, dependencies, and completion criteria.

Reference `@skills/init/design-system.md` for visual output formatting.

## Step 1: Display Banner

╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► PLANNING                       ║
╚═══════════════════════════════════════════════╝

## Step 2: Load Context

Read `.planning/megazord.config.json` -- if missing, show error and suggest /mz:init.
Read `.planning/STATE.md` for current position.
Read `.planning/ROADMAP.md` for phase listing.
Read `.planning/REQUIREMENTS.md` for requirement details.

Parse arguments: phase number, --skip-research flag.

## Step 3: Determine Target Phase

If phase number provided: use it.
If not: detect the next unplanned phase from ROADMAP.md (first phase with no PLAN.md files).
If no unplanned phase: inform user all phases are planned.

## Step 4: Soft Check for CONTEXT.md

Check if {phase_dir}/{padded}-CONTEXT.md exists.

If missing: Display warning using design system:
"⚠ No context found for Phase {N}. Run /mz:discuss first for better results,
or continue without."

Use AskUserQuestion:
- header: "Context"
- question: "Continue planning without context?"
- options: "Continue" / "Run /mz:discuss first"

If "Run /mz:discuss first": suggest the command and exit.

## Step 5: Research (if enabled)

Check config: workflow.research
Check flag: --skip-research

If research enabled AND no --skip-research AND no existing RESEARCH.md:
  Read all needed files, embed as inline text.
  Spawn researcher via Task tool.

## Step 6: Create Plans

Read all gathered context (STATE, ROADMAP, REQUIREMENTS, RESEARCH, CONTEXT).
Embed as inline text in Task prompt.
Spawn planner via Task tool.
Handle return: PLANNING COMPLETE or PLANNING BLOCKED.

## Step 7: Plan Verification (if enabled)

Check config: workflow.plan_check

If enabled: spawn plan checker via Task tool.
Handle verification result.

## Step 8: Update State and Present Results

Update STATE.md with new plan count.
Display plan summary.
Show Next Up block suggesting /mz:go.
```

### /mz:status Compact Output Example

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► STATUS                         ║
╚═══════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Megazord                                             ║
╠═══════════════════════════════════════════════════════╣
║  Phase: 3 of 8 -- Core Skills and State Management   ║
║  Plan:  1 of 3 -- In Progress                        ║
║  Power: ████████░░░░░░░░░░░░ 37%                     ║
╚═══════════════════════════════════════════════════════╝

▸ Recent
  ✓ Phase 1: Plugin scaffold (2 plans)
  ✓ Phase 2: Init and config (2 plans)
  ◆ Phase 3: Core skills (1/3 plans)

═══════════════════════════════════════════════════
▸ Next Up
**Execute Phase 3 Plan 1** -- core skill implementations
`/mz:go`
═══════════════════════════════════════════════════
```

### /mz:status Verbose Output Example

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► STATUS (VERBOSE)               ║
╚═══════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Megazord                                             ║
╠═══════════════════════════════════════════════════════╣
║  Phase: 3 of 8 -- Core Skills and State Management   ║
║  Plan:  1 of 3 -- In Progress                        ║
║  Power: ████████░░░░░░░░░░░░ 37%                     ║
╚═══════════════════════════════════════════════════════╝

▸ All Phases
  ✓ Phase 1: Plugin Scaffold and Build Pipeline
    Plans: 2/2 ✓ | Duration: 7min
  ✓ Phase 2: Project Initialization and Configuration
    Plans: 2/2 ✓ | Duration: 9min
  ◆ Phase 3: Core Skills and State Management
    Plans: 1/3 ◆ | Context: ✓ Research: ○
  ○ Phase 4: Subagent Execution and Atomic Commits
  ○ Phase 5: Code Review and Verification
  ○ Phase 6: Agent Teams Integration
  ○ Phase 7: Quality and Debugging Skills
  ○ Phase 8: Brownfield Support and Project Lifecycle

▸ Current Phase Tasks
  ○ /mz:plan skill implementation
  ○ /mz:status skill implementation
  ○ /mz:pause + /mz:resume skill implementation
  ○ /mz:quick skill implementation
  ○ Stub updates and /mz:help refresh

▸ Performance
  Plans completed: 4
  Average duration: 4min
  Total execution: 0.27 hours

▸ Decisions
  - Roadmap: 8 phases from 42 requirements
  - Phase 1-01: Plugin name "mz" for short prefix

═══════════════════════════════════════════════════
▸ Next Up
**Execute Phase 3 Plan 1** -- core skill implementations
`/mz:go`
═══════════════════════════════════════════════════
```

### /mz:pause Handoff Example

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► PAUSE                          ║
╚═══════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Session Paused                                       ║
╠═══════════════════════════════════════════════════════╣
║  Phase: 3 of 8 -- Core Skills                        ║
║  Plan:  2 of 3 -- In Progress                        ║
║  Stash: stash@{0} (3 modified files)                 ║
║  State: .planning/STATE.md updated                   ║
╚═══════════════════════════════════════════════════════╝

To resume: `/mz:resume`
```

### /mz:resume Context Restore Example

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► RESUME                         ║
╚═══════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Session Restored                                     ║
╠═══════════════════════════════════════════════════════╣
║  Phase: 3 of 8 -- Core Skills                        ║
║  Plan:  2 of 3 -- In Progress                        ║
║  Stash: ✓ 3 files restored                           ║
║  Last:  2026-02-17 -- Completed plan 1               ║
╚═══════════════════════════════════════════════════════╝

▸ Context
  - Working on /mz:status skill implementation
  - Config schema and design system are complete
  - All Phase 1 and 2 artifacts verified

▸ Decisions Since Last Session
  - (none)

═══════════════════════════════════════════════════
▸ Next Up
**Continue Phase 3 Plan 2** -- status and progress skills
Would you like to continue with `/mz:go`?
═══════════════════════════════════════════════════
```

## Discretion Recommendations

### 1. Discuss/Plan Integration (How Soft Check Behaves)

**Recommendation: Conversational warning with AskUserQuestion gate.**

When `/mz:plan` detects no CONTEXT.md for the target phase, it should:
1. Display a warning (not an error) using the `⚠` symbol
2. Present an AskUserQuestion with two options: "Continue without context" or "Run /mz:discuss first"
3. If user continues, proceed normally -- the planner works with research + requirements only
4. If user wants discuss, display the `/mz:discuss {phase}` command and exit

This is a single question, not a blocker dialog. The warning text should emphasize the value of context without shaming the user for skipping it.

### 2. Pause Handoff Detail Level

**Recommendation: STATE.md Session Continuity section with 5 fields.**

The pause captures these fields in STATE.md's Session Continuity section:
1. `Last session:` -- date
2. `Stopped at:` -- human-readable description of position
3. `Resume file:` -- path to the most relevant file for resume (current PLAN.md or ROADMAP.md)
4. `Stash ref:` -- git stash reference if files were stashed, or "None"
5. `Last error:` -- error context from the most recent operation, or "None"

Additionally, the `## Current Position` section is always kept up-to-date by all skills, so pause only needs to add the stash ref and mark status as "Paused". No separate handoff file needed -- STATE.md IS the handoff.

### 3. Resume Without Explicit Pause (Best-Effort)

**Recommendation: Use whatever is in STATE.md, don't panic.**

If the user runs `/mz:resume` without having run `/mz:pause`:
1. Read STATE.md -- it always has the last known position from `## Current Position`
2. No stash ref? No problem -- just display context and suggest next action
3. The `Session Continuity` section may be stale, but `Current Position` is updated by all skills
4. Display context with a note: "No pause checkpoint found -- showing last known position"

This best-effort approach means sessions that end unexpectedly (context exhaustion, crash, user closes terminal) still have a usable resume path.

### 4. Quick Task Invocation Pattern

**Recommendation: Description as argument, with interactive fallback.**

Support both patterns:
- `/mz:quick fix the typo in README.md` -- description as argument
- `/mz:quick` (no arguments) -- prompt interactively via AskUserQuestion

Parse the user's message after `/mz:quick` as the description. If the description is empty or just flags, prompt with AskUserQuestion (header: "Quick" (5 chars), question: "What do you want to do?").

This matches GSD's quick task pattern and feels natural for both command-line-style and conversational interaction.

### 5. Stub Registration Status

**Recommendation: All 14 skills already exist as stubs from Phase 1. Update 6 remaining stubs with informative messages, convert 5 to functional.**

Current skill status:
- **Already functional (Phase 2):** init, settings, help -- no changes needed
- **Convert to functional (Phase 3):** plan, status, pause, resume, quick -- replace stub content
- **Update stub message (Phase 3):** go (Phase 4), review (Phase 5), verify (Phase 5), debug (Phase 7), discuss (Phase 7), map (Phase 8) -- update text with specific phase info

### 6. Stub Implementation: Static Templates

**Recommendation: Static templates with `disable-model-invocation: true`.**

Static stubs are zero-cost (no model invocation, no context consumption). The informative text tells users exactly when the skill will be available and what it will do. Smart stubs would consume context to produce essentially the same message. Static is the right choice.

All stubs should follow this template:
```markdown
---
name: {name}
description: {description}
disable-model-invocation: true
---

# /mz:{name}

This skill will be available in **Phase {N}: {Phase Name}**.

**What it will do:** {One sentence description of functionality}

**Current phase:** 3 (Core Skills and State Management)

Run `/mz:help` to see available commands.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD: `.continue-here.md` per phase directory | Megazord: STATE.md as unified handoff | Phase 3 design | Single file for all session state, no hunting for handoff files |
| GSD: gsd-tools.cjs for all CLI operations | Megazord: commander subcommands in bin/megazord.mjs | Phase 1 | Single compiled binary, no Node.js script dependency |
| GSD: Separate progress/state/commit tools | Megazord: state.ts module with focused exports | Phase 3 | TypeScript with proper types, testable, importable |
| GSD: 31+ commands | Megazord: 14 focused skills | Phase 3 | Less cognitive overhead, clearer progression |
| GSD: SessionStart hook for context | Megazord: No SessionStart, lazy skill loading | Phase 1 | Zero overhead at session start |

**Deprecated/outdated:**
- GSD's `.continue-here.md` pattern: Megazord uses STATE.md with Session Continuity section instead. One file, not per-phase handoff files.
- GSD's `gsd-tools.cjs` monolith: Megazord uses modular TypeScript in src/lib/ compiled to bin/megazord.mjs with commander subcommands.

## Open Questions

1. **Agent Definitions Location: Plugin agents/ vs Inline in Skill**
   - What we know: Claude Code plugins can have an `agents/` directory for subagent definitions. The Phase 1 architecture research recommended `agents/mz-researcher.md`, `agents/mz-planner.md` etc.
   - What's unclear: Whether plugin agent definitions are properly discovered and available for Task tool `subagent_type` parameter. GSD uses `subagent_type="general-purpose"` for all subagents and includes the agent instructions in the Task prompt.
   - Recommendation: Follow the GSD pattern for Phase 3 -- use `subagent_type="general-purpose"` and prepend agent instructions as prompt content. Create agent .md files as reference documents in the `agents/` directory that skills read and embed in Task prompts. If Claude Code's native agent discovery works with plugins, switch to named agent types in Phase 4.

2. **Roadmap Creation Within /mz:plan**
   - What we know: PROJ-02 requires "User can create a roadmap with phases." The plan skill decomposes phases, but roadmap creation is a higher-level operation.
   - What's unclear: Whether roadmap creation should be a separate subflow within /mz:plan or if /mz:plan only operates on existing phases.
   - Recommendation: /mz:plan should handle both cases: (a) if ROADMAP.md exists, plan the specified/next phase within it, (b) if ROADMAP.md doesn't exist, guide the user through roadmap creation first (vision -> requirements -> phases -> then plan the first phase). This keeps the user experience simple -- one command to go from "I have a project" to "I have a plan."

3. **mz-tools CLI Entry Point: Extend Existing or Create New**
   - What we know: `bin/megazord.mjs` currently handles install/uninstall. State management commands are a different concern.
   - What's unclear: Whether to add state/progress subcommands to the existing CLI or create a separate `bin/mz-tools.mjs` entry point.
   - Recommendation: Extend the existing CLI with a `tools` subcommand group: `megazord tools state`, `megazord tools progress`, `megazord tools stash`. This keeps one binary but separates installer concerns from tool concerns. The tsdown config would still produce one output file. Skills call `node {plugin-path}/bin/megazord.mjs tools state update-position ...` via Bash.

4. **Progress Calculation: Plan-Based vs Task-Based**
   - What we know: Progress bar in STATE.md currently shows overall progress (25% = 2 of 8 phases complete).
   - What's unclear: Whether progress should be plan-based (plans completed / total plans across all phases) or phase-based (phases completed / total phases), and how to calculate when within a phase.
   - Recommendation: Phase-based for the overall progress bar (simpler, matches ROADMAP structure). Within a phase, show plan completion (2/3 plans). The overall percentage combines both: `(completed_phases + current_phase_plan_progress/total_plans_in_phase) / total_phases * 100`.

## Sources

### Primary (HIGH confidence)
- Existing Megazord codebase -- Phase 1 and Phase 2 implementation verified on disk
  - `src/lib/config.ts` -- Config schema, types, presets, load/save
  - `src/lib/paths.ts` -- Path constants
  - `src/cli/index.ts` -- CLI entry point with commander
  - `skills/init/SKILL.md` -- Reference implementation for skill flow
  - `skills/init/design-system.md` -- Visual identity tokens
  - `skills/settings/SKILL.md` -- Reference for config-reading skill
  - `skills/help/SKILL.md` -- Current skill listing
  - All 14 stub skills verified in `skills/*/SKILL.md`
- GSD reference implementations (local, verified):
  - `~/.claude/get-shit-done/workflows/plan-phase.md` -- Plan orchestration flow
  - `~/.claude/get-shit-done/workflows/progress.md` -- Status/progress workflow
  - `~/.claude/get-shit-done/workflows/pause-work.md` -- Pause handoff workflow
  - `~/.claude/get-shit-done/workflows/resume-project.md` -- Resume workflow
  - `~/.claude/get-shit-done/workflows/quick.md` -- Quick task workflow
  - `~/.claude/agents/gsd-planner.md` -- Planner agent definition (plan format reference)
  - `~/.claude/agents/gsd-phase-researcher.md` -- Researcher agent definition
  - `~/.claude/get-shit-done/references/continuation-format.md` -- Next Up format reference
- Claude Code documentation:
  - Skills: frontmatter, AskUserQuestion, supporting files, disable-model-invocation
  - Plugins: agent discovery, skill discovery, namespace resolution

### Secondary (MEDIUM confidence)
- Phase 1 Research (`01-RESEARCH.md`) -- Plugin system architecture, context budget
- Phase 2 Research (`02-RESEARCH.md`) -- Skill authoring patterns, AskUserQuestion constraints
- Architecture Research (`.planning/research/ARCHITECTURE.md`) -- System overview, data flows
- GSD `gsd-tools.cjs` CLI -- Command structure for state, progress, commit operations

### Tertiary (LOW confidence)
- Agent `subagent_type` resolution for plugin agents -- Unclear whether plugin-defined agents in `agents/` directory are automatically available as named subagent types. GSD uses `general-purpose` for all. Needs empirical validation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies, all verified in existing codebase
- Architecture: HIGH -- Extends proven Phase 2 patterns (skill-as-program, design-system reference, config-as-source-of-truth). GSD reference implementations provide validated orchestration patterns.
- State management: HIGH -- STATE.md format is established, extensions are additive (stash ref, error context, quick tasks table)
- Git stash integration: MEDIUM -- Git stash operations are well-understood but edge cases (conflicts, stale refs, no changes) need careful handling
- Agent orchestration (/mz:plan): MEDIUM -- Follows GSD's proven pattern but Megazord agents are new and need definition. `@file` reference limitation in Task tool is a known constraint.
- Pitfalls: HIGH -- Documented from GSD experience and Phase 1-2 learnings

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, no fast-moving dependencies)

---
*Phase 3 research for: Core Skills and State Management*
*Researched: 2026-02-17*
