---
phase: 08-brownfield-support-and-project-lifecycle
plan: 03
subsystem: skills
tags: [brownfield, lifecycle, phase-management, milestone-audit, verification-gate, codebase-map]

# Dependency graph
requires:
  - phase: 08-brownfield-support-and-project-lifecycle
    provides: "Codebase mapping skill (/mz:map), lifecycle CLI tools (roadmap, milestone)"
  - phase: 03-core-skills-and-state-management
    provides: "Skill system, agent spawning patterns, state management CLI"
provides:
  - "Extended /mz:plan with brownfield integration, phase management subcommands, verification gate"
  - "Extended /mz:verify with --milestone audit mode producing MILESTONE-AUDIT.md"
  - "Updated /mz:help with all 14 skills Available, lifecycle command examples"
affects: [plan-skill, verify-skill, help-skill, user-facing-lifecycle]

# Tech tracking
tech-stack:
  added: []
  patterns: [brownfield-detection-soft-warning, phase-management-subcommands, verification-gate-advisory, milestone-audit-flow]

key-files:
  created: []
  modified:
    - skills/plan/SKILL.md
    - skills/verify/SKILL.md
    - skills/help/SKILL.md

key-decisions:
  - "Brownfield detection is a soft warning with user choice (continue or run /mz:map first)"
  - "Phase management subcommands exit immediately after execution (no regular planning flow)"
  - "Verification gate is advisory only -- user always has final authority to proceed"
  - "Milestone audit uses CLI tool for phase verification aggregation and writes MILESTONE-AUDIT.md"

patterns-established:
  - "Brownfield detection pattern: check for codebase map, detect existing code markers, soft-warn with AskUserQuestion"
  - "Subcommand routing: parse user message for subcommands before main flow, handle inline and exit"
  - "Advisory gate pattern: check prerequisite, warn strongly, but let user decide"

requirements-completed: [PROJ-09, PROJ-10]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 8 Plan 03: Skill Integration Summary

**Lifecycle management wired into user-facing skills: /mz:plan with brownfield detection, phase management, and verification gate; /mz:verify with milestone audit; /mz:help showing all 14 skills Available**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T17:43:07Z
- **Completed:** 2026-02-18T17:46:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended /mz:plan with brownfield codebase map integration (detects existing code, suggests /mz:map, embeds codebase context in planner prompt)
- Extended /mz:plan with phase management subcommands (add-phase, remove-phase, insert-phase) routing directly to CLI tools
- Extended /mz:plan with verification gate enforcement (advisory warning before planning next phase, checking previous phase verification status)
- Extended /mz:verify with --milestone audit mode that aggregates verification across all milestone phases and produces MILESTONE-AUDIT.md
- Updated /mz:help to show all 14 skills as Available, with usage examples for /mz:map, phase management, and milestone audit

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend /mz:plan with brownfield integration, phase management, and verification gate** - `7b4fc32` (feat)
2. **Task 2: Extend /mz:verify with milestone audit and update help** - `172ccb1` (feat)

## Files Created/Modified
- `skills/plan/SKILL.md` - Extended with brownfield detection, phase management subcommands (add/remove/insert), and verification gate enforcement (408 lines)
- `skills/verify/SKILL.md` - Extended with --milestone audit mode as alternative path after Step 3 (339 lines)
- `skills/help/SKILL.md` - All 14 skills Available, new lifecycle command examples, Phase 8 of 8 (85 lines)

## Decisions Made
- Brownfield detection uses a soft warning pattern with AskUserQuestion, matching the existing CONTEXT.md soft check pattern from Step 4
- Phase management subcommands are handled in a dedicated Step 2b, exiting immediately after CLI tool execution without entering the regular planning flow
- Verification gate treats both "passed" and "human_needed" as passing, matching the established Phase 5 verification pattern from Plan 08-02
- Milestone audit writes MILESTONE-AUDIT.md to .planning/ root (not a phase directory) since it spans all phases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 14 Megazord skills are now fully defined and Available
- Full project lifecycle is wired: /mz:map -> /mz:plan (brownfield-aware) -> /mz:go -> /mz:verify (phase + milestone) -> phase management
- Phase 8 is the final phase -- no next phase to prepare for
- Ready for /mz:verify 8 to verify the complete phase

## Self-Check: PASSED

All artifacts verified:
- FOUND: skills/plan/SKILL.md (408 lines)
- FOUND: skills/verify/SKILL.md (339 lines)
- FOUND: skills/help/SKILL.md (85 lines)
- FOUND: commit 7b4fc32 (Task 1)
- FOUND: commit 172ccb1 (Task 2)

---
*Phase: 08-brownfield-support-and-project-lifecycle*
*Completed: 2026-02-18*
