# Phase 10: Distribution and Autocomplete Fixes - Research

**Researched:** 2026-02-19
**Domain:** npm packaging, Claude Code plugin autocomplete, requirements traceability
**Confidence:** HIGH

## Summary

Phase 10 addresses three concrete gaps identified in the v1.0 milestone audit: (1) the `commands/` directory is missing from `package.json` `files` array, preventing npm-installed users from getting autocomplete proxies; (2) two skills (`debug` and `discuss`) lack autocomplete proxy files in `commands/`; and (3) the REQUIREMENTS.md traceability table has 20 stale `Pending` markers that should reflect actual implementation status.

The work is entirely mechanical — no new capabilities, no architectural decisions. The proxy file pattern is well-established (12 existing examples), the `package.json` fix is a single line, and the requirements audit is a verification pass against already-completed phase artifacts. The distribution verification requires a real E2E test via local tarball install.

**Primary recommendation:** Fix `package.json` `files` array, create 2 missing proxy files following the exact existing pattern, individually verify each of the 20 stale requirements against codebase evidence, and validate via `bun pack --dry-run` + local tarball E2E install.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Requirements audit approach
- Individual verification: each of the 20 stale Pending markers must be checked against the codebase individually
- If a requirement is partially implemented, mark as "Partial" with a note describing what's missing
- Evidence column must include specific file paths or function references (not just phase names) — verifiable by anyone reading the table
- Status values: Claude's discretion on the set (at minimum Complete, Partial, Pending)

#### Distribution verification
- Run `bun pack --dry-run` (or equivalent) to inspect tarball contents before any publish
- Full audit of what's included vs what should be — not just `commands/`, check all runtime-critical directories (.claude-plugin/, skills/, commands/, hooks/, scripts/, bin/, agents/)
- If additional missing files are found beyond `commands/`, report them as findings only — do NOT fix in this phase (scope stays fixed)
- End-to-end test: install from local tarball into a test project (cortex-test) and verify autocomplete works

#### Autocomplete proxy content
- Follow the exact pattern of existing proxy files in `commands/` — format, metadata, routing, naming convention
- Claude's discretion on whether to audit all skills for missing proxies (not just debug and discuss) and add any others found missing
- Proxy naming and namespace follows whatever convention existing proxies use

### Claude's Discretion
- Status value set for REQUIREMENTS.md (at minimum: Complete, Partial, Pending — may add N/A if appropriate)
- Whether additional skills beyond debug/discuss are missing autocomplete proxies (audit and fix if found)
- Level of detail in evidence references (file:line vs file:function vs file path)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-03 | npm fallback installation via `bunx megazord` for environments without plugin marketplace | Distribution fix (adding `commands/` to `package.json` `files`) ensures autocomplete proxies are included in tarball. E2E test validates the full install flow. |
</phase_requirements>

## Standard Stack

This phase requires no new libraries or dependencies. All work uses existing project tooling.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| bun | 1.3.4+ | Package manager, `bun pack` for tarball inspection | Project standard per CLAUDE.md |
| package.json `files` | npm spec | Controls what files are included in published tarball | Standard npm packaging mechanism |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `bun pack --dry-run` | Inspect tarball contents without creating file | Pre-fix audit and post-fix verification |
| Local tarball install | E2E validation | `bun pack` then install from `.tgz` in test project |

### Alternatives Considered
None — this phase uses only existing project tools.

## Architecture Patterns

### Pattern 1: Autocomplete Proxy File

**What:** Each skill in `skills/{name}/SKILL.md` has a corresponding proxy file in `commands/{name}.md` that enables Claude Code's slash command autocomplete.

**When to use:** Every skill that should be discoverable via `/mz:` autocomplete in Claude Code.

**Exact pattern (from 12 existing proxies):**
```markdown
---
description: {concise description of what the skill does}
---

Invoke the mz:{skill-name} skill and follow it exactly as presented to you
```

**Key observations from existing proxies:**
- YAML frontmatter has exactly one field: `description`
- Body is always exactly: `Invoke the mz:{skill-name} skill and follow it exactly as presented to you`
- Filename matches skill directory name: `commands/go.md` maps to `skills/go/SKILL.md`
- Description is a brief phrase (5-15 words), not a full sentence

