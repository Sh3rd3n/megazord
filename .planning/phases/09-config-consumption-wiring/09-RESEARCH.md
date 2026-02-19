# Phase 9: Config Consumption Wiring - Research

**Researched:** 2026-02-19
**Domain:** Configuration wiring, dead code cleanup, model selection for Claude Code subagents
**Confidence:** MEDIUM (HIGH for toggle wiring and dead code, MEDIUM for model selection due to upstream bug)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Standard model mapping: quality -> opus, balanced -> sonnet, budget -> haiku
- Two modes available: **uniform** (all agents same model) and **differentiated** (per-agent overrides)
- Config supports smart predefined profiles as defaults + per-agent override section for customization
- Override precedence logic: Claude's discretion (likely override wins for simplicity)
- Skills affected: `/mz:plan`, `/mz:go`, `/mz:map` -- all Task tool spawns pass the model parameter
- When plan_check, verifier, or other toggles are disabled: Claude's discretion on whether to show skip messages
- Manual skills always available regardless of config -- `/mz:review` works even when review is off in pipeline
- `/mz:status` includes a config section showing active/inactive toggles at a glance
- Toggles to wire: plan_check, verifier, review, tdd, brainstorming, cortex, debug_mode (7 total)
- Full cleanup: remove dead exports, orphan imports, related tests, all references
- If ownership.ts is entirely dead: delete the file completely (no stubs or placeholders)
- Broad scan: check entire codebase for dead code, not just ownership.ts
- Any dead code found gets removed immediately in this phase
- Safety verification: Claude's discretion on approach (grep + build likely)
- Documentation: commit messages only, no separate cleanup log file
- Opportunistic fix: if touching files and spotting obvious violations, fix them

### Claude's Discretion
- Skip message format and when to show (verbose vs silent)
- Override precedence logic (override wins vs profile-as-floor)
- Dead code verification approach (grep, build, or combination)
- Whether to show skip notifications in output

### Deferred Ideas (OUT OF SCOPE)
- Full clean code audit of entire codebase -- user wants this as a dedicated future phase (post-Phase 11, or as new insertion)
- Not in scope for Phase 9: only opportunistic fixes on files already being touched
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONF-03 | AI model selection for planning agents: quality (Opus), balanced (Sonnet), budget (Haiku) | Model profile mapping research (Section: Model Selection), Task tool model parameter investigation, custom agent frontmatter workaround |
| CONF-02 | Workflow agents configurable: research before planning, plan verification, post-phase verification | Toggle wiring audit (Section: Toggle Wiring Status), skill modification patterns for each toggle |
</phase_requirements>

## Summary

Phase 9 wires configuration settings that are already stored in `megazord.config.json` to actual behavior in the framework's skills. The v1.0 milestone audit identified four orphaned exports: `model_profile`, `workflow.plan_check`, `workflow.verifier`, and the entire `ownership.ts` module. This research analyzes each integration point, identifies the exact files that need modification, and documents a critical upstream constraint with the Claude Code Task tool's model parameter.

The core challenge is **model selection**. The user decided on standard mapping (quality->opus, balanced->sonnet, budget->haiku) with per-agent overrides. However, the Claude Code Task tool's `model` parameter is currently broken (GitHub issue #18873, open since October 2025). The workaround is to use **custom subagent definitions with YAML frontmatter** that include the `model` field, which works correctly. This means Megazord agents must transition from being inline-embedded text in Task prompts to being registered as custom subagents with frontmatter-defined model selection. This is the most architecturally significant change in this phase.

For toggle wiring, the work is simpler: 3 of 7 toggles are already fully wired (`workflow.research`, `quality.tdd`, `quality.cortex`), 1 is partially wired (`quality.review` in `/mz:go` only), and 3 are completely unwired (`workflow.plan_check`, `workflow.verifier`, `quality.brainstorming`). The `quality.debug` toggle is consumed by `/mz:debug` already. Dead code cleanup is straightforward: `ownership.ts` is entirely dead (zero imports from any other file).

