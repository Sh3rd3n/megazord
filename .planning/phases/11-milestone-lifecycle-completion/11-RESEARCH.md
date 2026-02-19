# Phase 11: Milestone Lifecycle Completion - Research

**Researched:** 2026-02-19
**Domain:** Skill orchestration wiring existing CLI milestone tools into a guided skill experience
**Confidence:** HIGH

## Summary

Phase 11 closes the last gap in the v1.0 milestone: providing a skill-level path for the full milestone lifecycle. The foundation is solid -- `milestone.ts` already implements `createMilestone()`, `archiveMilestone()`, and `checkMilestoneAudit()`, and the CLI commands in `milestone-tools.ts` expose these as `tools milestone create|archive|audit`. The `/mz:verify --milestone` flow already produces a MILESTONE-AUDIT.md and suggests archiving. What is missing is the guided skill that connects audit-pass to archive, collects deferred items, resets state, and prepares for the next version.

This is a wiring and orchestration phase, not a library-building phase. All the primitives exist. The work is: (1) create a new skill (or extend an existing one) that guides the user through audit, archive, deferred item collection, and next-version preparation, and (2) ensure the gap-closure loop works (audit fails -> propose phases -> re-audit).

**Primary recommendation:** Create a single unified `/mz:lifecycle` skill (registered as a new skill under `skills/lifecycle/`) that orchestrates the full milestone completion flow: audit -> summary -> archive -> deferred items -> next version. Use the existing CLI tools (`milestone audit`, `milestone archive`, `milestone create`) as the execution backbone, with the skill providing the guided interactive experience.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Skill flow design:**
  - Claude's Discretion: whether to use a single unified skill or separate skills for each step
  - Claude's Discretion: interaction model (fully automatic vs interactive with confirmations)
  - Always show a milestone status summary (phases completed, gaps, progress) before proceeding with archive
- **Archive behavior:**
  - Claude's Discretion: archive destination structure (e.g., .planning/archive/v1.0/)
  - Claude's Discretion: move vs copy strategy for archived phase directories
  - Claude's Discretion: git tag creation (automatic vs prompted)
  - Claude's Discretion: ROADMAP.md and STATE.md reset behavior after archive
- **Next version preparation:**
  - Deferred items: collect from all CONTEXT.md files, present the list to the user, user selects which to carry forward into the new milestone backlog
  - Configuration (megazord.config.json) is inherited as-is -- no config review prompt on new milestone
  - Version numbering: suggest the next version number (semver bump), user confirms or modifies
  - Claude's Discretion: whether to guide directly into new milestone creation or just suggest next steps
- **Audit-archive link:**
  - When audit finds gaps: propose gap-closure phases (like v1.0 phases 9-11 pattern)
  - After gap-closure phases complete: auto re-audit to verify gaps are closed
  - Iteration limit: unlimited -- keep proposing gap closure until audit passes 100%
  - Skip audit: support a --skip-audit flag for projects where formality isn't needed

### Claude's Discretion
- Overall skill architecture (unified vs separate skills)
- Level of interactivity at each step
- Archive file organization and cleanup strategy
- Git tag naming and creation
- State file reset approach
- Post-archive flow (guided vs suggested next steps)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-09 | User can manage full project lifecycle: roadmap, phases, milestones, phase transitions | The existing `milestone.ts` provides create/archive/audit functions; `roadmap.ts` provides phase management. Phase 11 wires these into a skill-level path so users never need CLI-only operations. Completing this closes the PROJ-09 partial gap identified in the v1.0 audit. |
</phase_requirements>

## Standard Stack

### Core

This phase does not introduce new libraries. It wires existing infrastructure into a new skill.

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `src/lib/milestone.ts` | Library | `createMilestone()`, `archiveMilestone()`, `checkMilestoneAudit()` | Complete, tested |
| `src/cli/commands/milestone-tools.ts` | CLI | `tools milestone create\|archive\|audit` | Complete, registered |
| `src/lib/roadmap.ts` | Library | `parseRoadmapPhases()`, `addPhase()`, `insertPhase()`, `checkVerificationGate()` | Complete, tested |
| `src/cli/commands/roadmap-tools.ts` | CLI | `tools roadmap list\|add-phase\|insert-phase\|check-gate` | Complete, registered |
| `src/lib/state.ts` | Library | `readPosition()`, `updatePosition()`, `updateSessionContinuity()`, `calculateProgress()` | Complete, tested |
| `skills/verify/SKILL.md` | Skill | `/mz:verify --milestone` milestone audit mode | Complete |
| `skills/plan/SKILL.md` | Skill | Phase management subcommands (add-phase, insert-phase) | Complete |