**Existing proxy descriptions (for pattern reference):**

| Proxy | Description |
|-------|-------------|
| `go.md` | Execute the current phase plan with subagent delegation |
| `help.md` | Show all available Megazord skills with descriptions and usage examples |
| `init.md` | Initialize a Megazord project with configuration and planning structure |
| `map.md` | Analyze existing codebase for brownfield project support |
| `pause.md` | Save session context for handoff to a future session |
| `plan.md` | Plan a phase into executable tasks with dependencies and waves |
| `quick.md` | Run a quick task without project ceremony |
| `resume.md` | Restore context from a previous session and continue work |
| `review.md` | Two-stage code review (spec compliance + code quality) |
| `settings.md` | View and modify Megazord project configuration |
| `status.md` | Show project progress, current phase, and next actions |
| `verify.md` | Verify phase deliverables match acceptance criteria |

**Missing proxies to create:**

| Proxy | Description (from SKILL.md frontmatter) |
|-------|------------------------------------------|
| `debug.md` | Systematic four-phase debugging (reproduce, isolate, root-cause, fix) |
| `discuss.md` | Socratic brainstorming to explore approaches before implementation |

### Pattern 2: package.json `files` Array

**What:** The `files` array in `package.json` controls which files/directories are included in the npm tarball when publishing or packing.

**Current state:**
```json
"files": [
  "bin",
  "dist",
  "skills",
  "agents",
  "hooks",
  ".claude-plugin"
]
```

**Missing entry:** `"commands"` — must be added to include autocomplete proxy files in distribution.

**Note:** `"dist"` is listed but the directory does not exist (build outputs to `bin/`). This is harmless — `bun pack` silently ignores missing entries.

### Pattern 3: REQUIREMENTS.md Traceability Table

**Current format (3 columns):**
```
| Requirement | Phase | Status |
```

**Required format (4 columns, per user decision on evidence):**
```
| Requirement | Phase | Status | Evidence |
```

**Status values (recommendation):** Use 4 values:
- **Complete** — fully implemented and verified
- **Partial** — partially implemented, note describes what's missing
- **Pending** — not yet implemented
- **N/A** — not applicable (unlikely but available if needed)

### Anti-Patterns to Avoid
- **Bulk status update without verification:** Do NOT assume all 20 stale Pending markers should be `Complete`. Each must be individually verified against the codebase. The audit report found DIST-03 and PROJ-09 are `Partial`, not `Complete`.
- **Phase-name-only evidence:** Evidence must reference specific files, functions, or code patterns — not just "Phase 3 completed."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tarball content inspection | Custom file listing script | `bun pack --dry-run` | Built-in, authoritative, shows exact bytes |
| E2E install test | Mock or unit test | Actual `bun pack` + install from tarball | Only real installation reveals distribution gaps |

**Key insight:** Distribution bugs are only reliably found by actually distributing. The v1.0 audit's `commands/` gap was invisible during development because the repo root always has `commands/` — only an npm install reveals the absence.

## Common Pitfalls

