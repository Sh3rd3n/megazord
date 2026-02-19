---
phase: 07-quality-and-debugging-skills
plan: 02
subsystem: quality
tags: [socratic-brainstorming, debugging, four-phase-debug, discuss, skill-activation]

# Dependency graph
requires:
  - phase: 03-core-skills-and-state-management
    provides: Stub skills for /mz:debug and /mz:discuss with disable-model-invocation: true
  - phase: 05-code-review-and-verification
    provides: Skill pattern reference (/mz:review, /mz:verify) for full skill implementation
provides:
  - Full /mz:discuss Socratic brainstorming skill (5+ approaches, CONTEXT.md output)
  - Full /mz:debug four-phase debugging skill (REPRODUCE, ISOLATE, ROOT CAUSE, FIX)
  - Updated /mz:help with 13 Available skills
affects: [08-brownfield-and-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Socratic brainstorming with minimum 5 alternatives before convergence"
    - "Four-phase debugging with observable state transitions via phase banners"
    - "Issue type detection adapting techniques per phase"

key-files:
  created: []
  modified:
    - skills/discuss/SKILL.md
    - skills/debug/SKILL.md
    - skills/help/SKILL.md

key-decisions:
  - "/mz:discuss outputs to CONTEXT.md for phase context, .planning/brainstorms/ for standalone use"
  - "/mz:debug adapts techniques within each phase based on issue type (runtime, build, test, perf, logic)"
  - "Help skill now shows 13 Available, 1 Coming soon (/mz:map only)"

patterns-established:
  - "Standalone skills with phase-aware output: detect context from STATE.md, fall back to standalone path"
  - "Phase banner pattern for multi-phase workflows: distinct banners per phase for observable state transitions"

requirements-completed: [QUAL-03, QUAL-04]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 7 Plan 02: Discuss and Debug Skills Summary

**Full /mz:discuss Socratic brainstorming (5+ approaches, CONTEXT.md output) and /mz:debug four-phase debugging (REPRODUCE/ISOLATE/ROOT CAUSE/FIX with phase banners)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T16:44:39Z
- **Completed:** 2026-02-18T16:47:46Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Replaced /mz:discuss stub with full 7-step Socratic brainstorming skill: banner, context detection, seed question, iterative dialogue (5+ approaches), convergence with trade-off table, CONTEXT.md-compatible output
- Replaced /mz:debug stub with full 7-step four-phase debugging skill: banner, issue context gathering with type detection, REPRODUCE, ISOLATE, ROOT CAUSE, FIX phases with distinct banners, TDD integration, debug summary
- Updated /mz:help to 13 Available skills with usage examples for debug and discuss; only /mz:map remains Coming soon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create full /mz:discuss Socratic brainstorming skill** - `ce21124` (feat)
2. **Task 2: Create full /mz:debug systematic debugging skill** - `fe68e8a` (feat)
3. **Task 3: Update help skill to list debug and discuss as Available** - `94f7394` (feat)

## Files Created/Modified

- `skills/discuss/SKILL.md` - Full Socratic brainstorming skill (188 lines): 7 steps from banner to next-up, minimum 5 approaches, phase-aware output (CONTEXT.md or brainstorms/)
- `skills/debug/SKILL.md` - Full systematic debugging skill (227 lines): 7 steps with four debug phases (REPRODUCE, ISOLATE, ROOT CAUSE, FIX), issue type detection, TDD integration
- `skills/help/SKILL.md` - Updated skill listing: /mz:debug and /mz:discuss changed to Available, usage examples added, phase updated to 7 of 8

## Decisions Made

- /mz:discuss standalone output path: `.planning/brainstorms/{YYYY-MM-DD}-{slug}.md` matching research recommendation
- /mz:debug shortcut rules: skip reproduce ceremony for inherently reproducible issues (build errors); skip binary search when stack trace points directly to location
- /mz:debug integrates with TDD: checks `quality.tdd` config to determine whether regression test should be written before fix

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both standalone thinking tools (/mz:discuss, /mz:debug) are fully functional
- Combined with Plan 07-01 (executor-embedded TDD, CORTEX, anti-sycophancy), Phase 7's quality toolset is complete
- /mz:help accurately reflects the current state of all 14 skills (13 Available, 1 Coming soon)
- Ready for Phase 7 verification, then Phase 8 (brownfield and migration)

---
*Phase: 07-quality-and-debugging-skills*
*Completed: 2026-02-18*
