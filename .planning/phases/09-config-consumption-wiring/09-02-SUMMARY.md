---
phase: 09-config-consumption-wiring
plan: 02
subsystem: config
tags: [model-selection, toggle-gating, agent-spawning, plan-check, brainstorming]

# Dependency graph
requires:
  - phase: 09-config-consumption-wiring
    provides: "resolveAgentModel(), modelOverridesSchema, agent YAML frontmatter with model field"
provides:
  - "Model-aware researcher/planner spawning in /mz:plan"
  - "Model-aware mapper spawning in /mz:map"
  - "plan_check toggle gating in /mz:plan (Step 6b)"
  - "Brainstorming suggestion when quality.brainstorming is true and no CONTEXT.md exists"
affects: [09-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Agent frontmatter rewriting before spawn", "Named subagent_type with general-purpose fallback", "Config toggle gating for optional workflow steps"]

key-files:
  created: []
  modified:
    - skills/plan/SKILL.md
    - skills/plan/agents.md
    - skills/map/SKILL.md
    - skills/map/mapper.md

key-decisions:
  - "Spawning pattern updated from general-purpose to named subagent types (mz-researcher, mz-planner, mz-mapper) with fallback to general-purpose + inline embedding"
  - "Task prompts carry only per-invocation context when using registered subagent names (agent definition loaded from file)"

patterns-established:
  - "Model-aware spawning: resolve model from config, rewrite agent frontmatter, spawn with registered name, fallback to general-purpose"
  - "Toggle gating: read config toggle, display skip message if disabled, run step if enabled"

requirements-completed: [CONF-03, CONF-02]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 9 Plan 02: Wire Model Selection and Toggle Gating into /mz:plan and /mz:map Summary

**Model-aware agent spawning with frontmatter rewriting for plan/map skills, plan_check toggle gating, and brainstorming config suggestion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T09:06:53Z
- **Completed:** 2026-02-19T09:10:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- /mz:plan resolves and applies models for researcher and planner agents before spawning, with differentiated balanced profile (planner gets opus)
- /mz:map resolves and applies models for mapper agents before spawning (all focus areas + synthesis)
- plan_check toggle gates plan validation in /mz:plan via new Step 6b (conditional on workflow.plan_check)
- Brainstorming suggestion shown when quality.brainstorming is true and no CONTEXT.md exists in Step 4
- All spawning patterns updated from general-purpose to named subagent types with documented fallback
- Model Selection documentation added to both agents.md and mapper.md with profile tables and override precedence

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire model selection and toggle gating into /mz:plan** - `e319191` (feat)
2. **Task 2: Wire model selection into /mz:map** - `d22d690` (feat)

## Files Created/Modified

- `skills/plan/SKILL.md` - Model resolution for researcher (Step 5) and planner (Step 6), plan_check toggle (Step 6b), brainstorming suggestion (Step 4), updated subagent_type to mz-researcher/mz-planner
- `skills/plan/agents.md` - Model Selection section with profile mapping table, override precedence, frontmatter rewriting docs, updated spawning examples with model-aware pattern
- `skills/map/SKILL.md` - Model resolution for mapper agents (Step 5), updated all spawns to mz-mapper, synthesis spawn updated
- `skills/map/mapper.md` - Model Selection section, updated Parallel Spawning Pattern and Synthesis Agent examples with model-aware pattern

## Decisions Made

- **Named subagent types with fallback:** Updated spawning from `subagent_type="general-purpose"` to registered names (`"mz-researcher"`, `"mz-planner"`, `"mz-mapper"`) which lets Claude Code load agent definitions from files. Fallback to general-purpose + inline embedding documented for robustness.
- **Prompt carries only per-invocation context:** When using registered subagent names, the Task prompt no longer includes the full agent definition -- only context specific to the invocation (state, roadmap section, output path). The agent definition is loaded from the registered file.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /mz:plan and /mz:map now consume model_profile, model_overrides, workflow.plan_check, and quality.brainstorming from config
- Plan 09-03 will wire the same patterns into /mz:go, /mz:status, /mz:debug, and /mz:verify
- All agent files already have YAML frontmatter with model: inherit as the dynamic injection target (from 09-01)

## Self-Check: PASSED

- skills/plan/SKILL.md exists and contains model resolution, mz-researcher, mz-planner, Step 6b, brainstorming
- skills/plan/agents.md exists and contains Model Selection section with updated examples
- skills/map/SKILL.md exists and contains model resolution, mz-mapper spawns
- skills/map/mapper.md exists and contains resolveAgentModel, Model Selection section
- Commits e319191 and d22d690 verified in git log

---
*Phase: 09-config-consumption-wiring*
*Completed: 2026-02-19*