### Supporting

| Component | Purpose | When Used |
|-----------|---------|-----------|
| `skills/init/design-system.md` | Visual output formatting | Banners, action boxes, status symbols |
| `commands/*.md` | Autocomplete proxy | New `commands/lifecycle.md` needed for discoverability |
| `skills/help/SKILL.md` | Help listing | Update to include the new skill |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single unified skill | Separate skills (e.g., `/mz:archive`, `/mz:next-version`) | Unified is better: the lifecycle is sequential and users should not need to remember which command comes next. One entry point with clear steps. |
| Interactive step-by-step | Fully automatic (one command does everything) | Interactive is better: archive is destructive, version selection is subjective, deferred item selection requires human judgment. |
| Extending `/mz:verify` | New standalone skill | Verify already has milestone audit; adding archive + deferred items + version prep would bloat it. Clean separation: verify = check, lifecycle = act on results. |

**Recommendation:** Single unified skill (`/mz:lifecycle`) with interactive confirmations at key decision points.

## Architecture Patterns

### Recommended Skill Structure

```
skills/
  lifecycle/
    SKILL.md          # Main skill definition (orchestrator)
commands/
  lifecycle.md        # Autocomplete proxy (1 line, per pattern)
```

No new agents needed. No new CLI tools needed. No new library code needed. This is purely a skill-level orchestration task that calls existing CLI tools.

### Pattern 1: Skill as CLI Orchestrator

**What:** The skill reads state files, calls CLI tools via Bash, and presents results to the user with interactive confirmations. This is the same pattern used by `/mz:verify`, `/mz:plan`, and `/mz:go`.

**When to use:** When all primitives exist and the skill's job is flow control and user interaction.

**Example flow:**
```
1. Load config, state, roadmap (same as /mz:verify Step 2)
2. Determine milestone scope (from MILESTONE.md or all completed phases)
3. Run milestone audit via CLI (or use existing MILESTONE-AUDIT.md)
4. Show milestone summary to user
5. If gaps: propose gap-closure phases, exit
6. If passed: proceed to archive
7. Run archive via CLI
8. Collect deferred items from CONTEXT.md files
9. Present deferred items, user selects
10. Suggest next version, user confirms
11. Create new milestone, reset state
```

### Pattern 2: Deferred Items Collection

**What:** Scan all CONTEXT.md files in `<deferred>` sections, extract non-empty deferred items, present them to the user for selection.

**When to use:** During milestone completion, before preparing the next version's backlog.

**Implementation approach:**
```
For each phase directory:
  Read {padded}-CONTEXT.md
  Extract text between <deferred> and </deferred>
  Parse bullet points (lines starting with "- ")
  Skip "None" entries
  Collect {phase_number, item_text}
Present as numbered list
User selects which to carry forward
```

**Evidence from codebase:** Phases 4, 5, and 9 have actual deferred items:
- Phase 4: "Git worktree isolation for parallel agents", "Reviewer feedback loops during execution", "Auto-advance to next phase after completion"
- Phase 5: "Agent Teams review-fix loop with direct inter-agent communication", "Reviewer-executor real-time feedback via SendMessage"
- Phase 9: "Full clean code audit of entire codebase"

All others have "None" in their deferred sections.

### Pattern 3: Gap-Closure Phase Proposal

**What:** When milestone audit finds gaps, automatically propose new phases to close them, following the v1.0 pattern where phases 9-11 were created to close audit gaps.

**When to use:** After milestone audit produces `gaps_found` status.

**Implementation approach:**
```
1. Parse MILESTONE-AUDIT.md gaps section
2. Group gaps by nature (config issues, distribution, lifecycle, etc.)
3. For each gap group, propose a new phase using:
   node {plugin_path}/bin/megazord.mjs tools roadmap add-phase --description "{gap description}"
4. Update ROADMAP.md with new phases
5. Suggest running /mz:plan for the new phases
6. After those phases complete, re-run /mz:lifecycle to re-audit
```

### Pattern 4: Archive and State Reset

**What:** Archive the current milestone and reset state files for the next version.

**Implementation approach -- my recommendation for Claude's Discretion areas:**

**Archive destination:** Use the existing `archiveMilestone()` function which archives to `.planning/milestones/`:
- `.planning/milestones/{version}-ROADMAP.md` (copy)
- `.planning/milestones/{version}-REQUIREMENTS.md` (copy)
- `.planning/milestones/{version}-phases/` (full copy of all phase directories)
- `.planning/milestones/MILESTONES.md` (log entry)
- Git tag: `milestone/{version}` (automatic, best-effort -- already implemented)

