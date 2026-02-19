# Phase 4: Subagent Execution and Atomic Commits - Research

**Researched:** 2026-02-17
**Domain:** Task tool subagent orchestration, wave-based parallel execution, atomic git commit pipeline, plan parsing, state lifecycle management
**Confidence:** HIGH

## Summary

Phase 4 transforms the `/mz:go` stub into the execution engine of Megazord. The skill reads PLAN.md files produced by `/mz:plan`, parses their YAML frontmatter and XML task structure, organizes tasks into dependency-based waves, spawns Task tool subagents to execute each plan, and ensures every completed task produces exactly one atomic git commit. This is the bridge between "I have a plan" and "I have working code."

The architecture follows the established Megazord pattern: SKILL.md orchestrates the flow (loading context, determining what to execute, spawning subagents, tracking progress, updating state), while TypeScript CLI helpers handle operations that Markdown cannot do reliably (YAML frontmatter parsing, plan dependency resolution, execution state tracking). The subagent pattern is already proven -- `/mz:plan` spawns researcher and planner subagents via the Task tool. Phase 4 extends this to executor subagents.

The key technical challenges are: (1) parsing PLAN.md frontmatter to extract wave/dependency information, (2) organizing plans into waves where independent plans execute in parallel, (3) spawning executor subagents with all necessary context embedded inline (the @file limitation from Phase 3 applies), (4) enforcing the one-task-one-commit discipline within subagents, (5) tracking execution progress across multiple plans and waves, and (6) handling failures gracefully without losing completed work. All of these have precedent in either the existing Megazord codebase or the GSD reference implementation.

**Primary recommendation:** Build the `/mz:go` skill as an orchestrator that reads plans, computes wave order, spawns executor subagents per-plan (not per-task), and tracks progress via STATE.md updates. Create an `agents/mz-executor.md` agent definition modeled on GSD's `gsd-executor.md` but adapted for Megazord's commit format and state management patterns. Add TypeScript CLI commands for plan parsing (`megazord tools plan list`, `megazord tools plan waves`) and execution tracking (`megazord tools state advance-plan`, `megazord tools state record-metric`). No new npm dependencies required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Execution flow
- Wave-based execution: tasks without mutual dependencies run in parallel within a wave
- Full auto: once launched, all waves execute without pause between them
- No plan = error: if no plan exists for the current phase, show clear error message directing to `/mz:plan`
- Selezione opzionale: default executes entire plan, but `--tasks 3,5` or `--from 4` flags allow partial execution
- Progress live: user sees real-time progress (current task, wave number, %) but does not intervene

#### Commit behavior
- Strict 1:1 mapping: one task = exactly one commit, no exceptions
- No Co-Authored-By: commits appear clean, as if made by the user
- Post-execution: summary of what was done + suggested next step (e.g., "Phase complete. Use /mz:verify to validate.")

### Claude's Discretion
- Commit message format (conventional commits, task references, or hybrid)
- Whether state files (STATE.md, plan updates) are included in task commits or separate commits
- Plan granularity: whether `/mz:go 04-01` targets a specific plan or only full-phase execution
- File conflict detection strategy when parallel tasks in the same wave overlap
- Dry run support: evaluate whether `--dry-run` adds value vs what `/mz:status` already shows
- Failure strategy: rollback mechanism (git-based vs checkpoint), retry policy, dependency chain handling
- Failure reporting level: inline summary vs file-based log
- Subagent permission mode: respect user permissions vs bypass for delegated work

### Deferred Ideas (OUT OF SCOPE)
- Git worktree isolation for parallel agents -- Phase 6 (Agent Teams Integration)
- Reviewer feedback loops during execution -- Phase 5/6
- Auto-advance to next phase after completion -- evaluate during implementation, may be configurable
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-08 | Each completed task produces exactly one atomic git commit with descriptive message | Executor agent enforces per-task commit protocol. Commit format follows conventional commits with phase-plan scope (e.g., `feat(04-01): create user API endpoint`). Task commits use `git add` for specific files only (never `git add .`). The PLAN.md `<files>` section declares which files each task modifies, providing the staging list. |
| AGNT-02 | Graceful degradation to Task tool subagents when Agent Teams is unavailable or disabled | Phase 4 builds the Task tool execution pipeline as the primary (and only) execution path. This pipeline IS the graceful degradation path. Phase 6 will add Agent Teams as an enhancement on top. The `/mz:go` skill always uses Task tool subagents regardless of Agent Teams availability. When Phase 6 adds Agent Teams, the config will control which path is used, with Task tool as the automatic fallback. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for CLI helpers (plan parsing, execution tracking) | Already installed, type safety |
| gray-matter | ^4.0.3 | Parse YAML frontmatter from PLAN.md files | Already installed, used for plan metadata extraction |
| fs-extra | ^11.0.0 | File system operations (readJson, pathExists, readdir) | Already installed, used everywhere |
| commander | ^14.0.0 | CLI subcommand routing for new tools commands | Already installed, used in cli/index.ts |
| zod | ^4.3.0 | Validation of parsed plan metadata | Already installed, used in config.ts |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| picocolors | ^1.1.0 | Terminal colors for progress output | Progress display in CLI tools |
| vitest | ^4.0.0 | Unit tests for plan parsing and wave computation | Test plan parser, dependency resolver |
| biome | ^2.3.0 | Linting and formatting | All new TypeScript source |

