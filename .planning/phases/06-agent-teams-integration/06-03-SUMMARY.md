---
phase: 06-agent-teams-integration
plan: 03
subsystem: skills
tags: [agent-teams, hybrid-execution, worktree, file-ownership, delegate-mode, sendmessage, hooks]

# Dependency graph
requires:
  - phase: 06-agent-teams-integration
    provides: "Worktree lifecycle management, ownership validation, config schema (plan 01); Executor and reviewer dual-mode agent definitions (plan 02)"
  - phase: 04-subagent-execution-and-atomic-commits
    provides: "Existing subagent execution path in /mz:go skill"
  - phase: 05-code-review-and-verification
    provides: "Review integration in executor, reviewer agent definition"
provides:
  - "Hybrid /mz:go skill with dual execution paths (subagents and Agent Teams)"
  - "Agent Teams execution reference (teams.md) with full lifecycle protocol"
  - "Dual-mode spawning documentation in executor.md"
  - "PreToolUse file ownership enforcement hook"
  - "Updated help with Agent Teams flags"
affects: [07-quality-skills, 08-polish-and-refinement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hybrid execution detection: flag > config > auto-detect per wave"
    - "Per-wave team lifecycle: worktree > manifest > context > create > spawn > coordinate > merge > shutdown > cleanup"
    - "Delegate mode via skill instructions (not API-level permissionMode) to avoid known bug"
    - "Agent context via .mz-agent-context.json file (not env vars) for hook consumption"
    - "PreToolUse hook with advisory (default) and strict enforcement modes"

key-files:
  created:
    - skills/go/teams.md
    - scripts/enforce-ownership.sh
  modified:
    - skills/go/SKILL.md
    - skills/go/executor.md
    - hooks/hooks.json
    - skills/help/SKILL.md

key-decisions:
  - "Hybrid detection order: --teams/--no-teams flags > config.agent_teams.enabled > per-wave auto-detect"
  - "Auto-detect triggers Agent Teams when review enabled AND 2+ plans in wave, or inter-plan dependencies"
  - "Silent fallback to subagents on any Agent Teams failure (steps 1-6), logged but no user prompt"
  - "Delegate mode enforced at skill instruction level, NOT API-level permissionMode (avoids teammate tool loss bug)"
  - "File ownership context via .mz-agent-context.json in worktree directory (environment variables cannot be set for teammates)"
  - "Advisory ownership enforcement by default; strict mode opt-in via config.agent_teams.strict_ownership"

patterns-established:
  - "Dual execution path pattern: mode detection > Path A (subagent) or Path B (Agent Teams) > same state updates"
  - "Agent Teams lifecycle: one team per wave, sequential merge in plan order, immediate worktree cleanup on success"
  - "PreToolUse hook pattern: read agent context file, normalize file paths, prefix-match against owned_files"

requirements-completed: [AGNT-01, AGNT-03, AGNT-04, AGNT-05, AGNT-06, AGNT-07, AGNT-08]

# Metrics
duration: 5min
completed: 2026-02-18
---

# Phase 6 Plan 03: Core Integration Summary

**Hybrid /mz:go skill with dual execution paths (subagent and Agent Teams), per-wave team lifecycle with worktree isolation, delegate-mode coordination, SendMessage communication, PreToolUse ownership enforcement hook, and silent fallback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T13:44:25Z
- **Completed:** 2026-02-18T13:50:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- /mz:go skill rewritten with hybrid execution detection (auto-detect, --teams, --no-teams flags, config-driven) and two complete execution paths
- Agent Teams execution reference (teams.md, 312 lines) documenting full per-wave lifecycle: worktree setup, ownership manifest, team creation, task population, teammate spawning, delegate coordination, SendMessage communication, sequential merge, graceful shutdown, and cleanup
- Executor reference (executor.md) updated with dual-mode spawning protocol covering both subagent and teammate prompt structures with responsibility table
- PreToolUse file ownership enforcement hook (enforce-ownership.sh) supporting advisory and strict modes, reading agent context from .mz-agent-context.json
- Help skill updated with Agent Teams flags and Phase 6 description

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite /mz:go skill with hybrid detection and Agent Teams execution path** - `b242a60` (feat)
2. **Task 2: Create file ownership enforcement hook and update help** - `13b3576` (feat)

## Files Created/Modified

- `skills/go/SKILL.md` - Rewritten with hybrid detection (Step 5), dual execution paths (Path A: subagents, Path B: Agent Teams), extended error handling, and usage examples
- `skills/go/teams.md` - New Agent Teams execution reference: team naming, worktree setup, ownership manifest, agent context files, team creation, task population, teammate spawning, delegate mode, communication protocol, merge protocol, shutdown flow, cleanup, silent fallback, state update protocol
- `skills/go/executor.md` - Updated with Agent Teams spawning protocol section, teammate prompt structure, dual-mode responsibility table, and teammate-specific progress tracking and failure handling
- `hooks/hooks.json` - Added PreToolUse hook for Edit|Write operations pointing to enforce-ownership.sh
- `scripts/enforce-ownership.sh` - New executable hook script for file ownership enforcement with advisory/strict modes
- `skills/help/SKILL.md` - Updated /mz:go description, added --teams/--no-teams usage examples, updated Phase to 6 of 8

## Decisions Made

- **Hybrid detection priority:** CLI flags take precedence over config, config over auto-detect. Auto-detect is per-wave, not per-plan.
- **Auto-detect criteria:** Agent Teams triggered when (review enabled AND 2+ plans in wave) OR (inter-plan dependencies in wave). Otherwise subagents.
- **Silent fallback scope:** Covers TeamCreate failure, worktree creation failure, and any setup error in steps 1-6. Mid-execution failures handled within the team.
- **Delegate mode approach:** Skill-level instruction enforcement instead of API-level permissionMode to avoid known teammate tool loss bug (GitHub #23447).
- **Context file approach:** .mz-agent-context.json written to each worktree directory since env vars cannot be passed to teammates via Task tool.
- **Advisory enforcement default:** Hook warns but allows out-of-scope modifications by default; strict mode is opt-in via config.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Agent Teams requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable but this is documented in the skill and handled via silent fallback.

## Next Phase Readiness

- /mz:go skill fully supports both execution paths, ready for end-to-end testing
- Agent Teams integration is complete across all three plans: infrastructure (01), agent definitions (02), and skill integration (03)
- Phase 6 requirements (AGNT-01 through AGNT-08) all addressed
- Phase 7 (Quality Skills) can leverage Agent Teams for coordinated quality checks, with subagent fallback if experimental flag is not set

## Self-Check: PASSED