**Why copy not move:** The current `archiveMilestone()` already uses copy (not move). This is correct: phase directories may contain valuable SUMMARY.md and VERIFICATION.md files that other processes reference. Copying preserves the originals for the new milestone's gap-closure context.

**State reset after archive:**
- `STATE.md`: Reset to Phase 1 of new milestone, plan 0 of 0, status "Milestone archived, ready for planning"
- `ROADMAP.md`: Keep as-is initially. The user builds a new roadmap during `/mz:plan` for the next version.
  - Alternative: Clear phases list and mark all as archived. But this loses context. Better to archive the ROADMAP.md to milestones/ and start fresh.
  - **Recommended:** Archive ROADMAP.md, then create a new minimal ROADMAP.md with just a skeleton (version, overview) that `/mz:plan` will populate.
- `megazord.config.json`: Inherited as-is per user decision. No changes.
- `MILESTONE.md`: Update status to "archived" and create a new one for the next version.

**Git tag:** Automatic, created by `archiveMilestone()` as `milestone/{version}`. Already best-effort (silently ignores errors if tag exists). This is the right behavior.

### Anti-Patterns to Avoid

- **Duplicating CLI logic in the skill:** The skill should call CLI tools, not reimplement milestone operations. All file operations go through `milestone.ts`/`roadmap.ts` via CLI.
- **Blocking on audit:** The `--skip-audit` flag must allow bypassing the audit step entirely. Users may have informal projects where audit ceremony is unnecessary.
- **Auto-archiving without confirmation:** Archive is semi-destructive (creates files, tags git). Always show what will happen and confirm.
- **Losing deferred items:** Deferred items are the seed for the next milestone. They must be explicitly collected and preserved, not silently discarded.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Milestone audit | Custom phase-by-phase checker | `tools milestone audit --phases` | Already validates VERIFICATION.md status for each phase |
| Milestone archive | Manual file copying + git tagging | `tools milestone archive --version` | Already handles ROADMAP.md, REQUIREMENTS.md, phases/ copying, MILESTONES.md log, git tag |
| Milestone creation | Manual MILESTONE.md writing | `tools milestone create --version --name --phases` | Already generates MILESTONE.md with frontmatter and status |
| Phase addition | Manual ROADMAP.md editing | `tools roadmap add-phase --description` | Already handles phase list, detail section, progress table row |
| Deferred items parsing | Complex regex parser | Simple line-by-line extraction from `<deferred>` tags | CONTEXT.md format is consistent: `<deferred>` section with bullet points or "None" |
| Progress calculation | Manual counting | `tools progress` | Already calculates overall progress and phase progress |
| Version gate checking | Manual VERIFICATION.md parsing | `tools roadmap check-gate --phase` | Already returns exists/status/passed/message JSON |

**Key insight:** Phase 11 is an orchestration-only phase. Every primitive operation already has a CLI tool. The skill's job is sequencing, user interaction, and decision flow -- not data operations.

## Common Pitfalls

### Pitfall 1: Forgetting the MILESTONE.md File
**What goes wrong:** The milestone audit in `/mz:verify --milestone` checks for `MILESTONE.md` to determine which phases belong to the milestone. If no MILESTONE.md exists, it falls back to "all completed phases." If the skill creates a milestone but does not update MILESTONE.md status, the next audit might include archived phases.
**Why it happens:** MILESTONE.md is written by `createMilestone()` but its status field is never updated by `archiveMilestone()`.
**How to avoid:** After archiving, update MILESTONE.md status from "active" to "archived". The skill should handle this since `archiveMilestone()` does not do it.
**Warning signs:** Re-running milestone audit after archive still shows old phases.

### Pitfall 2: Archive Creates Duplicates on Re-run
**What goes wrong:** If the user runs archive twice for the same version, `archiveMilestone()` will overwrite the archive copies (which is fine) but attempt to create a duplicate git tag (which fails silently).
**Why it happens:** `archiveMilestone()` does not check if the archive already exists.
**How to avoid:** The skill should check if `milestones/{version}-ROADMAP.md` already exists before archiving. If it does, warn the user: "Milestone {version} appears to already be archived."
**Warning signs:** Duplicate archive directories or overwritten files.

### Pitfall 3: State Reset Loses Performance Metrics
**What goes wrong:** Resetting STATE.md naively wipes the Performance Metrics section, losing velocity data.
**Why it happens:** STATE.md contains both position data (phase/plan) and historical data (metrics, decisions).
**How to avoid:** When resetting state for a new milestone, only reset the "Current Position" and "Session Continuity" sections. Archive the full STATE.md to milestones/ first. For the new milestone, create a fresh STATE.md with clean position and empty metrics.
**Warning signs:** After archiving and starting the next milestone, performance data from v1.0 is gone.