### No Additional Dependencies Needed

Phase 4 requires zero new npm dependencies. All needed functionality is covered by:
- `gray-matter` for YAML frontmatter parsing (already installed)
- `fs-extra` for filesystem operations (already installed)
- Node.js `child_process.execSync` for git operations
- Existing state management library (`src/lib/state.ts`)

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (Phase 4 Additions)

```
src/
├── cli/
│   ├── index.ts               # MODIFY: Register new plan/execution tool commands
│   ├── commands/
│   │   ├── state.ts            # MODIFY: Add advance-plan, record-metric, add-decision
│   │   ├── progress.ts         # Existing (no changes)
│   │   ├── plan-tools.ts       # NEW: Plan parsing CLI commands (list, waves, read-frontmatter)
│   │   └── ...existing...
│   └── utils/
│       └── ...existing...
└── lib/
    ├── config.ts               # Existing (no changes)
    ├── paths.ts                # Existing (no changes)
    ├── state.ts                # MODIFY: Add advance-plan, record-metric, add-decision functions
    └── plan.ts                 # NEW: Plan parsing, wave computation, dependency resolution

skills/
├── go/
│   └── SKILL.md                # REPLACE: Full /mz:go execution orchestrator
│   └── executor.md             # NEW: Supporting file for execution protocol reference

agents/
├── mz-executor.md              # NEW: Plan executor agent definition
├── mz-researcher.md            # Existing (no changes)
└── mz-planner.md               # Existing (no changes)

commands/
├── go.md                       # NEW: Autocomplete proxy for /mz:go
└── ...existing...
```

### Pattern 1: Skill-as-Orchestrator for /mz:go

**What:** The `/mz:go` skill is the execution conductor. It reads plans, computes wave order, spawns executor subagents, tracks progress, and reports results. The skill does NOT execute code itself -- it delegates all implementation work to subagents.

**When to use:** This is the only pattern for `/mz:go`.

**Architecture:**

```
User invokes /mz:go
        │
        ▼
┌─── SKILL.MD (Orchestrator) ────────────────┐
│  1. Load config + STATE.md                  │
│  2. Find current phase plans                │
│  3. Parse plan frontmatter (via CLI tools)  │
│  4. Compute wave order from depends_on      │
│  5. For each wave:                          │
│     a. For each plan in wave (parallel):    │
│        - Read plan content                  │
│        - Read agent definition              │
│        - Spawn executor via Task tool       │
│        - Track completion                   │
│     b. Wait for all plans in wave           │
│     c. Update progress display              │
│  6. Update STATE.md + ROADMAP.md            │
│  7. Display summary + suggest next step     │
└─────────────────────────────────────────────┘
        │ (for each plan)
        ▼
┌─── EXECUTOR SUBAGENT ──────────────────────┐
│  1. Load plan from prompt context           │
│  2. For each task in plan:                  │
│     a. Execute task (Read/Write/Edit/Bash)  │
│     b. Verify done criteria                 │
│     c. Stage specific files                 │
│     d. Commit atomically                    │
│  3. Create SUMMARY.md                       │
│  4. Return structured completion message    │
└─────────────────────────────────────────────┘
```

**Critical constraint:** The orchestrator spawns one subagent per PLAN.md, not per task. This is because:
1. Tasks within a plan are sequential (a plan is a logical unit of work)
2. The subagent has full plan context for deviation handling
3. Per-task spawning would lose cross-task context (e.g., a variable created in task 1 used in task 2)
4. This matches GSD's proven Pattern A (fully autonomous plan execution)

**Wave parallelism applies to PLANS, not tasks.** Plans in the same wave can run in parallel (they have no `depends_on` relationship). Tasks within a plan always run sequentially.

### Pattern 2: Plan Parsing via gray-matter + TypeScript

**What:** Parse PLAN.md files to extract frontmatter metadata (phase, plan, wave, depends_on, requirements, files_modified) using gray-matter, then expose this data via CLI commands.

**When to use:** Before execution, to determine wave order and plan dependencies.

**Example:**

```typescript
// src/lib/plan.ts
import matter from "gray-matter";
import fse from "fs-extra";
import { join } from "node:path";

export interface PlanMetadata {
  phase: string;
  plan: string;  // "01", "02", etc.
  type: string;
  wave: number;
  depends_on: string[];
  files_modified: string[];
  autonomous: boolean;
  requirements: string[];
}

export interface PlanWave {
  wave: number;
  plans: PlanMetadata[];
}

/** Parse frontmatter from a PLAN.md file */
export function parsePlanFrontmatter(planPath: string): PlanMetadata {
  const content = fse.readFileSync(planPath, "utf-8");
  const { data } = matter(content);
  return {
    phase: data.phase ?? "",
    plan: String(data.plan).padStart(2, "0"),
    type: data.type ?? "execute",
    wave: data.wave ?? 1,
    depends_on: data.depends_on ?? [],
    files_modified: data.files_modified ?? [],
    autonomous: data.autonomous ?? true,
    requirements: data.requirements ?? [],
  };
}

/** List all plans in a phase directory with their metadata */
export function listPlans(phaseDir: string): PlanMetadata[] {
  const files = fse.readdirSync(phaseDir)
    .filter((f: string) => f.match(/^\d+-\d+-PLAN\.md$/) !== null)
    .sort();
  return files.map((f: string) => parsePlanFrontmatter(join(phaseDir, f)));
}

/** Group plans into waves based on their wave field and depends_on */
export function computeWaves(plans: PlanMetadata[]): PlanWave[] {
  const waveMap = new Map<number, PlanMetadata[]>();
  for (const plan of plans) {
    const existing = waveMap.get(plan.wave) ?? [];
    existing.push(plan);
    waveMap.set(plan.wave, existing);
  }
  return Array.from(waveMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([wave, plans]) => ({ wave, plans }));
}

/** Check if a plan has a corresponding SUMMARY.md (completed) */
export function isPlanCompleted(phaseDir: string, planMeta: PlanMetadata): boolean {
  const padded = planMeta.phase.split("-")[0];
  const summaryFile = `${padded}-${planMeta.plan}-SUMMARY.md`;
  return fse.pathExistsSync(join(phaseDir, summaryFile));
}

/** Get incomplete plans (plans without SUMMARY.md), optionally filtered */
export function getIncompletePlans(phaseDir: string): PlanMetadata[] {
  const plans = listPlans(phaseDir);
  return plans.filter(p => !isPlanCompleted(phaseDir, p));
}
```