**Primary recommendation:** Use custom subagent frontmatter `model` field for model selection (proven to work), since the Task tool `model` parameter is broken. Wire all 7 toggles in their respective skill files. Delete `ownership.ts` entirely.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code subagents | Built-in | Agent spawning with model selection | Only working path for per-agent model control |
| Zod (zod) | ^4.3.0 | Config schema validation | Already in use for configSchema |
| fs-extra | ^11.0.0 | File I/O operations | Already in use across the project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Already in use for PLAN.md parsing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom subagent frontmatter `model` field | Task tool `model` parameter | Task tool model param is broken (GitHub #18873); frontmatter works |
| Inline agent embedding in Task prompts | Custom subagent files in agents/ directory | Frontmatter model field requires file-based agents; inline embedding cannot set model |

**Installation:** No new dependencies needed. All required libraries already exist in the project.

## Architecture Patterns

### Current Agent Spawning Architecture (BEFORE Phase 9)

All Megazord agents are currently spawned the same way:

1. Skill reads agent `.md` file content into memory
2. Skill embeds content inline in a Task tool prompt string
3. Task tool spawns with `subagent_type="general-purpose"`
4. Subagent inherits the parent session's model (always whatever the user is running)

```
Skill (e.g., /mz:plan)
  -> Read agents/mz-researcher.md content
  -> Task(subagent_type="general-purpose", prompt="<agent_role>{content}</agent_role>...")
  -> Subagent inherits parent model
```

**Problem:** There is no mechanism to select which model the subagent uses. All agents run on whatever model the user's main session uses (typically Opus).

### Pattern 1: Custom Subagent with Frontmatter Model (RECOMMENDED)

**What:** Define Megazord agents as proper custom subagent files with YAML frontmatter including the `model` field. The model field is dynamically set based on config.

**When to use:** For all agent spawns where model selection matters (`/mz:plan`, `/mz:go`, `/mz:map`).

**How it works in Claude Code:**

Custom subagent definitions stored in a plugin's `agents/` directory are loaded by Claude Code at session start. Each agent's YAML frontmatter can include a `model` field with values `opus`, `sonnet`, `haiku`, or `inherit`.

From the official documentation (https://code.claude.com/docs/en/sub-agents):

```yaml
---
name: mz-researcher
description: Research the technical landscape for a phase before planning
model: sonnet
tools: Read, Grep, Glob, Bash, Write, Edit
---

{agent system prompt content}
```

The `model` field in frontmatter supports: `sonnet`, `opus`, `haiku`, or `inherit` (default).

**Critical constraint:** Custom subagent files are loaded at session start. The `model` field in frontmatter is static -- it cannot be changed dynamically per-invocation without modifying the file on disk.

### Pattern 2: Dynamic Model Selection via File Rewriting (RECOMMENDED APPROACH)

**What:** At the start of each skill invocation that spawns agents, read the config's `model_profile` and `model_overrides`, then rewrite the agent frontmatter's `model` field to match. The agent files live in the plugin directory and can be modified.

**When to use:** When the user changes `model_profile` in config (via `/mz:init` or `/mz:settings`).

**Implementation approach:**

```
1. Skill reads megazord.config.json
2. Skill resolves model for each agent role:
   - Check model_overrides[agent_role] first
   - Fall back to model_profile mapping
3. Skill rewrites agent .md frontmatter model field
4. Skill spawns Task(subagent_type="mz-researcher") -- uses the registered agent
5. Claude Code reads the agent's frontmatter model field and uses that model
```

**Alternative approach (simpler, recommended):**

Since the skills currently embed agent content inline in Task prompts, and the Task tool `model` parameter is broken, the simplest working approach is:

1. Skills read config and resolve model for each agent
2. Skills use `Task(subagent_type="{agent-name}", model="{resolved-model}")` -- BUT this is broken
3. **Therefore:** Skills must reference agents by name: `Task(subagent_type="mz-researcher")` -- Claude Code then uses the frontmatter model from the agent file

**The gap:** If model selection must be dynamic (change per-invocation based on config), and frontmatter is static (loaded at session start), the only working approach is to **rewrite the frontmatter before spawning**. This is safe because the agent files are in the Megazord plugin directory and are not user-edited.

**Simplest viable approach:** Have each orchestrator skill (plan, go, map) call a helper function that:
1. Reads the current `model_profile` and any `model_overrides` from config
2. Resolves the model for each agent role
3. Updates the agent `.md` files' frontmatter `model` field
4. Then proceeds with spawning using `subagent_type="{agent-name}"`

This means spawning changes from:
```
Task(subagent_type="general-purpose", prompt="<agent_role>{inline content}</agent_role>...")
```
To:
```
# Before spawning: update frontmatter
Task(subagent_type="mz-researcher", prompt="<context>...</context>")
```

The agent's system prompt comes from its `.md` file body (loaded by Claude Code), while the per-invocation context (state, roadmap, phase data) is passed via the Task prompt.

### Pattern 3: Hybrid Inline + Model (FALLBACK)

**What:** Keep the current inline embedding approach but add the `model` parameter to the Task call as a forward-looking investment. When the Task tool bug is fixed, model selection will start working automatically.

**When to use:** If the frontmatter approach proves too complex or breaks the inline embedding pattern.

**Implementation:**

```
Task(
  subagent_type="general-purpose",
  model="haiku",  // Currently broken (404), but future-proofed
  prompt="<agent_role>{inline content}</agent_role>..."
)
```

**Tradeoff:** Model selection will NOT work until Claude Code fixes issue #18873. The parameter will be silently ignored or cause errors.

### Anti-Patterns to Avoid

- **Modifying agent files at build time only:** The user may change `model_profile` via `/mz:settings` mid-session. If agent files are only updated during build, changes won't take effect until the next `bun run build`.
- **Storing model in execution_rules text:** Passing `model: haiku` as text in `<execution_rules>` has zero effect -- the Task tool's model is determined by subagent_type resolution, not prompt text.
- **Removing inline content embedding entirely:** Agent prompts need per-invocation context (state, roadmap, plan content). Even with registered subagents, the Task prompt must carry this context.

### Recommended Project Structure Changes

```
agents/
  mz-executor.md       # ADD: model frontmatter field
  mz-mapper.md         # ADD: model frontmatter field
  mz-planner.md        # ADD: model frontmatter field
  mz-researcher.md     # ADD: model frontmatter field
  mz-reviewer.md       # ADD: model frontmatter field
  mz-verifier.md       # ADD: model frontmatter field

src/lib/
  config.ts            # MODIFY: add model_overrides schema
  ownership.ts         # DELETE: entirely dead code

skills/plan/
  SKILL.md             # MODIFY: wire plan_check toggle, model selection
  agents.md            # MODIFY: update spawning pattern docs

skills/go/
  SKILL.md             # MODIFY: wire verifier toggle, model selection

skills/map/
  SKILL.md             # MODIFY: wire model selection
  mapper.md            # MODIFY: update spawning pattern docs

skills/status/
  SKILL.md             # MODIFY: add config section to output

skills/verify/
  SKILL.md             # MODIFY: check workflow.verifier toggle

skills/discuss/
  SKILL.md             # MODIFY: check quality.brainstorming toggle
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Model name resolution | Custom mapping logic scattered across skills | Single helper function or lookup table in config.ts | DRY principle; mapping quality->opus should be defined once |
| Agent frontmatter manipulation | Manual string parsing/replacement of YAML | gray-matter library (already a dependency) | gray-matter handles YAML frontmatter parsing/serialization correctly |
| Config loading in skills | Direct file reads with manual JSON parsing | Existing `loadConfig()` from src/lib/config.ts | Already validated with Zod schema, handles errors |

**Key insight:** The model resolution logic (profile -> model name, with override precedence) should be a single exported function in `config.ts`, not duplicated across every skill that spawns agents.

## Common Pitfalls

### Pitfall 1: Task Tool Model Parameter Bug
**What goes wrong:** Using `Task(model="haiku")` returns a 404 API error. Using full model IDs fails CLI validation.
**Why it happens:** The Task tool's model parameter passes raw short names to the API without resolving them to full model IDs (GitHub issue #18873, open since October 2025).
**How to avoid:** Use custom subagent frontmatter `model` field instead of Task tool `model` parameter. Agent files in `agents/` directory with YAML frontmatter including `model: haiku|sonnet|opus` work correctly.
**Warning signs:** 404 errors when spawning agents, "model: haiku" in error messages.

### Pitfall 2: Subagent Files Loaded at Session Start
**What goes wrong:** User changes `model_profile` via `/mz:settings`, but agent files still have old model in frontmatter. New spawns use the old model.
**Why it happens:** Claude Code loads subagent definitions once at session start from frontmatter.
**How to avoid:** Two options: (1) Rewrite agent frontmatter before each spawn (safe since plugin owns these files), or (2) Accept that model changes require a session restart and document this in `/mz:settings`. Option 1 is more robust. Note: Even if frontmatter is rewritten mid-session, Claude Code may cache the original. This needs validation during implementation.
**Warning signs:** Model selection appears to have no effect after config change.

### Pitfall 3: Breaking Inline Embedding When Adding Frontmatter
**What goes wrong:** Adding YAML frontmatter to agent `.md` files that were previously plain markdown breaks the inline embedding pattern used by skills.
**Why it happens:** Skills currently read the full file content and embed it in `<agent_role>` tags. If frontmatter is added, the embedded content includes `---\nmodel: opus\n---\n` which is harmless but wastes tokens.
**How to avoid:** If switching to registered subagent spawning (`subagent_type="mz-researcher"` instead of `"general-purpose"`), the body content is loaded by Claude Code from the file, not from the Task prompt. The Task prompt then only carries per-invocation context (state, plan, roadmap), not the agent definition. This is actually cleaner and saves context tokens.
**Warning signs:** Duplicated agent instructions (once from file, once from inline embedding).

### Pitfall 4: Manual Skills Gated by Config Toggles
**What goes wrong:** `/mz:review` stops working when `quality.review` is set to "off".
**Why it happens:** Developer checks `quality.review` and gates the entire skill.
**How to avoid:** The user explicitly decided: "Manual skills always available regardless of config." Only gate _automated pipeline_ behavior (e.g., review within `/mz:go`), never the standalone skill invocation. `/mz:review`, `/mz:verify`, `/mz:discuss`, `/mz:debug` must ALWAYS work when manually invoked.
**Warning signs:** Skills refusing to run when their config toggle is off.

### Pitfall 5: Incomplete Dead Code Removal
**What goes wrong:** ownership.ts is deleted but references remain in test files, documentation, or import maps.
**Why it happens:** Only the source file is removed without scanning for all references.
**How to avoid:** Scan with grep for ALL references before and after deletion: file names, imports, type references, documentation mentions. Verify build succeeds after removal.
**Warning signs:** Build errors, TypeScript errors about missing modules after deletion.

### Pitfall 6: Toggle Wiring Without Config Section in /mz:status
**What goes wrong:** User disables a toggle but has no way to confirm what's active without reading raw JSON.
**Why it happens:** Toggles are wired to behavior but `/mz:status` doesn't reflect config state.
**How to avoid:** Add a config summary section to `/mz:status` showing active/inactive toggles at a glance (user specifically requested this).
**Warning signs:** User confusion about which toggles are active.

## Code Examples

### Model Resolution Function

```typescript
// Source: Designed for src/lib/config.ts
// Maps model_profile to Claude Code model aliases

const MODEL_MAP: Record<string, string> = {
  quality: "opus",
  balanced: "sonnet",
  budget: "haiku",
};

/** Agent roles that support model overrides */
type AgentRole = "researcher" | "planner" | "executor" | "reviewer" | "verifier" | "mapper";

/** Per-agent model override config */
const modelOverridesSchema = z.record(
  z.enum(["researcher", "planner", "executor", "reviewer", "verifier", "mapper"]),
  z.enum(["opus", "sonnet", "haiku", "inherit"]),
).optional();

/** Resolve the model for a specific agent role */
export function resolveAgentModel(
  config: MegazordConfig,
  agentRole: AgentRole,
): string {
  // Check per-agent override first
  const override = config.model_overrides?.[agentRole];
  if (override && override !== "inherit") {
    return override;
  }
  // Fall back to profile mapping
  return MODEL_MAP[config.model_profile] ?? "opus";
}
```

### Agent Frontmatter with Model Field

```yaml
# Source: Pattern from Claude Code docs (https://code.claude.com/docs/en/sub-agents)
---
name: mz-researcher
description: Research the technical landscape for a phase before planning
model: sonnet
---

# Megazord Phase Researcher

You are a phase researcher for Megazord...
```

### Toggle Gating Pattern (for plan_check)

```markdown
# Source: Pattern derived from existing workflow.research wiring in skills/plan/SKILL.md

## Step 6b: Plan Verification (conditional)

Determine whether to run plan verification:

1. **Check config:** Read `workflow.plan_check` from megazord.config.json. If false, skip.
2. **Check existing:** If already verified, skip.

**If plan_check should run:**
Display:
  > Plan Check
    * Verifying plans...

Spawn the plan checker agent...

**If plan_check was skipped (config):**
  > Plan Check
    ~ Skipped (disabled in config)
```

### Toggle Gating Pattern (for verifier in /mz:go)

The verifier is post-phase, not per-plan. The skip point is in the Next Up suggestion:

```markdown
# When all plans complete in /mz:go Step 9:

# Check config for verifier toggle
If config.workflow.verifier is true:
  > Next Up
  **Verify Phase {N}** -- validate deliverables
  `/mz:verify`

If config.workflow.verifier is false:
  > Next Up
  **Phase {N} execution complete.** Verifier is disabled.
  `/mz:plan` to advance to next phase, or `/mz:verify` to verify manually.
```

### /mz:status Config Section

```markdown
# Source: Pattern for adding config section to status output

## Step 5 addition: Config Section (after Recent Phases, before Next Up)

Display the active configuration toggles:

  > Config
    Model:       quality (opus)
    TDD:         on
    Review:      auto
    Brainstorm:  on
    CORTEX:      on
    Debug:       systematic
    Research:    on
    Plan check:  on
    Verifier:    on
```

## Toggle Wiring Status (Current State Audit)

Comprehensive audit of all 7 toggles and their current wiring:

### Already Wired (3 toggles -- no work needed)

| Toggle | Where Wired | How |
|--------|------------|-----|
| `workflow.research` | `/mz:plan` Step 5 | If false, skips researcher agent spawn |
| `quality.tdd` | `/mz:go` Step 2 -> executor `<execution_rules>` | Forwarded as `tdd_enabled` flag; also consumed by `/mz:debug` Step 6 and `/mz:quick` Step 6 |
| `quality.cortex` | `/mz:go` Step 2 -> executor `<execution_rules>` | Forwarded as `cortex_enabled` flag |

### Partially Wired (2 toggles -- need additional wiring)

| Toggle | What's Wired | What's Missing |
|--------|-------------|----------------|
| `quality.review` | `/mz:go` reads it and forwards as `review_enabled` + `review_mode` | `/mz:review` already explicitly ignores this toggle (by design). No additional wiring needed -- this is fully wired for the pipeline. |
| `quality.debug` | `/mz:debug` Step 6 reads `quality.tdd` for TDD integration. Debug mode (`systematic` vs `quick`) is described in the skill. | The skill DOES read quality settings but the `debug` enum (`systematic` vs `quick`) does not appear to gate any behavior difference in the current SKILL.md. The skill describes both approaches but always follows the 4-phase systematic approach. May need wiring if `quick` should skip phases. |

### Not Wired (3 toggles -- work needed)

| Toggle | Where to Wire | What to Do |
|--------|--------------|------------|
| `workflow.plan_check` | `/mz:plan` after Step 6 | Add conditional step: if plan_check is true, spawn a plan-checker agent to validate the created plans. If false, skip. Currently no plan-checker agent exists -- this agent needs to be created or the toggle needs to gate existing validation. |
| `workflow.verifier` | `/mz:go` Step 9 (post-execution suggestion), `/mz:verify` awareness | When disabled, /mz:go should still suggest verify but note it's disabled. /mz:plan verification gate (Step 3) should be aware. |
| `quality.brainstorming` | `/mz:plan` before research, or `/mz:discuss` awareness | When enabled, /mz:plan could suggest running /mz:discuss first. When disabled, skip the suggestion. The /mz:discuss skill itself must always work (manual invocation). |

### Additional Investigation: plan_check

The `workflow.plan_check` toggle is intended to gate a "plan verification agent" that would validate created plans before execution. However:

1. **No plan-checker agent exists** in the `agents/` directory
2. No skill currently implements plan verification
3. The toggle was defined in Phase 2's config schema but never consumed

**Options for wiring plan_check:**
- (A) Create a lightweight plan-checker agent (e.g., `mz-plan-checker.md`) that validates plan structure, completeness, and dependency coherence after `/mz:plan` creates plans
- (B) Add inline validation logic to `/mz:plan` that checks plan quality without a separate agent
- (C) Wire it as a simple "review plans with user" step

**Recommendation:** Option A is most consistent with the framework's agent-based architecture. The plan-checker would be a lightweight validation agent spawned after the planner, checking for common issues: missing files_modified, circular dependencies, tasks without verify steps, missing must_haves frontmatter. This is a new agent creation, which is small but notable work.

### Additional Investigation: brainstorming

The `quality.brainstorming` toggle controls whether Socratic brainstorming is encouraged before implementation. Currently:

1. `/mz:discuss` always works regardless of this toggle (manual invocation, per user decision)
2. No skill currently checks this toggle to suggest brainstorming

**Wiring approach:** When `quality.brainstorming` is true and a user starts `/mz:plan` or `/mz:go`, display a soft suggestion to run `/mz:discuss` first if no CONTEXT.md exists. This is advisory only. When false, skip the suggestion silently.

### Additional Investigation: debug mode

The `quality.debug` enum (`systematic` vs `quick`) controls the debugging approach:

1. `/mz:debug` currently always follows the 4-phase approach (REPRODUCE -> ISOLATE -> ROOT CAUSE -> FIX)
2. The "quick" mode should allow shortcuts: skip REPRODUCE if obvious, skip ISOLATE if stack trace points directly to the issue

**Wiring approach:** In `/mz:debug` Step 2, read the config debug mode. If "quick", allow more aggressive shortcuts and fewer ceremony banners. If "systematic", maintain the full 4-phase approach as currently documented.

## Dead Code Analysis

### Confirmed Dead: ownership.ts

**File:** `src/lib/ownership.ts`
**Evidence:** Zero imports from any other file in the project. The ownership enforcement functionality is entirely handled by `scripts/enforce-ownership.sh` which reads `.mz-agent-context.json` directly.

**Exports (all dead):**
- `OwnershipManifest` type
- `generateOwnershipManifest()` function
- `writeOwnershipManifest()` function
- `validateFileAccess()` function

**Import from ownership.ts:** `import type { PlanFile } from "./plan.js"` -- this import is within ownership.ts itself and will be removed when the file is deleted.

**Safe to delete:** YES. No tests reference it, no CLI commands import it, no skill reads it.

### Confirmed Dead: config settings (NOT the fields themselves)

These config fields are stored but not consumed. They are NOT dead code in config.ts itself (they are valid schema fields) -- what's dead is the *consumption* pathway. Phase 9 wires these, making them alive:

- `model_profile` -- stored, never read by any spawning skill
- `workflow.plan_check` -- stored, never read by any skill
- `workflow.verifier` -- stored, never read by any skill

### Broad Dead Code Scan

Additional items found during codebase investigation:

1. **No test files exist** -- `vitest` is configured but no test files (`*.test.ts`, `*.spec.ts`) were found in the project. This is not "dead code" per se but is worth noting.
2. **`.megazord-marketplace/` directory** -- Contains a copy of skills. This appears to be a distribution staging area. Not dead code but may need syncing after Phase 9 changes.
3. **`superpowers-vs-gsd-analysis.md`** -- Appears to be an analysis document at the root. Not code, not dead, but possibly should be in `.planning/`.

## Model Selection Deep Dive

### The Task Tool Bug (CRITICAL)

**Status:** OPEN, unfixed as of February 2026
**GitHub Issue:** [#18873](https://github.com/anthropics/claude-code/issues/18873)
**Original Report:** [#9243](https://github.com/anthropics/claude-code/issues/9243) (October 2025)

**The problem:**
- `Task(model="haiku")` -- CLI accepts it, API returns 404
- `Task(model="claude-haiku-4-5-20251001")` -- CLI rejects it as invalid
- `Task()` with no model -- works, inherits parent model

**What DOES work:**
- Custom subagent files with `model: haiku` in YAML frontmatter
- The `/model` command to switch the main session's model
- Agent definitions registered via `--agents` CLI flag with `model` field

### Recommended Model Selection Architecture

Given the Task tool bug, the recommended approach for Megazord:

1. **Add `model` field to agent frontmatter** -- Each agent `.md` file in `agents/` gets a YAML frontmatter block with `model: inherit` as default.

2. **Add model resolution to orchestrator skills** -- Before spawning, each skill:
   - Reads `model_profile` and `model_overrides` from config
   - Resolves the target model for each agent role
   - Updates the agent file's frontmatter `model` field via gray-matter

3. **Change spawn pattern** -- Skills switch from:
   ```
   Task(subagent_type="general-purpose", prompt="<agent_role>{full content}</agent_role>...")
   ```
   To:
   ```
   Task(subagent_type="mz-researcher", prompt="<context>{per-invocation data}</context>")
   ```

4. **Config schema extension** -- Add `model_overrides` to configSchema:
   ```json
   {
     "model_profile": "quality",
     "model_overrides": {
       "researcher": "haiku",
       "executor": "sonnet"
     }
   }
   ```

### Model Mapping Table

| Profile | Researcher | Planner | Executor | Reviewer | Verifier | Mapper |
|---------|-----------|---------|----------|----------|----------|--------|
| quality | opus | opus | opus | opus | opus | opus |
| balanced | sonnet | opus | sonnet | sonnet | sonnet | sonnet |
| budget | haiku | sonnet | haiku | haiku | haiku | haiku |

**Differentiated "balanced" profile rationale:** The planner benefits most from high-quality reasoning (opus) since plan quality determines execution quality. Researchers, executors, and others can use sonnet for good-enough performance at lower cost.

**Override example:** User sets `model_overrides.executor = "opus"` to use opus for execution while keeping other agents on balanced. Override wins over profile.

### Important Caveat: Session Restart May Be Required

Claude Code loads subagent definitions at session start. If a user changes `model_profile` via `/mz:settings`, the agent files' frontmatter can be rewritten immediately, but Claude Code may cache the original definitions for the current session. This means model selection changes may only take effect after restarting the Claude Code session.

**Mitigation:** Document this clearly in `/mz:settings` output: "Model profile changes take effect on the next Claude Code session."

**Alternative mitigation:** Since skills can rewrite frontmatter before spawning AND the Task tool reads agent files each time (this needs validation), it's possible that mid-session changes DO take effect. This should be tested during implementation.

## Discretion Recommendations

### Skip Message Format
**Recommendation: Minimal skip notices.** When a toggle is disabled, show a single-line notice the FIRST time it's encountered in a session, then silent thereafter. Format:

```
  ~ {Feature} skipped (disabled in config)
```

Use the `~` symbol (tilde) to indicate a skipped/inactive step, consistent with the design system's `*` (active), `>` (completed), and `?` (pending) symbols.

**Rationale:** Verbose skip messages on every invocation create noise. Users who disable features know they disabled them. A single notice per session is sufficient.

### Override Precedence Logic
**Recommendation: Override wins, period.** If `model_overrides.executor = "opus"` and `model_profile = "budget"`, the executor gets opus. No "floor" logic (where profile sets a minimum). Simple mental model: profile sets defaults, overrides replace them.

**Rationale:** Simple precedence is easier to reason about. "Floor" logic creates confusion: "I set budget but my executor still uses sonnet because balanced is the floor?" Keep it simple.

### Dead Code Verification Approach
**Recommendation: grep + typecheck + build.** Three-step verification:
1. `grep -rn "ownership" --include="*.ts"` to confirm zero imports
2. `bun run typecheck` after deletion to confirm no type errors
3. `bun run build` after deletion to confirm no build errors

**Rationale:** grep catches textual references, typecheck catches type-level references, build catches runtime import resolution failures. All three are fast and complementary.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Task tool `model` parameter | Custom subagent frontmatter `model` field | Bug since Oct 2025, workaround documented Feb 2026 | Must use frontmatter, not Task parameter |
| Inline agent embedding in Task prompts | Registered subagents via `subagent_type` | Subagent system matured through 2025 | Cleaner architecture, enables model selection |
| All agents on parent model | Per-agent model selection via frontmatter | Feb 2026 (this phase) | Cost optimization, quality/speed tradeoffs |

**Deprecated/outdated:**
- Task tool `model` parameter: Broken since Oct 2025, no fix timeline. Do not rely on it.

## Open Questions

1. **Does Claude Code re-read agent frontmatter on each Task spawn, or cache at session start?**
   - What we know: Official docs say "Subagents are loaded at session start." The `/agents` command can "load immediately" after creation.
   - What's unclear: Whether modifying an existing agent file's frontmatter mid-session causes Claude Code to pick up the change on the next spawn.
   - Recommendation: Test during implementation. If cached, document that model changes require session restart. If re-read, dynamic rewriting works perfectly.

2. **Can `subagent_type` reference plugin agents by name?**
   - What we know: Built-in types are "general-purpose", "Explore", "Plan". Custom agents defined in `.claude/agents/` or plugin `agents/` directory are available by their `name` frontmatter field.
   - What's unclear: Whether `Task(subagent_type="mz-researcher")` works when `mz-researcher` is defined in a plugin's `agents/` directory.
   - Recommendation: Test during implementation. If it does not work, the inline embedding approach must be kept, and model selection deferred to when the Task tool bug is fixed.

3. **Does the `model` frontmatter field work for plugin-distributed agents?**
   - What we know: Works for user-level agents (`~/.claude/agents/`) and project-level agents (`.claude/agents/`). Plugin agents are loaded from plugin's `agents/` directory.
   - What's unclear: Whether the `model` field in plugin agent frontmatter is respected.
   - Recommendation: Test during implementation. If not, the agents may need to be installed to `~/.claude/agents/` instead.

4. **What happens when Task tool bug #18873 is fixed?**
   - Impact: The frontmatter approach would still work but become unnecessary for model selection. The Task `model` parameter would be the simpler approach.
   - Recommendation: Design the model resolution function to be reusable. When the bug is fixed, switching from frontmatter rewriting to Task parameter passing should be a one-line change per skill.

## Sources

### Primary (HIGH confidence)
- Claude Code official docs: https://code.claude.com/docs/en/sub-agents -- subagent configuration, model field, frontmatter schema
- Codebase audit of all skills, agents, and config files -- toggle wiring status, dead code analysis

### Secondary (MEDIUM confidence)
- GitHub Issue #18873: https://github.com/anthropics/claude-code/issues/18873 -- Task tool model parameter bug, confirmed open
- GitHub Issue #9243: https://github.com/anthropics/claude-code/issues/9243 -- original report, 4+ months old

### Tertiary (LOW confidence)
- Dynamic frontmatter rewriting approach -- untested assumption that Claude Code re-reads agent files on each spawn. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Toggle wiring: HIGH -- direct codebase audit confirms exactly which toggles are wired and which are not
- Dead code: HIGH -- grep confirms zero imports of ownership.ts; milestone audit corroborates
- Model selection mechanism: MEDIUM -- official docs confirm frontmatter `model` field works; Task tool bug confirmed; dynamic rewriting approach is untested
- Agent spawning pattern change: MEDIUM -- registered subagent spawning via name is documented but not tested in plugin context

**Research date:** 2026-02-19
**Valid until:** 2026-03-05 (30 days for stable parts; 7 days for model selection due to possible bug fix)