### Pitfall 4: Deferred Items with Phase References Become Stale
**What goes wrong:** Deferred items like "Phase 6 (Agent Teams Integration)" reference phases by number. When the next milestone starts with new phase numbers, these references become confusing.
**Why it happens:** Deferred items are free-text bullet points with embedded phase references.
**How to avoid:** When presenting deferred items, strip the phase reference and present just the action item. The user should see "Git worktree isolation for parallel agents" not "Git worktree isolation for parallel agents -- Phase 6 (Agent Teams Integration)."
**Warning signs:** Deferred items in the next milestone reference non-existent phase numbers.

### Pitfall 5: No REQUIREMENTS.md for the New Milestone
**What goes wrong:** After archive, the old REQUIREMENTS.md is still in place (it is copied, not moved). When the user starts the next milestone, they might accidentally extend the old requirements.
**Why it happens:** `archiveMilestone()` copies but does not replace REQUIREMENTS.md.
**How to avoid:** After archive, clear or recreate REQUIREMENTS.md with a minimal template that references the new milestone version. Carry forward only the deferred items that the user selected.
**Warning signs:** Next milestone's REQUIREMENTS.md still has v1.0 requirement IDs and traceability data.

## Code Examples

### CLI Tool Usage (from existing codebase)

**Milestone audit:**
```bash
node {plugin_path}/bin/megazord.mjs tools milestone audit --phases "1,2,3,4,5,6,7,8,9,10,11"
```
Returns: `{ "all_passed": true|false, "details": [...], "failed_phases": [...], "missing_verification": [...] }`

**Milestone archive:**
```bash
node {plugin_path}/bin/megazord.mjs tools milestone archive --version "v1.0"
```
Returns: `{ "version": "v1.0", "date": "2026-02-19", "archived": ["path1", "path2", ...] }`

**Milestone create:**
```bash
node {plugin_path}/bin/megazord.mjs tools milestone create --version "v2.0" --name "Second Release" --phases "1,2,3"
```
Returns: `{ "version": "v2.0", "name": "Second Release", "phases": [1,2,3], "path": ".planning/MILESTONE.md" }`

**Roadmap list (for phase discovery):**
```bash
node {plugin_path}/bin/megazord.mjs tools roadmap list
```
Returns: `{ "phases": [{ "number": 1, "name": "...", "status": "completed", ... }, ...] }`

### Deferred Items Extraction Pattern

```
Read each .planning/phases/*/NN-CONTEXT.md
Extract content between <deferred> and </deferred>
For each line starting with "- ":
  If line != "None" and line != "None -- discussion stayed within phase scope":
    Add to deferred_items list with source phase
```

### State Reset Pattern