### Pattern 3: Executor Subagent Spawning (Inline Context)

**What:** The orchestrator reads the full PLAN.md content, the executor agent definition, and relevant project context, then embeds everything as inline text in the Task tool prompt. The subagent executes autonomously and returns a structured completion message.

**When to use:** For every plan execution in `/mz:go`.

**Why inline:** @file references do not work across Task boundaries (established in Phase 3). All content must be embedded in the prompt.

**Example prompt structure:**

```markdown
<agent_role>
{content of agents/mz-executor.md}
</agent_role>

<plan>
{full content of the PLAN.md file being executed}
</plan>

<project_state>
{content of .planning/STATE.md}
</project_state>

<config>
{content of .planning/megazord.config.json}
</config>

<execution_rules>
- Phase: {phase_number}
- Plan: {plan_number}
- Commit format: {type}({phase}-{plan}): {description}
- Do NOT add Co-Authored-By lines to commits
- Stage files individually (never git add . or git add -A)
- One commit per task, no exceptions
- Create SUMMARY.md at {phase_dir}/{padded}-{plan}-SUMMARY.md after all tasks
</execution_rules>

<output>
After completion, return structured result:

## PLAN COMPLETE
**Plan:** {phase}-{plan}
**Tasks:** {completed}/{total}
**SUMMARY:** {path}
**Commits:**
- {hash}: {message}
**Duration:** {time}
</output>
```

### Pattern 4: State Update Pipeline

**What:** After each plan completes, the orchestrator updates STATE.md (position, progress, metrics, decisions) and ROADMAP.md (plan completion counts). These are separate commits from the task code commits.

**When to use:** After every plan completion, and at the end of full execution.

**State update operations needed (new CLI commands):**

```bash
# Advance plan counter (increment current plan, detect last-plan edge)
node bin/megazord.mjs tools state advance-plan

# Record execution metrics (plan duration, task count, file count)
node bin/megazord.mjs tools state record-metric \
  --phase "04" --plan "01" --duration "5min" \
  --tasks 3 --files 8

# Add decisions from SUMMARY.md to Accumulated Context
node bin/megazord.mjs tools state add-decision \
  --phase "04" --summary "Decision text"

# Update ROADMAP.md progress for this phase
node bin/megazord.mjs tools plan update-roadmap --phase 4

# Mark requirements complete in REQUIREMENTS.md
node bin/megazord.mjs tools plan mark-requirements --ids "PROJ-08,AGNT-02"
```

