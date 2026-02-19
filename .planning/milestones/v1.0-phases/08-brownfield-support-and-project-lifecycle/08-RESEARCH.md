# Phase 8: Brownfield Support and Project Lifecycle - Research

**Researched:** 2026-02-18
**Domain:** Codebase analysis, project lifecycle management, milestone tracking
**Confidence:** HIGH

## Summary

Phase 8 introduces two distinct capabilities to Megazord: (1) `/mz:map` -- a codebase analysis skill that spawns parallel agents to produce structured documents about an existing codebase, enabling brownfield project onboarding, and (2) full project lifecycle management -- milestone creation, phase transitions with mandatory verification gates, phase management commands (add, remove, insert), and milestone audit/archive workflows.

The research domain is entirely internal to the Megazord ecosystem. There are no external libraries, APIs, or frameworks needed. All implementation builds on existing Megazord infrastructure: the SKILL.md skill system, Task tool subagent spawning, CLI tooling in `src/`, agent definitions in `agents/`, and the `.planning/` state management pattern. GSD provides a mature, battle-tested reference implementation for both codebase mapping and milestone lifecycle that can be adapted directly.

**Primary recommendation:** Implement as two plan waves -- Plan 01 for `/mz:map` (mapper agent + skill + CLI tools) and Plan 02 for lifecycle management (milestone/phase commands, transition logic, archive strategy). Both are self-contained but lifecycle management benefits from map output feeding into roadmap creation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Multi-document output per area (separate files, not a single monolith)
- Areas: at minimum GSD's four (tech stack, architecture, code quality, concerns) -- Claude may add others if useful for planning
- Parallel agents: one agent per area, running concurrently
- Optional focus parameter: user can specify a subset of areas (e.g., `/mz:map architecture`) -- default runs all
- Brownfield roadmap creation uses automatic analysis + user review (Claude proposes, user approves/modifies)
- Dedicated agents: researcher for gathering/analysis, planner/roadmapper for structuring phases
- Milestone model follows GSD pattern: milestones group phases, audit before closing, archive and transition
- Audit is mandatory before closing a milestone -- deliverables must be verified
- Verification (/mz:verify) is mandatory before advancing to next phase -- verification gate is enforced
- Phase transitions are manual -- user decides when to start next phase (no auto-advance between phases)
- Phase management commands: dedicated commands for adding, removing, and inserting phases (like GSD's add-phase, remove-phase, insert-phase with decimal numbering)

### Claude's Discretion
- Output path structure and whether to synthesize a summary document from mapping
- Re-mapping behavior (overwrite vs ask)
- How /mz:map output feeds into /mz:plan for brownfield projects
- Roadmap format adaptation for brownfield (same as greenfield or with additional sections)
- Milestone skill architecture (new dedicated skill vs extension of existing skills)
- Archive strategy for completed milestones
- Phase skip/reorder flexibility
- Specific area categories beyond GSD's four defaults

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-09 | User can manage full project lifecycle: roadmap, phases, milestones, phase transitions | Lifecycle management architecture fully documented: milestone CRUD, phase add/remove/insert commands, transition gates, audit/archive workflow. GSD reference implementation thoroughly analyzed. |
| PROJ-10 | User can analyze existing codebases with `/mz:map` for brownfield project support | Codebase mapping architecture fully documented: parallel mapper agents, 7-document output structure, focus parameter support, brownfield-to-roadmap integration path. GSD reference implementation directly portable. |
</phase_requirements>

## Standard Stack

### Core

No external libraries needed. Phase 8 is entirely built on existing Megazord infrastructure.

| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| SKILL.md system | `skills/*/SKILL.md` | Skill definitions read by Claude Code | Established pattern across all 13 existing skills |
| Task tool spawning | Claude Code built-in | Parallel subagent execution | Used by /mz:plan, /mz:go, /mz:verify already |
| CLI tooling (megazord.mjs) | `src/cli/commands/` | State management, plan parsing, file operations | Existing `state.ts`, `plan.ts`, `progress.ts` patterns |
| Agent definitions | `agents/mz-*.md` | Embedded in Task prompts for subagent behavior | 5 agents already exist (executor, planner, researcher, reviewer, verifier) |
| Zod schemas | `src/lib/config.ts` | Config validation | Existing pattern for config, plan frontmatter |

### Supporting

| Component | Location | Purpose | When Used |
|-----------|----------|---------|-----------|
| `gray-matter` | dependency | YAML frontmatter parsing | Parsing plan/summary frontmatter (already used in `plan.ts`) |
| `fs-extra` | dependency | File operations | All file I/O (already used everywhere) |
| Design system | `skills/init/design-system.md` | Visual output formatting | Banners, action boxes, status displays |

### Alternatives Considered

None applicable. This phase extends existing infrastructure, not introducing new technology choices.

## Architecture Patterns

### Recommended File Structure

```
skills/
  map/
    SKILL.md               # /mz:map orchestrator (replace current stub)
    mapper.md              # Mapper agent spawning patterns reference
agents/
  mz-mapper.md            # Codebase mapper agent definition
src/
  lib/
    milestone.ts           # Milestone CRUD, archive, audit helpers
    roadmap.ts             # Roadmap parsing, phase management (add/remove/insert)
  cli/
    commands/
      milestone-tools.ts   # CLI commands for milestone operations
      roadmap-tools.ts     # CLI commands for phase management (add, remove, insert)
.planning/
  codebase/               # Map output directory
    STACK.md
    ARCHITECTURE.md
    STRUCTURE.md
    CONVENTIONS.md
    TESTING.md
    INTEGRATIONS.md
    CONCERNS.md
    SUMMARY.md             # Optional synthesis document
  milestones/
    v1.0-ROADMAP.md        # Archived roadmap for completed milestones
    v1.0-REQUIREMENTS.md   # Archived requirements
    MILESTONES.md          # Milestone history log
```

### Pattern 1: Parallel Mapper Agents (from GSD)

**What:** Spawn one Task tool subagent per analysis area. Each agent explores the codebase independently and writes its document directly.
**When to use:** Always for `/mz:map`. The orchestrator spawns agents and collects confirmations (not document content).

**Key design:** Agents write documents directly to `.planning/codebase/`. The orchestrator only receives file paths and line counts back -- no document content crosses the Task tool boundary. This preserves context budget for the orchestrator.

**Megazord adaptation from GSD:**
- GSD uses `subagent_type="gsd-codebase-mapper"` -- Megazord uses `subagent_type="general-purpose"` with the `mz-mapper.md` agent definition embedded inline (matching the established pattern from /mz:plan and /mz:go)
- GSD uses `run_in_background=true` for parallel execution -- Megazord can use the same pattern
- GSD uses a dedicated agent type with built-in templates -- Megazord embeds templates inline in the Task prompt
- GSD produces 7 documents from 4 agents (tech: 2 docs, arch: 2 docs, quality: 2 docs, concerns: 1 doc) -- Megazord can use the same split

**Agent mapping (4 agents, 7 documents):**

| Agent | Focus | Documents Produced |
|-------|-------|-------------------|
| Agent 1: Tech | Technology stack and external integrations | STACK.md, INTEGRATIONS.md |
| Agent 2: Architecture | Code organization and directory structure | ARCHITECTURE.md, STRUCTURE.md |
| Agent 3: Quality | Conventions and testing patterns | CONVENTIONS.md, TESTING.md |
| Agent 4: Concerns | Tech debt, known issues, fragile areas | CONCERNS.md |

**Optional 5th: Synthesis**
After all 4 complete, optionally spawn a synthesizer to read all 7 docs and produce SUMMARY.md with key findings. This is useful for feeding into `/mz:plan` brownfield roadmap creation.

**Recommendation:** Include SUMMARY.md synthesis. Cost is one additional subagent, but the value is significant -- it provides a compact reference for the planner agent when creating brownfield roadmaps, avoiding the need to embed all 7 full documents.

### Pattern 2: Focus Parameter Filtering

**What:** `/mz:map architecture` runs only the architecture mapper agent instead of all four.
**When to use:** When user wants to analyze or refresh a specific area.

**Implementation:**
- Parse the argument after `/mz:map` as the focus area
- Map focus to agent(s): `tech` -> Agent 1, `architecture` / `arch` -> Agent 2, `quality` / `conventions` -> Agent 3, `concerns` -> Agent 4
- If no argument: run all four (default)
- If focus provided: run only the matching agent(s)
- Synthesis agent only runs when all areas were mapped (not on focused runs)

### Pattern 3: Re-mapping Behavior

**What:** When `.planning/codebase/` already exists, offer the user choice.
**Recommendation:** Follow GSD's 3-option pattern:
1. **Refresh** -- Delete existing and remap all areas
2. **Update** -- Keep existing, only remap specified areas
3. **Skip** -- Use existing map as-is

This is clean, intuitive, and handles all cases. No need to innovate here.

### Pattern 4: Milestone Lifecycle (from GSD)

**What:** Milestones group phases into versioned releases. The lifecycle is: create milestone -> plan phases -> execute phases -> audit milestone -> complete milestone (archive and tag).
**When to use:** When a user has completed a set of phases and wants to mark a release, or when starting a new development cycle.

**GSD flow adapted for Megazord:**

1. **Create milestone** (`/mz:plan` when all phases done, or new dedicated flow): Define version, goals, scoped requirements. Spawn roadmapper to create phases.
2. **Execute phases** (existing `/mz:go` + `/mz:verify`): Normal phase execution with mandatory verification gates.
3. **Audit milestone**: Aggregate all phase verifications, check cross-phase integration, assess requirement coverage. Produces MILESTONE-AUDIT.md.
4. **Complete milestone**: Archive roadmap/requirements to `milestones/`, create git tag, update PROJECT.md, offer next milestone.

**Recommendation on skill architecture:** Extend existing skills rather than creating many new ones.
- `/mz:plan` already handles roadmap creation when ROADMAP.md is missing -- extend it to handle brownfield (read codebase map output if available)
- Milestone audit can be a mode of `/mz:verify` (e.g., `/mz:verify --milestone v1.0`)
- Milestone completion can be a separate small skill or a mode of `/mz:status` with `--complete-milestone`

However, given the complexity of milestone completion (archive, tag, PROJECT.md evolution, requirements reset), a new dedicated workflow is cleaner. The GSD pattern uses separate commands for each operation.

**Final recommendation:** Three lifecycle entry points integrated into existing skills:
1. `/mz:verify --milestone` for milestone audit (extends verify)
2. Phase transition logic embedded in `/mz:go` post-execution flow (when all phases complete)
3. Phase management via CLI tools exposed through `/mz:plan` (add/remove/insert phases)

### Pattern 5: Phase Management Commands

**What:** Add, remove, and insert phases in the roadmap without manual file editing.
**When to use:** When the user discovers new work needed (add), removes unnecessary phases (remove), or needs urgent insertions (insert with decimal numbering).

**GSD reference:**
- `add-phase`: Appends a new integer phase at the end. Creates directory. Updates ROADMAP.md.
- `remove-phase`: Removes a future unstarted phase. Deletes directory. Renumbers subsequent phases.
- `insert-phase`: Inserts a decimal phase (e.g., 6.1) between existing phases. No renumbering.

**Megazord implementation:** CLI tools in `src/lib/roadmap.ts` + `src/cli/commands/roadmap-tools.ts`:
- `megazord.mjs tools roadmap add-phase "{description}"`
- `megazord.mjs tools roadmap remove-phase {number}`
- `megazord.mjs tools roadmap insert-phase {after} "{description}"`

These CLI tools handle the mechanical work (directory creation, ROADMAP.md editing, renumbering). The skill layer (`/mz:plan`) can expose these to the user in a conversational flow.

### Pattern 6: Verification Gate Enforcement

**What:** Phase transitions are blocked until `/mz:verify` passes. This is a locked decision.
**Implementation:** The `/mz:go` orchestrator already suggests `/mz:verify` after completing all plans. The enforcement point is in the transition logic: when advancing from phase N to phase N+1, check that `{phase_dir}/{padded}-VERIFICATION.md` exists and has `status: passed` or `status: human_needed` (with all human items confirmed).

**Where to enforce:**
- In `/mz:plan` when detecting the next phase to plan: if previous phase lacks VERIFICATION.md with passed status, warn and suggest `/mz:verify` first
- In the CLI tool `state advance-phase` (new): check verification status before allowing advancement

### Pattern 7: Brownfield Roadmap Integration

**What:** When `/mz:plan` creates a roadmap for a brownfield project, it should leverage codebase map output.
**Recommendation:** `/mz:plan` checks for `.planning/codebase/SUMMARY.md` (or individual map docs). If found, include the summary in the roadmapper agent prompt as `<codebase_context>`. This gives the roadmapper awareness of existing architecture, tech stack, and concerns when structuring phases.

If no codebase map exists but the project has existing code (detected by `package.json`, `src/`, etc.), suggest running `/mz:map` first:
```
> Codebase Analysis
  ! Existing code detected but no codebase map found.
  Run /mz:map first for better roadmap quality, or continue without.
```

This is a soft check (warn but don't block), matching the CONTEXT.md soft check pattern in `/mz:plan`.

### Anti-Patterns to Avoid

- **Monolith map document:** Don't produce a single giant analysis file. Multi-document per area (locked decision). Each document stays focused and is independently refreshable.
- **Orchestrator reading map documents:** The map skill orchestrator should NOT read the full content of produced documents. Agents write directly; orchestrator only verifies existence and collects line counts. This preserves context budget.
- **Auto-advancing phases:** Phase transitions are manual (locked decision). Never auto-start the next phase after verification passes. Present the suggestion and let the user decide.
- **Milestone completion without audit:** Audit is mandatory (locked decision). The completion flow must check for MILESTONE-AUDIT.md before proceeding.
- **Modifying completed phases:** Phase management commands (remove, insert) should only operate on future/unstarted phases. Completed phases are historical records.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ROADMAP.md parsing | Custom regex per line | Section-based markdown parsing (existing `extractSection` pattern in `state.ts`) | Consistent with existing codebase; less fragile than regex |
| Phase directory creation | Manual mkdir + file writing | Centralized in `roadmap.ts` library with Zod validation | Reusable across add/remove/insert; consistent naming |
| Git tagging for milestones | Raw `git tag` calls scattered in skill | Dedicated function in `milestone.ts` | Encapsulates tag message format, error handling |
| Progress recalculation after phase changes | Manual counting | Existing `calculateProgress()` in `state.ts` | Already handles phase/plan counting from ROADMAP.md |
| Document templates for mapper | Inline template strings in skill | Separate template content in agent definition or reference file | Keeps agent definitions clean; templates reusable |

**Key insight:** Almost all mechanical operations have precedent in the existing codebase. The state management pattern (section-based markdown parsing in `state.ts`), the CLI tool pattern (`src/cli/commands/`), and the agent spawning pattern (`agents/mz-*.md` embedded in Task prompts) are proven and should be followed exactly.

## Common Pitfalls

### Pitfall 1: Context Budget Explosion from Map Documents

**What goes wrong:** Orchestrator tries to read all 7 map documents back into its own context after agents produce them, wasting tokens.
**Why it happens:** Natural instinct to "verify" content by reading it.
**How to avoid:** Follow GSD's pattern strictly -- agents write documents directly, orchestrator only checks file existence and line counts via `wc -l`. The map documents are consumed later by other skills (e.g., `/mz:plan`), not by the map orchestrator itself.
**Warning signs:** Orchestrator using Read tool on `.planning/codebase/*.md` after spawning agents.

### Pitfall 2: Milestone Archive Losing Phase History

**What goes wrong:** Archiving a milestone deletes phase directories, losing execution history (PLAN.md, SUMMARY.md files).
**Why it happens:** Aggressive cleanup without considering that archived phases are still useful as reference.
**How to avoid:** Make phase directory archival optional (GSD does this with AskUserQuestion). When archiving, move to `milestones/v1.0-phases/` instead of deleting.
**Warning signs:** `rm -rf .planning/phases/` during milestone completion.

### Pitfall 3: Decimal Phase Numbering Collisions

**What goes wrong:** Inserting a phase after phase 6 when 6.1 already exists produces duplicate numbering.
**Why it happens:** Not checking existing decimal phases before calculating the next one.
**How to avoid:** CLI tool must scan the filesystem for existing `{N}.{M}-*` directories before assigning the next decimal. GSD's `phase next-decimal` command handles this correctly.
**Warning signs:** Two phase directories starting with the same number.

### Pitfall 4: Verification Gate Bypass

**What goes wrong:** User advances to next phase without running `/mz:verify`, skipping the mandatory gate.
**Why it happens:** Nothing physically prevents manual state edits or skipping the verify step.
**How to avoid:** Enforcement at the skill level -- `/mz:plan` for the next phase checks if the previous phase has a passing VERIFICATION.md. Display a strong warning (not an error, since the user has final authority).
**Warning signs:** STATE.md showing a new phase as "In Progress" without VERIFICATION.md for the previous phase.

### Pitfall 5: Map Agent Scope Creep

**What goes wrong:** Mapper agents try to analyze the entire filesystem, including `node_modules`, `.git`, build outputs.
**Why it happens:** Agent not given clear scope boundaries.
**How to avoid:** Agent definition must explicitly list directories to exclude: `node_modules/`, `.git/`, `dist/`, `build/`, `.planning/`, `coverage/`, etc. Also set reasonable depth limits for large codebases.
**Warning signs:** Agent running for 10+ minutes, producing 1000+ line documents.

### Pitfall 6: Secret Leakage in Map Documents

**What goes wrong:** Mapper agents accidentally include API keys, tokens, or passwords found in config files or environment examples.
**Why it happens:** Agents read `.env.example`, config files with placeholder secrets, or actual `.env` files.
**How to avoid:** Post-mapping secret scan (GSD does this). Run regex patterns for common secret formats before committing map documents. Block commit if found.
**Warning signs:** Grep patterns matching `sk-`, `AKIA`, `ghp_`, `-----BEGIN.*PRIVATE KEY` in map output.

## Code Examples

### Example 1: Mapper Agent Spawning (from GSD, adapted for Megazord)

```
# Megazord pattern: read agent definition, embed inline in Task prompt
Read {plugin_path}/agents/mz-mapper.md -> mapper_instructions

Task(
  prompt="<agent_role>{mapper_instructions}</agent_role>

  <focus>tech</focus>

  <instructions>
  Analyze this codebase for technology stack and external integrations.

  Write these documents to .planning/codebase/:
  - STACK.md - Languages, runtime, frameworks, dependencies, configuration
  - INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

  Explore thoroughly. Write documents directly. Return confirmation only.

  EXCLUDE from analysis: node_modules/, .git/, dist/, build/, .planning/, coverage/
  </instructions>

  <output_format>
  ## Mapping Complete

  **Focus:** tech
  **Documents written:**
  - `.planning/codebase/STACK.md` ({N} lines)
  - `.planning/codebase/INTEGRATIONS.md` ({N} lines)
  </output_format>",
  subagent_type="general-purpose",
  description="Map codebase tech stack"
)
```

### Example 2: Phase Add CLI Tool Pattern

```typescript
// src/lib/roadmap.ts

export function addPhase(planningDir: string, description: string): {
  phase_number: number;
  padded: string;
  name: string;
  slug: string;
  directory: string;
} {
  const roadmapPath = join(planningDir, "ROADMAP.md");
  const content = fse.readFileSync(roadmapPath, "utf-8");

  // Find highest existing integer phase
  const phaseMatches = content.matchAll(/Phase\s+(\d+):/g);
  let maxPhase = 0;
  for (const match of phaseMatches) {
    const num = parseInt(match[1], 10);
    if (num > maxPhase) maxPhase = num;
  }

  const newPhase = maxPhase + 1;
  const padded = String(newPhase).padStart(2, "0");
  const slug = generateSlug(description);
  const directory = join(planningDir, "phases", `${padded}-${slug}`);

  // Create directory
  fse.mkdirSync(directory, { recursive: true });

  // Insert into ROADMAP.md
  // ... (section-based insertion after last phase entry)

  return { phase_number: newPhase, padded, name: description, slug, directory };
}
```

### Example 3: Milestone Archive Pattern

```typescript
// src/lib/milestone.ts

export function archiveMilestone(
  planningDir: string,
  version: string,
  name: string,
): ArchiveResult {
  const milestonesDir = join(planningDir, "milestones");
  fse.mkdirSync(milestonesDir, { recursive: true });

  // Archive ROADMAP.md
  const roadmapSrc = join(planningDir, "ROADMAP.md");
  const roadmapDst = join(milestonesDir, `${version}-ROADMAP.md`);
  fse.copySync(roadmapSrc, roadmapDst);

  // Archive REQUIREMENTS.md
  const reqSrc = join(planningDir, "REQUIREMENTS.md");
  const reqDst = join(milestonesDir, `${version}-REQUIREMENTS.md`);
  if (fse.pathExistsSync(reqSrc)) {
    fse.copySync(reqSrc, reqDst);
  }

  // Create/append MILESTONES.md entry
  // ... (using template pattern)

  return { version, date: new Date().toISOString(), archived: [roadmapDst, reqDst] };
}
```

## State of the Art

| Old Approach (GSD) | Current Approach (Megazord) | Impact |
|---------------------|----------------------------|--------|
| Dedicated agent types (`gsd-codebase-mapper`) | `subagent_type="general-purpose"` with embedded agent definition | Megazord uses one agent type for everything, more flexible |
| `@file` references in prompts | All content read and embedded inline in Task prompts | Required by Task tool boundary constraint |
| CLI-centric phase management (`gsd-tools phase add`) | Same pattern via `megazord.mjs tools roadmap add-phase` | Direct port, same architecture |
| Auto-advance in YOLO mode | Manual transitions always (locked decision) | Simpler, user always in control |
| `run_in_background=true` for parallel agents | Same `run_in_background=true` pattern | Direct port, no changes needed |

**Deprecated/outdated:**
- GSD's `auto_advance` config option: Megazord deliberately does not implement auto-advance (locked decision from CONTEXT.md)

## Open Questions

1. **Milestone skill entry point naming**
   - What we know: Milestone lifecycle needs creation, audit, and completion flows
   - What's unclear: Whether to create new `/mz:milestone` skill or integrate into existing skills
   - Recommendation: Integrate audit into `/mz:verify --milestone`. Create one new `/mz:milestone` skill that handles creation and completion. This gives 3 entry points: `/mz:milestone new`, `/mz:milestone complete`, `/mz:verify --milestone`. Keep it minimal -- the user already has `/mz:plan` for roadmap creation.
   - **Alternative:** Keep lifecycle fully within existing skills. `/mz:plan` detects "all phases done" and offers milestone completion. `/mz:verify --milestone` for audit. No new skill needed. This is simpler but less discoverable.
   - **Planner should decide** based on complexity and number of tasks.

2. **Phase management command UX**
   - What we know: Need add, remove, insert commands (locked decision)
   - What's unclear: How users invoke these -- as `/mz:plan add-phase {desc}`, as standalone CLI, or as conversation commands
   - Recommendation: Expose through `/mz:plan` skill with subcommands: `/mz:plan add-phase`, `/mz:plan remove-phase`, `/mz:plan insert-phase`. This keeps the plan skill as the central hub for all roadmap/phase management. CLI tools handle the mechanics.

3. **ROADMAP.md format for milestone grouping**
   - What we know: GSD uses `<details>` tags to collapse completed milestones and a Milestones summary section
   - What's unclear: Whether Megazord's ROADMAP.md needs this grouping or stays flat
   - Recommendation: Add milestone grouping only when milestone completion is triggered. Before any milestones are completed, ROADMAP.md stays in its current flat format. On first milestone completion, add the Milestones summary section and group completed phases under a milestone header. This avoids premature complexity.

## Sources

### Primary (HIGH confidence)
- GSD `map-codebase.md` workflow: Full parallel mapper implementation with 4 agents producing 7 documents. Directly applicable.
- GSD `complete-milestone.md` workflow: Full milestone lifecycle with archive, PROJECT.md evolution, git tagging. Directly applicable.
- GSD `new-milestone.md` workflow: Milestone creation with research, requirements, roadmap spawning. Reference for creation flow.
- GSD `audit-milestone.md` workflow: 3-source cross-reference verification, integration checking, gap detection. Reference for audit.
- GSD `add-phase.md`, `remove-phase.md`, `insert-phase.md` workflows: Phase management with decimal numbering. Directly applicable.
- GSD `transition.md` workflow: Phase completion, state updates, verification checks. Reference for transition logic.
- GSD codebase templates (`templates/codebase/`): 7 document templates (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Directly usable as embedded templates.
- Existing Megazord codebase: `skills/map/SKILL.md` (stub), `skills/plan/SKILL.md`, `skills/go/SKILL.md`, `skills/verify/SKILL.md`, `src/lib/state.ts`, `src/lib/plan.ts`, `src/lib/config.ts`, `agents/mz-*.md`

### Secondary (MEDIUM confidence)
- GSD `plan-milestone-gaps.md` workflow: Gap closure phase creation from audit results. Useful pattern if milestone audit finds gaps.

### Tertiary (LOW confidence)
None. All findings are from direct codebase analysis of verified, working systems.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries. All implementation uses existing Megazord patterns.
- Architecture: HIGH -- GSD provides battle-tested reference implementations that map 1:1 to Megazord's architecture. Parallel agent spawning, CLI tooling, state management all have existing precedent.
- Pitfalls: HIGH -- Pitfalls identified from actual GSD implementation patterns and known Megazord constraints (context budget, Task tool boundaries, bun-only requirement).

**Research date:** 2026-02-18
**Valid until:** Indefinite -- this research covers internal architecture patterns, not external dependencies that could change.