```
1. Archive full STATE.md to milestones/{version}-STATE.md
2. Create new STATE.md with:
   - ## Project Reference (same project, updated focus)
   - ## Current Position (phase 0, plan 0, "Ready for planning")
   - ## Performance Metrics (empty)
   - ## Accumulated Context (empty decisions, empty blockers)
   - ## Session Continuity (today, "Milestone {version} archived")
3. Archive ROADMAP.md already done by archiveMilestone()
4. Create new ROADMAP.md skeleton:
   - # Roadmap: {project_name}
   - ## Overview (placeholder)
   - ## Phases (empty -- /mz:plan will populate)
   - ## Progress (empty table)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLI-only milestone management | Skill orchestration over CLI tools | Phase 11 (this phase) | Users get guided experience without knowing CLI commands |
| Manual gap identification | Automated MILESTONE-AUDIT.md with gap analysis | Phase 8 | Gap-closure phases can be auto-proposed |
| Manual version transition | Guided archive + deferred items + version prep | Phase 11 (this phase) | Complete lifecycle without falling back to CLI |

## Discretion Recommendations

Based on the codebase patterns and user decisions, here are my recommendations for each Claude's Discretion area:

### Skill Architecture: Single Unified Skill
**Recommendation:** One `/mz:lifecycle` skill, not separate `/mz:archive` + `/mz:next-version`.
**Rationale:** The lifecycle is a sequential flow (audit -> archive -> deferred -> next). Splitting it forces users to remember ordering. A single entry point with clear steps is cleaner. This matches the `/mz:init` pattern (one skill, multiple steps).

### Interactivity: Interactive with Confirmations at Decision Points
**Recommendation:** Show results automatically, ask for confirmation before destructive/subjective actions.
**Decision points requiring confirmation:**
1. Before archiving (show what will be archived, confirm)
2. Deferred items selection (present list, user picks)
3. Version number confirmation (suggest, user confirms/modifies)
4. Whether to start planning the new milestone immediately

**Auto-proceed points (no confirmation needed):**
1. Milestone audit (just runs)
2. Gap-closure phase proposal (proposing, not executing)
3. State file reset (part of archive flow)
4. Git tag creation (best-effort, already automatic)

### Archive File Organization
**Recommendation:** Use existing `archiveMilestone()` structure (`.planning/milestones/{version}-*`).
**Additionally:** Archive STATE.md (not done by current `archiveMilestone()`). The skill should add this.
**No changes to existing archive function needed** -- the skill supplements it.

### Git Tag Naming
**Recommendation:** Keep existing `milestone/{version}` convention. Already implemented in `archiveMilestone()`.
**No change needed.**

### State File Reset
**Recommendation:** Full reset of position-related sections, fresh start for metrics.
- Archive STATE.md to milestones/
- Create new STATE.md with empty position and metrics
- ROADMAP.md: archived by `archiveMilestone()`, create fresh skeleton
- REQUIREMENTS.md: archived by `archiveMilestone()`, create fresh template with selected deferred items as initial requirements
- MILESTONE.md: update old to "archived" status, create new with next version

### Post-Archive Flow
**Recommendation:** Guided next steps, not automatic `/mz:plan` invocation.
**Rationale:** After archiving, the user may want to take a break, review deferred items offline, or adjust config. Suggesting `/mz:plan` as the next step is better than automatically starting it. This matches the `/mz:verify` pattern (suggests `/mz:plan` but does not auto-invoke).

**Display after archive:**
```
> Next Up
**Milestone {version} archived.** Ready for {next_version}.
`/mz:plan` to create the v{next} roadmap.
```

## Open Questions

1. **STATE.md archiving**
   - What we know: `archiveMilestone()` archives ROADMAP.md and REQUIREMENTS.md but not STATE.md
   - What's unclear: Should the skill extend `archiveMilestone()` or handle STATE.md archiving separately?
   - Recommendation: Handle it in the skill (read STATE.md, write to milestones/{version}-STATE.md). No library changes needed. This avoids modifying a working function.

2. **ROADMAP.md after archive**
   - What we know: `archiveMilestone()` copies ROADMAP.md to milestones/ but does not modify the original
   - What's unclear: Should the original be replaced with a fresh skeleton or left as-is?
   - Recommendation: Replace with a fresh skeleton. Leaving the old ROADMAP.md causes confusion (phases show as complete but belong to the previous milestone). A fresh start with just the new version header is cleaner. `/mz:plan` knows how to create a roadmap from scratch.

3. **Existing v1.0-MILESTONE-AUDIT.md**
   - What we know: There is already a `.planning/v1.0-MILESTONE-AUDIT.md` in the project root
   - What's unclear: Should the skill look for this file or always re-run the audit?
   - Recommendation: Check for existing `MILESTONE-AUDIT.md` and offer to reuse it if recent (< 24 hours). Otherwise, re-run. This avoids redundant work when the user just ran `/mz:verify --milestone`.

## Sources

### Primary (HIGH confidence)
- `src/lib/milestone.ts` -- Complete milestone lifecycle library (createMilestone, archiveMilestone, checkMilestoneAudit)
- `src/cli/commands/milestone-tools.ts` -- CLI tool registration (create, archive, audit subcommands)
- `src/lib/roadmap.ts` -- Phase management (parseRoadmapPhases, addPhase, insertPhase, checkVerificationGate)
- `src/lib/state.ts` -- State management (readPosition, updatePosition, updateSessionContinuity)
- `skills/verify/SKILL.md` -- Existing milestone audit mode (Step 3b)
- `skills/plan/SKILL.md` -- Phase management subcommands, roadmap creation pattern
- `.planning/v1.0-MILESTONE-AUDIT.md` -- Real milestone audit output with gap analysis
- All 11 `*-CONTEXT.md` files -- Deferred items extraction source

### Secondary (MEDIUM confidence)
- `skills/go/SKILL.md` -- CLI tool orchestration pattern (state updates, wave execution, error handling)
- `skills/init/design-system.md` -- Visual output formatting conventions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All primitives exist and are verified in the codebase; no new libraries needed
- Architecture: HIGH -- Follows established skill patterns (verify, plan, go); no novel patterns required
- Pitfalls: HIGH -- Identified from reading actual implementation code; each pitfall traces to specific code behavior

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable -- internal codebase, no external dependencies)