**Commit separation decision (Claude's Discretion recommendation):**
State file updates (STATE.md, ROADMAP.md, REQUIREMENTS.md) should be committed separately from task code. Rationale:
1. Task commits should be clean -- only the code changes for that task
2. State updates are metadata about the execution, not part of the deliverable
3. If execution fails mid-way, completed task commits are valid even without state updates
4. The orchestrator commits state as a `docs()` commit after each plan completes

### Pattern 5: File Conflict Detection for Wave Parallelism

**What:** Before spawning parallel plans in a wave, check if any plans in the wave declare overlapping `files_modified`. If overlap exists, serialize the overlapping plans.

**When to use:** Wave planning step, before spawning subagents.

**Strategy (Claude's Discretion recommendation):**

Without git worktree isolation (Phase 6), parallel subagents writing to the same files will create conflicts. The simplest and most reliable approach:

1. Parse `files_modified` from each plan's frontmatter
2. Compare across plans in the same wave
3. If overlap: log a warning and serialize the conflicting plans (execute one after the other)
4. If no overlap: execute in parallel

```typescript
/** Detect file conflicts between plans in the same wave */
export function detectConflicts(plans: PlanMetadata[]): Map<string, PlanMetadata[]> {
  const fileMap = new Map<string, PlanMetadata[]>();
  for (const plan of plans) {
    for (const file of plan.files_modified) {
      const existing = fileMap.get(file) ?? [];
      existing.push(plan);
      fileMap.set(file, existing);
    }
  }
  // Return only files with 2+ plans
  const conflicts = new Map<string, PlanMetadata[]>();
  for (const [file, plans] of fileMap) {
    if (plans.length > 1) conflicts.set(file, plans);
  }
  return conflicts;
}
```

This is conservative but correct for Phase 4. Phase 6 will add worktree isolation for true parallel execution.

### Anti-Patterns to Avoid

- **Spawning one subagent per task:** Tasks within a plan are sequential and share context. A plan is the atomic unit of subagent delegation. Per-task spawning loses cross-task context and multiplies spawn overhead.

- **Using `git add .` or `git add -A` in executor subagents:** Every commit MUST stage specific files. The `<files>` section in each task declares exactly which files to stage. Wildcard staging risks including unintended files.

- **Embedding @file references in Task prompts:** Proven limitation from Phase 3. All file contents must be read and embedded as inline text before spawning.

- **Executing plans in the orchestrator's context:** The orchestrator should NEVER implement code itself. All implementation work is delegated to executor subagents. This preserves the orchestrator's context for progress tracking and state management.

- **Auto-advancing to the next phase after completion:** User decision marks this as deferred. Phase 4 reports completion and suggests the next command, but does not auto-advance.

- **Including state file updates in task commits:** Task commits should be pure implementation. State/metadata updates get separate `docs()` commits.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Regex extraction of frontmatter | `gray-matter` (already installed) | Handles multiline values, arrays, nested objects, edge cases |
| Plan dependency resolution | Custom graph traversal | Wave-based grouping from `wave` field | Plans already declare their wave; the planner computes dependencies at planning time |
| Progress bar | Manual string building | Existing `progressBar()` from `src/lib/state.ts` | Already implemented, tested, consistent format |
| State section updates | Manual markdown string manipulation | Existing `replaceSection()` pattern from `src/lib/state.ts` | Prevents section corruption, handles edge cases |
| Commit message formatting | Ad-hoc string construction | Template function with type, scope, description | Ensures consistency across all executor subagents |
| Summary creation | Free-form markdown | Structured template from GSD `summary.md` template | Consistent format, machine-parseable frontmatter |

**Key insight:** The plan parsing and wave computation is new work that belongs in TypeScript (`src/lib/plan.ts`). The execution orchestration belongs in SKILL.md. The actual code execution belongs in the executor subagent. Each layer does what it is best at.

## Common Pitfalls

### Pitfall 1: Subagent Context Exhaustion
**What goes wrong:** The executor subagent receives the full plan plus all project context inline, leaving insufficient context for actual implementation.
**Why it happens:** Embedding too much context (full STATE.md, full ROADMAP.md, full RESEARCH.md) in the Task prompt.
**How to avoid:** The executor only needs: (1) the PLAN.md content, (2) the executor agent definition, (3) megazord.config.json (for quality gates), and (4) minimal state context (phase number, plan number). It does NOT need ROADMAP.md, RESEARCH.md, or CONTEXT.md -- those were consumed during planning. The executor reads `<context>` files listed in the plan using its own Read tool.
**Warning signs:** Executor producing shallow implementations, ignoring later tasks, or failing to complete.

### Pitfall 2: Lost Commits from Failed Subagents
**What goes wrong:** An executor subagent completes some tasks and commits them, then fails. The orchestrator doesn't know which commits were made.
**Why it happens:** No tracking of partial progress within a subagent execution.
**How to avoid:** The executor's structured return includes commit hashes for each completed task. Even on failure, the executor should return whatever it completed. The orchestrator can verify commits exist via `git log --oneline -N`. Additionally, SUMMARY.md creation happens AFTER all tasks -- if the subagent fails before SUMMARY, check for commits from the plan scope: `git log --oneline --grep="({phase}-{plan})"`.
**Warning signs:** Orphaned commits with no matching SUMMARY.md.

### Pitfall 3: Wave Parallelism File Conflicts
**What goes wrong:** Two plans in the same wave both modify `src/cli/index.ts`. Both subagents edit the file simultaneously, and the second commit overwrites the first's changes.
**Why it happens:** Without worktree isolation (Phase 6), parallel subagents share the same working directory.
**How to avoid:** Parse `files_modified` from plan frontmatter before spawning. If overlap detected, serialize the conflicting plans within the wave. Log a warning so the user knows parallelism was reduced. Phase 6 will add worktree isolation for true parallelism.
**Warning signs:** Compilation errors after wave completion, missing changes from earlier plans.

### Pitfall 4: State Update Race Conditions
**What goes wrong:** Two parallel executor subagents both try to update STATE.md simultaneously, causing one update to overwrite the other.
**Why it happens:** Subagents share the same filesystem.
**How to avoid:** Subagents should NOT update STATE.md or ROADMAP.md. Only the orchestrator updates state, and it does so sequentially after each wave completes. The executor's only state-modifying actions are git commits (which are atomic and sequential within a single repo).
**Warning signs:** STATE.md losing plan counts, progress percentage not matching reality.

### Pitfall 5: Commit Message Inconsistency
**What goes wrong:** Different executor subagents use different commit message formats (some use conventional commits, others don't, some include Co-Authored-By).
**Why it happens:** The commit format isn't specified clearly enough in the executor agent definition.
**How to avoid:** The executor agent definition MUST specify exact commit format rules. The orchestrator includes these rules in every Task prompt. Format: `{type}({phase}-{plan}): {concise description}` with NO Co-Authored-By line (user decision). The commit type table (feat, fix, test, refactor, chore, docs) should be embedded in the executor definition.
**Warning signs:** `git log --oneline` showing inconsistent message formats.

### Pitfall 6: No Plan Exists Error Not Caught Early
**What goes wrong:** User runs `/mz:go` but no plans exist for the current phase. The skill tries to proceed and fails confusingly.
**Why it happens:** Missing validation at the start of execution.
**How to avoid:** Step 2 of `/mz:go` MUST check for PLAN.md files before proceeding. If none exist, display a clear error box using the design system: "No plans found for Phase {N}. Run `/mz:plan` to create plans first." This is a locked user decision.
**Warning signs:** Confusing error messages about missing files mid-execution.

### Pitfall 7: Partial Execution State Inconsistency
**What goes wrong:** User runs `/mz:go --from 3` but STATE.md still shows plan 0 as current, or progress percentage doesn't account for the first 2 plans being already complete.
**Why it happens:** Partial execution flags not properly integrated with state tracking.
**How to avoid:** The orchestrator must reconcile the execution target with STATE.md state. If `--from 3` is used, check that plans 01 and 02 have SUMMARY.md files (completed). Update STATE.md to reflect the actual starting position before execution begins.
**Warning signs:** Progress bar jumping backwards, STATE.md showing wrong plan number.

## Code Examples

### Plan Parser (src/lib/plan.ts)

```typescript
// src/lib/plan.ts
import matter from "gray-matter";
import fse from "fs-extra";
import { join } from "node:path";
import { z } from "zod";

// ─── Plan metadata schema ───────────────────────────────────────────────

const planMetadataSchema = z.object({
  phase: z.string(),
  plan: z.union([z.string(), z.number()]).transform(v => String(v).padStart(2, "0")),
  type: z.string().default("execute"),
  wave: z.number().default(1),
  depends_on: z.array(z.string()).default([]),
  files_modified: z.array(z.string()).default([]),
  autonomous: z.boolean().default(true),
  requirements: z.array(z.string()).default([]),
});

export type PlanMetadata = z.infer<typeof planMetadataSchema>;

export interface PlanWave {
  wave: number;
  plans: PlanMetadata[];
}

export interface PlanFile {
  path: string;
  filename: string;
  metadata: PlanMetadata;
  content: string;
}

/** Parse a PLAN.md file and extract frontmatter + content */
export function parsePlan(planPath: string): PlanFile {
  const content = fse.readFileSync(planPath, "utf-8");
  const { data, content: body } = matter(content);
  const metadata = planMetadataSchema.parse(data);
  return {
    path: planPath,
    filename: planPath.split("/").pop() ?? "",
    metadata,
    content,  // full content including frontmatter for embedding in Task prompt
  };
}

/** List all PLAN.md files in a phase directory */
export function listPlanFiles(phaseDir: string): PlanFile[] {
  if (!fse.pathExistsSync(phaseDir)) return [];
  const files = fse.readdirSync(phaseDir)
    .filter((f: string) => /^\d+-\d+-PLAN\.md$/.test(f))
    .sort();
  return files.map((f: string) => parsePlan(join(phaseDir, f)));
}

/** Group plans into execution waves */
export function computeWaves(plans: PlanFile[]): PlanWave[] {
  const waveMap = new Map<number, PlanMetadata[]>();
  for (const plan of plans) {
    const w = plan.metadata.wave;
    const existing = waveMap.get(w) ?? [];
    existing.push(plan.metadata);
    waveMap.set(w, existing);
  }
  return Array.from(waveMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([wave, plans]) => ({ wave, plans }));
}

/** Check if a plan is completed (has matching SUMMARY.md) */
export function isPlanComplete(phaseDir: string, meta: PlanMetadata): boolean {
  const padded = meta.phase.split("-")[0];
  const summaryFile = `${padded}-${meta.plan}-SUMMARY.md`;
  return fse.pathExistsSync(join(phaseDir, summaryFile));
}

/** Get all incomplete plans (no matching SUMMARY.md) */
export function getIncompletePlans(phaseDir: string): PlanFile[] {
  return listPlanFiles(phaseDir).filter(p => !isPlanComplete(phaseDir, p.metadata));
}

/** Detect file conflicts between plans in the same wave */
export function detectWaveConflicts(
  plans: PlanMetadata[]
): Map<string, string[]> {
  const fileOwners = new Map<string, string[]>();
  for (const plan of plans) {
    for (const file of plan.files_modified) {
      const owners = fileOwners.get(file) ?? [];
      owners.push(`${plan.phase.split("-")[0]}-${plan.plan}`);
      fileOwners.set(file, owners);
    }
  }
  const conflicts = new Map<string, string[]>();
  for (const [file, owners] of fileOwners) {
    if (owners.length > 1) conflicts.set(file, owners);
  }
  return conflicts;
}
```

### State Management Extensions (additions to src/lib/state.ts)

```typescript
// Additional functions for src/lib/state.ts

/** Advance the plan counter in STATE.md
 * Increments plan number. If plan reaches totalPlans, sets status accordingly.
 */
export function advancePlan(planningDir: string): void {
  const current = readPosition(planningDir);
  if (!current) return;

  const newPlan = current.plan + 1;
  const isLast = newPlan >= current.totalPlans;

  updatePosition(planningDir, {
    plan: newPlan,
    status: isLast ? "Phase complete" : "Executing",
  });

  // Recalculate progress
  const progress = calculateProgress(planningDir);
  updatePosition(planningDir, {
    progressPercent: progress.overall,
  });
}

/** Record execution metrics for a completed plan */
export function recordMetric(
  planningDir: string,
  phase: string,
  plan: string,
  duration: string,
  tasks: number,
  files: number,
): void {
  const statePath = join(planningDir, STATE_FILENAME);
  if (!fse.pathExistsSync(statePath)) return;

  const content = fse.readFileSync(statePath, "utf-8");
  // Find the Performance Metrics section and append to the By Phase table
  // ... section-based update using existing patterns
}

/** Add a decision to the Accumulated Context section */
export function addDecision(
  planningDir: string,
  phase: string,
  decision: string,
): void {
  const statePath = join(planningDir, STATE_FILENAME);
  if (!fse.pathExistsSync(statePath)) return;

  const content = fse.readFileSync(statePath, "utf-8");
  // Find "### Decisions" section, append the decision
  // ... section-based update using existing patterns
}
```

### CLI Commands for Plan Tools (src/cli/commands/plan-tools.ts)

```typescript
// src/cli/commands/plan-tools.ts
import type { Command } from "commander";
import { listPlanFiles, computeWaves, getIncompletePlans, detectWaveConflicts } from "../../lib/plan.js";

export function registerPlanCommands(parent: Command): void {
  const plan = parent
    .command("plan")
    .description("Plan parsing and analysis operations");

  plan
    .command("list")
    .description("List all plans in a phase directory with metadata")
    .requiredOption("--phase-dir <path>", "Phase directory path")
    .action((opts: { phaseDir: string }) => {
      const plans = listPlanFiles(opts.phaseDir);
      console.log(JSON.stringify(plans.map(p => ({
        filename: p.filename,
        ...p.metadata,
        completed: isPlanComplete(opts.phaseDir, p.metadata),
      })), null, 2));
    });

  plan
    .command("waves")
    .description("Compute wave execution order for a phase")
    .requiredOption("--phase-dir <path>", "Phase directory path")
    .action((opts: { phaseDir: string }) => {
      const plans = listPlanFiles(opts.phaseDir);
      const waves = computeWaves(plans);
      console.log(JSON.stringify(waves, null, 2));
    });

  plan
    .command("incomplete")
    .description("List incomplete plans (no SUMMARY.md)")
    .requiredOption("--phase-dir <path>", "Phase directory path")
    .action((opts: { phaseDir: string }) => {
      const incomplete = getIncompletePlans(opts.phaseDir);
      console.log(JSON.stringify(incomplete.map(p => ({
        filename: p.filename,
        ...p.metadata,
      })), null, 2));
    });

  plan
    .command("conflicts")
    .description("Detect file conflicts between plans in the same wave")
    .requiredOption("--phase-dir <path>", "Phase directory path")
    .action((opts: { phaseDir: string }) => {
      const plans = listPlanFiles(opts.phaseDir);
      const waves = computeWaves(plans);
      const result: Record<string, unknown> = {};
      for (const wave of waves) {
        const conflicts = detectWaveConflicts(wave.plans);
        if (conflicts.size > 0) {
          result[`wave_${wave.wave}`] = Object.fromEntries(conflicts);
        }
      }
      console.log(JSON.stringify(result, null, 2));
    });
}
```

### /mz:go Skill Flow (Simplified)

```markdown
## Step 1: Display Banner
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► EXECUTE                        ║
╚═══════════════════════════════════════════════╝

## Step 2: Load Context + Validate
- Read megazord.config.json (error if missing -> /mz:init)
- Read STATE.md for current position
- Read ROADMAP.md for phase details
- Parse user arguments: --tasks, --from, --dry-run (if supported)

## Step 3: Find Plans
- Determine phase directory from current position
- List PLAN.md files via: megazord tools plan list --phase-dir {dir}
- If no plans: error box -> "No plans found. Run /mz:plan"
- Compute waves via: megazord tools plan waves --phase-dir {dir}
- Get incomplete plans via: megazord tools plan incomplete --phase-dir {dir}
- If all plans have SUMMARY.md: "Phase already complete. Run /mz:verify"

## Step 4: Apply Execution Filters
- If --tasks provided: filter to specified task numbers
- If --from provided: skip plans before the specified number
- Display execution plan with wave structure

## Step 5: Execute Waves
For each wave (sequential):
  For each plan in wave (parallel if no file conflicts, else sequential):
    1. Read plan content
    2. Read agents/mz-executor.md
    3. Read megazord.config.json
    4. Embed all as inline text in Task prompt
    5. Spawn executor via Task tool (subagent_type="general-purpose")
    6. Display progress: "◆ Wave {N} ▸ Plan {NN}: {objective}"
    7. Wait for completion
    8. Parse structured result (commits, duration, status)
    9. Update progress: "✓ Plan {NN}: {duration}, {N} tasks, {hash}"
  After wave completes:
    - Run state updates (advance-plan, record-metric)
    - Commit state changes: docs({phase}-{plan}): complete plan

## Step 6: Post-Execution Summary
Display action box with:
  - Plans completed: {N}/{total}
  - Total commits: {count}
  - Total duration: {time}
  - Wave breakdown

## Step 7: Update State + Next Up
- Final STATE.md update with session info
- Display next up block:
  - If more phases: "Phase complete. Use /mz:verify to validate."
  - If last phase: "All phases complete!"
```

## Discretion Recommendations

### 1. Commit Message Format
**Recommendation: Conventional commits with phase-plan scope.**

Format: `{type}({phase}-{plan}): {concise description}`

Examples:
- `feat(04-01): create user registration API endpoint`
- `fix(04-01): correct email validation regex`
- `test(04-01): add failing test for password hashing`
- `refactor(04-02): extract validation to shared helper`
- `chore(04-01): add bcrypt dependency`
- `docs(04-01): complete plan execution summary`

This matches the GSD convention (already familiar to the user from the execute-plan workflow), provides machine-parseable commit history, and makes it easy to filter commits by phase/plan. The `docs()` type is used for state file commits.

### 2. State Files in Task Commits vs Separate Commits
**Recommendation: Separate commits.**

Task commits contain ONLY the implementation files from that task. State updates (STATE.md, ROADMAP.md, REQUIREMENTS.md, SUMMARY.md) are committed separately by the orchestrator as `docs({phase}-{plan}): complete plan` after each plan finishes.

Rationale:
- Clean separation: task commits are pure implementation
- Rollback safety: task commits can be reverted without breaking state tracking
- Conflict avoidance: state files are only modified by the orchestrator (no parallel write risk)
- Debugging: `git log --oneline --grep="feat(04-"` shows only code changes

### 3. Plan Granularity (/mz:go 04-01)
**Recommendation: Support both full-phase and specific-plan execution.**

- `/mz:go` -- execute all incomplete plans in current phase (default)
- `/mz:go --from 3` -- start from plan 03, skip earlier plans
- `/mz:go --tasks 2,4` -- execute only plans 02 and 04

For targeting a specific plan: `/mz:go --tasks 1` executes only plan 01. This is simpler than introducing a separate `04-01` argument syntax and consistent with the filter-flag approach.

### 4. File Conflict Detection Strategy
**Recommendation: Parse files_modified from frontmatter, serialize on conflict.**

As detailed in Pattern 5 above. This is conservative but correct for Phase 4 without worktree isolation. The detection is cheap (parse frontmatter, compare string arrays) and the serialization is transparent (orchestrator logs why plans were serialized).

### 5. Dry Run Support
**Recommendation: Add `--dry-run` as a lightweight feature.**

While `/mz:status --verbose` shows current phase tasks, `--dry-run` adds execution-specific information:
- Wave decomposition with plan assignments
- File conflict analysis
- Estimated execution order (which plans run parallel, which serialize)
- No actual execution

This is low-effort to implement (steps 1-4 of the skill, skip step 5) and provides value that `/mz:status` doesn't (wave analysis, conflict detection).

### 6. Failure Strategy
**Recommendation: Git-based checkpointing with wave-level granularity.**

**Within a plan (executor subagent):**
- If a task fails: executor returns structured failure with completed task commits
- Completed tasks' commits are preserved (already in git)
- The failing task's changes are NOT committed (partial work stays unstaged)
- The orchestrator logs the failure and stops the plan

**Within a wave:**
- If one plan in a wave fails: other plans in the wave may still complete
- The orchestrator waits for all spawned plans before proceeding
- Failed plans are logged, successful plans' state is updated
- Execution stops after the wave (don't start next wave)

**Recovery:**
- Run `/mz:go` again -- it picks up from the first incomplete plan (plan without SUMMARY.md)
- The `--from` flag allows skipping to a specific plan if manual recovery was done
- No explicit rollback command needed -- `git revert` or `git reset` are standard git operations

**Retry policy:** No automatic retries. If a plan fails, stop and report. The user decides whether to retry (run `/mz:go` again), skip (use `--from`), or investigate (use `/mz:debug` when available).

### 7. Failure Reporting Level
**Recommendation: Inline summary with optional file-based detail.**

- **Inline (always):** The orchestrator displays the failure in the progress output: "X Plan {NN}: FAILED -- {error description}"
- **File-based (automatic):** If a plan fails, the executor's error output is saved to `{phase_dir}/{padded}-{plan}-ERROR.md` for post-mortem analysis
- **State update:** STATE.md session continuity records the last error: `Last error: Plan {NN} failed -- {brief error}`

This gives the user immediate visibility (inline) plus detailed diagnostic information (file) without cluttering the main output.

### 8. Subagent Permission Mode
**Recommendation: Inherit user permissions (respect existing config).**

Executor subagents should respect the same permission model as the parent session. Since all subagents are spawned via the Task tool with `subagent_type="general-purpose"`, they inherit the general permission set (Read, Write, Edit, Bash, Grep, Glob, etc.). There is no need to add or restrict permissions beyond what Claude Code already provides.

The `autonomous: true` flag in plan frontmatter indicates the plan should execute without user confirmation at each step. This is already the default behavior for Task tool subagents.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD: gsd-executor.md agent with gsd-tools.cjs state commands | Megazord: mz-executor.md agent with megazord tools state commands | Phase 4 | Unified CLI, no external gsd-tools dependency |
| GSD: Segment-based execution (Pattern A/B/C routing) | Megazord: Plan-level execution with wave orchestration | Phase 4 | Simpler model -- plans are the atomic unit, not segments |
| GSD: Agent tracking via agent-history.json | Megazord: Execution tracking via SUMMARY.md presence/absence | Phase 4 | Simpler -- completed plan = has SUMMARY.md, no separate tracking file |
| GSD: Checkpoint-based human interaction mid-execution | Megazord: Full auto execution, no mid-execution pauses | Phase 4 (user decision) | Matches "fire and forget with visibility" user preference |

**Deprecated/outdated:**
- GSD's Pattern B/C segment execution: Megazord uses Pattern A only (fully autonomous plan execution). Checkpoint-based execution is not needed because the user decided on full-auto execution.
- GSD's `agent-history.json` tracking: Not needed in Megazord. The presence of `{phase}-{plan}-SUMMARY.md` is the completion signal.
- GSD's `Co-Authored-By` in commits: User explicitly decided against this. Commits appear clean.

## Open Questions

1. **Task Tool Parallel Spawning Behavior**
   - What we know: The Task tool can be called to spawn subagents. The `/mz:plan` skill already spawns researcher and planner subagents sequentially.
   - What's unclear: Whether multiple Task tool calls can be made in parallel (fire multiple spawns, then wait for all to complete), or whether each must complete before spawning the next. The Claude Code documentation is not explicit about concurrent Task calls.
   - Recommendation: Implement parallel spawning optimistically (spawn all plans in a wave, then process results as they arrive). If Claude Code serializes Task calls internally, the wave will simply run sequentially -- no harm done. The orchestrator should not depend on true parallelism; it should work correctly whether plans run in parallel or sequentially.

2. **Executor Subagent Access to @-referenced Files in PLAN.md**
   - What we know: PLAN.md `<context>` sections contain `@file` references (e.g., `@.planning/PROJECT.md`). The executor subagent is spawned via Task tool.
   - What's unclear: Whether the executor subagent can resolve `@file` references from the PLAN.md content embedded in its prompt, or whether these are only resolved in the skill's context.
   - Recommendation: The executor subagent should use its Read tool to access context files directly by path, since it has Read tool access. The `<context>` section in PLAN.md lists files the executor should read. The executor agent definition should instruct: "Read all files listed in `<context>` before starting tasks." This sidesteps the @-reference question entirely.

3. **Progress Display During Execution**
   - What we know: User wants "real-time progress" (current task, wave number, %). The orchestrator skill produces text output.
   - What's unclear: How to show progress updates as subagents execute, since the orchestrator waits for Task tool completion.
   - Recommendation: Progress is displayed at the plan/wave level, not at the task level. The orchestrator shows: "Wave 1: Plan 01 executing..." then after completion "Wave 1: Plan 01 complete (3min, 2 tasks)". Task-level progress within a plan is visible to the user in the subagent's output stream. The orchestrator cannot show task-level progress since it is waiting for the Task to complete.

## Sources

### Primary (HIGH confidence)
- Existing Megazord codebase (verified on disk):
  - `src/lib/state.ts` -- State management patterns (section parsing, updating, progress calculation)
  - `src/lib/config.ts` -- Config schema, load/save, presets
  - `src/cli/commands/state.ts` -- CLI command patterns for state operations
  - `src/cli/index.ts` -- CLI entry point, tools subcommand group pattern
  - `skills/plan/SKILL.md` -- Orchestrator skill pattern (Task tool spawning, context embedding)
  - `skills/plan/agents.md` -- Agent spawning documentation and @file limitation
  - `skills/quick/SKILL.md` -- Inline execution with atomic commit pattern
  - `agents/mz-researcher.md` -- Agent definition format
  - `agents/mz-planner.md` -- Agent definition format
  - All Phase 3 PLAN.md and SUMMARY.md files -- Plan format, summary format, commit conventions
  - `package.json` -- Dependency list (gray-matter confirmed available)

- GSD reference implementations (verified on disk):
  - `~/.claude/get-shit-done/workflows/execute-plan.md` -- Full execution workflow with state management
  - `~/.claude/agents/gsd-executor.md` -- Executor agent definition (deviation rules, commit protocol, summary creation, state updates)
  - `~/.claude/get-shit-done/templates/summary.md` -- Summary template with frontmatter

### Secondary (MEDIUM confidence)
- Phase 3 RESEARCH.md -- Architecture patterns, pitfalls, established conventions
- Phase 3 CONTEXT.md -- Locked decisions about plan format, agent patterns

### Tertiary (LOW confidence)
- Parallel Task tool execution -- Whether multiple Task calls can truly run in parallel is unverified. The implementation should work correctly regardless of serialization behavior.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies, all verified in existing codebase
- Architecture (orchestrator pattern): HIGH -- Extends proven Phase 3 `/mz:plan` orchestrator pattern with established Task tool spawning
- Architecture (executor agent): HIGH -- Modeled directly on GSD's gsd-executor.md, adapted for Megazord conventions
- Plan parsing: HIGH -- `gray-matter` already installed and PLAN.md format is stable from Phase 3
- State management extensions: HIGH -- Follows existing patterns in state.ts, additive changes only
- Wave parallelism: MEDIUM -- Parallel Task tool behavior is unverified; conservative file-conflict detection mitigates risk
- Failure handling: MEDIUM -- Strategy is sound but edge cases (partial commits, subagent crashes) need empirical validation
- Pitfalls: HIGH -- Documented from GSD experience, Phase 3 learnings, and established anti-patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, no fast-moving dependencies)

---
*Phase 4 research for: Subagent Execution and Atomic Commits*
*Researched: 2026-02-17*