### Pitfall 1: Forgetting `scripts/` is Also Missing from Distribution
**What goes wrong:** The `scripts/enforce-ownership.sh` file is referenced by `hooks/hooks.json` via `${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh`, but `scripts/` is NOT in `package.json` `files` and NOT in the tarball.
**Why it happens:** `hooks/hooks.json` is in `files` and gets distributed, but the script it references does not.
**How to avoid:** Per CONTEXT.md: report as finding, do NOT fix in this phase (scope stays fixed). But document it prominently for future work.
**Impact:** For npm-installed users, the PreToolUse ownership enforcement hook will fail silently (the script won't exist at the referenced path). This affects Agent Teams file ownership enforcement.

### Pitfall 2: `install.ts` Doesn't Copy `agents/` Directory
**What goes wrong:** The `createLocalMarketplace()` and `installFallback()` functions in `src/cli/commands/install.ts` copy `[".claude-plugin", "hooks", "skills", "commands"]` but not `"agents"`. Agent definition files (`mz-executor.md`, `mz-planner.md`, etc.) are in the tarball but not copied to the plugin directory.
**Why it happens:** Agents may be resolved via a different mechanism (the `subagent_type` parameter in Task tool, referencing the npm package path directly), but this hasn't been verified E2E.
**How to avoid:** Report as finding per CONTEXT.md scope rules. The E2E test may or may not reveal this as a real problem.

### Pitfall 3: Traceability Table Has Two Layers of Staleness
**What goes wrong:** REQUIREMENTS.md has staleness in TWO places: (a) the checkbox list at the top (`- [ ] **DIST-01**`) and (b) the traceability table at the bottom (`| DIST-01 | Phase 1 | Pending |`). Both need updating.
**Why it happens:** The checkbox list was updated for some requirements (12 are `[x]`) but not all. The traceability table was never updated after phase completion.
**How to avoid:** Update BOTH locations consistently. The traceability table is the primary deliverable (user-specified Evidence column), but the checkbox list should also be corrected.

### Pitfall 4: CONF-02 and CONF-03 Status Changed in Phase 9
**What goes wrong:** The v1.0 audit marked CONF-02 as `partial` and CONF-03 as `unsatisfied`. However, Phase 9 (Config Consumption Wiring) specifically addressed these gaps. If the auditor only checks the v1.0 audit report, they'll use stale statuses.
**Why it happens:** The audit was done before Phase 9 executed.
**How to avoid:** Verify CONF-02 and CONF-03 against current codebase (post-Phase 9), not against the pre-Phase-9 audit findings. Phase 9 VERIFICATION.md confirms these are now wired correctly.

### Pitfall 5: PROJ-09 is Partial, Not Complete
**What goes wrong:** PROJ-09 (full project lifecycle) is in the 20 stale Pending markers, but the v1.0 audit found it `Partial` (milestone create/archive not skill-accessible). Phase 11 is supposed to close this gap.
**Why it happens:** PROJ-09 is assigned to Phase 11, which hasn't executed yet.
**How to avoid:** Mark PROJ-09 as `Partial` with evidence noting that roadmap/phase management works but milestone create/archive is CLI-only (Phase 11 pending).

### Pitfall 6: cortex-test Directory Does Not Exist
**What goes wrong:** The CONTEXT.md specifies E2E test in `cortex-test` project, but `~/Programming/cortex-test/` does not currently exist.
**How to avoid:** The plan must include a step to create the test project directory before the E2E install test.

## Code Examples

### Example 1: Creating Missing Proxy Files

**`commands/debug.md`** (to create):
```markdown
---
description: Systematic four-phase debugging (reproduce, isolate, root-cause, fix)
---

Invoke the mz:debug skill and follow it exactly as presented to you
```

**`commands/discuss.md`** (to create):
```markdown
---
description: Socratic brainstorming to explore approaches before implementation
---

Invoke the mz:discuss skill and follow it exactly as presented to you
```

### Example 2: package.json Fix

Current:
```json
"files": [
  "bin",
  "dist",
  "skills",
  "agents",
  "hooks",
  ".claude-plugin"
]
```

Fixed:
```json
"files": [
  "bin",
  "dist",
  "skills",
  "agents",
  "hooks",
  "commands",
  ".claude-plugin"
]
```

### Example 3: Traceability Table Entry Format

```markdown
| Requirement | Phase | Status | Evidence |
|-------------|-------|--------|----------|
| DIST-01 | Phase 1 | Complete | `.claude-plugin/plugin.json` manifest with `mz` namespace; 14 skills in `skills/` |
| DIST-03 | Phase 10 | Complete | `commands/` in `package.json` `files`; `bun pack --dry-run` confirms inclusion |
| PROJ-09 | Phase 11 | Partial | Roadmap/phase management works (`src/lib/roadmap.ts`); milestone create/archive CLI-only — Phase 11 pending |
```

### Example 4: bun pack Verification

```bash
# Pre-fix: verify commands/ is missing
bun pack --dry-run 2>&1 | grep -c "commands/"  # Should be 0

# Post-fix: verify commands/ is included
bun pack --dry-run 2>&1 | grep "commands/"  # Should list all .md files

# E2E test
bun pack  # Creates megazord-0.1.0.tgz
mkdir -p ~/Programming/cortex-test && cd ~/Programming/cortex-test
bun init -y
bun add ../Megazord/megazord-0.1.0.tgz
# Verify commands/ exists in node_modules/megazord/commands/
ls node_modules/megazord/commands/
```

## Findings: Distribution Audit

### Current Tarball Contents (from `bun pack --dry-run`)

| Directory | In `package.json` `files` | In Tarball | In `install.ts` `dirsToCopy` | Status |
|-----------|--------------------------|------------|-------------------------------|--------|
| `.claude-plugin/` | Yes | Yes (1 file) | Yes | OK |
| `skills/` | Yes | Yes (22 files) | Yes | OK |
| `agents/` | Yes | Yes (6 files) | **No** | Finding: not copied during install |
| `hooks/` | Yes | Yes (1 file) | Yes | OK |
| `bin/` | Yes | Yes (14 files) | N/A (CLI bin) | OK |
| `commands/` | **No** | **No** | Yes (code expects it) | **BUG: primary fix for this phase** |
| `scripts/` | **No** | **No** | No | **Finding: enforce-ownership.sh not distributed** |
| `dist/` | Yes | No (dir doesn't exist) | No | Harmless: non-existent dir in files |

### Findings to Report (NOT fix in this phase)

1. **`scripts/` not distributed:** `hooks/hooks.json` references `${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh` but `scripts/` is not in `package.json` `files`. npm-installed users will have a broken PreToolUse hook for file ownership enforcement.

2. **`agents/` not copied by installer:** `install.ts` `dirsToCopy` lists `[".claude-plugin", "hooks", "skills", "commands"]` but NOT `"agents"`. The 6 agent definition files (`mz-executor.md`, etc.) are in the tarball but never copied to the plugin installation directory. Agent resolution may still work via npm package paths (needs E2E verification).

3. **`dist/` listed but non-existent:** `package.json` `files` includes `"dist"` but the build outputs to `"bin"`. This is harmless (bun/npm silently ignore missing `files` entries) but inaccurate.

### Skills vs Proxies Audit (Claude's Discretion)

| Skill | Proxy Exists | Status |
|-------|-------------|--------|
| `debug` | No | **Missing — must create** |
| `discuss` | No | **Missing — must create** |
| `go` | Yes | OK |
| `help` | Yes | OK |
| `init` | Yes | OK |
| `map` | Yes | OK |
| `pause` | Yes | OK |
| `plan` | Yes | OK |
| `quick` | Yes | OK |
| `resume` | Yes | OK |
| `review` | Yes | OK |
| `settings` | Yes | OK |
| `status` | Yes | OK |
| `verify` | Yes | OK |

**Result:** Exactly 2 skills missing proxies (debug, discuss). All other 12 skills have correct proxy files.

## Requirements Verification Pre-Analysis

The 20 stale `Pending` markers in REQUIREMENTS.md, cross-referenced with the v1.0 audit and Phase 9 completion:

| Requirement | Audit Status | Phase 9 Impact | Expected Final Status |
|-------------|-------------|----------------|----------------------|
| DIST-01 | Fully satisfied | None | **Complete** |
| DIST-02 | Fully satisfied | None | **Complete** (after debug/discuss proxies added) |
| DIST-03 | Partial | None | **Complete** (after commands/ added to files) |
| DIST-04 | Fully satisfied | None | **Complete** |
| DIST-05 | Fully satisfied | None | **Complete** |
| PROJ-01 | Fully satisfied | None | **Complete** |
| PROJ-02 | Fully satisfied | None | **Complete** |
| PROJ-03 | Fully satisfied | None | **Complete** |
| PROJ-04 | Fully satisfied | None | **Complete** |
| PROJ-05 | Fully satisfied | None | **Complete** |
| PROJ-06 | Fully satisfied | None | **Complete** |
| PROJ-07 | Fully satisfied | None | **Complete** |
| PROJ-09 | Partial | None | **Partial** (milestone create/archive CLI-only; Phase 11 pending) |
| PROJ-11 | Fully satisfied | None | **Complete** |
| PROJ-12 | Fully satisfied | None | **Complete** |
| QUAL-05 | Fully satisfied | None | **Complete** |
| QUAL-07 | Fully satisfied | None | **Complete** |
| CRTX-06 | Fully satisfied | None | **Complete** |
| CONF-01 | Fully satisfied | None | **Complete** |
| CONF-04 | Fully satisfied | None | **Complete** |

**Note:** CONF-02 and CONF-03 are currently `[x] Complete` in the checkbox list AND `Complete` in the traceability table (already updated during Phase 9 assignment). They are NOT among the 20 stale markers.

**Expected outcome:** 19 markers change to `Complete`, 1 marker (PROJ-09) changes to `Partial`.

**Critical dependency:** DIST-02 and DIST-03 should only be marked `Complete` AFTER the distribution fixes in this phase are applied and verified. The requirements audit task must sequence after the fix tasks.

## Evidence Detail Level (Claude's Discretion Recommendation)

**Recommendation: File path level, with function/section names where helpful.**

Rationale:
- `file:line` is too brittle (line numbers change with any edit)
- `file path only` is too vague for large files
- `file path + function/section name` is specific enough to verify without being fragile

Examples:
- Good: `skills/plan/SKILL.md` Step 5 (researcher spawn)
- Good: `src/lib/config.ts` `configSchema` (quality toggles)
- Good: `.claude-plugin/plugin.json` manifest; 14 skills in `skills/`
- Bad: `skills/plan/SKILL.md:47` (too fragile)
- Bad: `Phase 3 completed` (not verifiable)

## Open Questions

1. **E2E agent resolution after npm install**
   - What we know: `agents/` is in the tarball but NOT copied by `install.ts` `dirsToCopy`. Agent `.md` files define subagent types used by `Task` tool.
   - What's unclear: Does the `subagent_type` parameter in Task tool resolve agents from the npm package path, from the plugin cache, or from `dirsToCopy` destination? The E2E test will answer this.
   - Recommendation: Run the E2E test and observe whether agent-spawning skills work. Report finding regardless.

2. **cortex-test project setup**
   - What we know: `~/Programming/cortex-test/` does not currently exist. CONTEXT.md specifies it for E2E testing.
   - What's unclear: Whether it should persist or be temporary.
   - Recommendation: Create as a minimal test project (`bun init -y`), use for E2E validation, document in plan as a setup step.

## Sources

### Primary (HIGH confidence)
- `/Users/sh3rd3n/Programming/Megazord/package.json` — current `files` array, missing `commands`
- `/Users/sh3rd3n/Programming/Megazord/commands/*.md` — 12 existing proxy files, pattern verified
- `/Users/sh3rd3n/Programming/Megazord/skills/*/SKILL.md` — 14 skills, frontmatter descriptions
- `/Users/sh3rd3n/Programming/Megazord/src/cli/commands/install.ts` — `dirsToCopy` arrays (lines 91, 129)
- `/Users/sh3rd3n/Programming/Megazord/hooks/hooks.json` — references `scripts/enforce-ownership.sh`
- `/Users/sh3rd3n/Programming/Megazord/.planning/REQUIREMENTS.md` — 20 stale Pending markers verified
- `/Users/sh3rd3n/Programming/Megazord/.planning/v1.0-MILESTONE-AUDIT.md` — gap analysis, requirement statuses
- `bun pack --dry-run` output — actual tarball contents (45 files, no commands/ or scripts/)

### Secondary (MEDIUM confidence)
- `/Users/sh3rd3n/Programming/Megazord/.planning/phases/09-config-consumption-wiring/09-VERIFICATION.md` — Phase 9 closure evidence for CONF-02/CONF-03

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new tools, only existing project tooling
- Architecture: HIGH — proxy pattern verified from 12 existing examples, package.json fix is standard npm
- Pitfalls: HIGH — all findings verified directly from codebase inspection and `bun pack` output

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable — no external dependencies that could change)
