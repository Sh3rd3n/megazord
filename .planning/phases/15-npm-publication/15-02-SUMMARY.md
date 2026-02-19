---
phase: 15-npm-publication
plan: 02
subsystem: infra
tags: [cli, install, update, uninstall, npm, update-check, slash-command]

# Dependency graph
requires:
  - phase: 15-npm-publication
    plan: 01
    provides: "megazordDir, megazordVersionPath, megazordUpdateCheckPath path constants"
provides:
  - "Silent atomic install to ~/.claude/megazord/ with rollback"
  - "Silent update overwriting ~/.claude/megazord/"
  - "Silent uninstall removing ~/.claude/megazord/ and deregistering"
  - "npm registry update check with 24h cache"
  - "/mz:update command skill for in-session updates"
affects: [15-03, session-start-hook, release-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Atomic install with temp dir + rename", "Fire-and-forget update check seeding", "Dual update channels (CLI + slash command)"]

key-files:
  created: [src/cli/utils/update-check.ts, commands/update.md]
  modified: [src/cli/commands/install.ts, src/cli/commands/update.ts, src/cli/commands/uninstall.ts, src/cli/utils/detect-plugins.ts]

key-decisions:
  - "Created update-check.ts stub in Task 1 to unblock typecheck (Task 3 fills full implementation)"
  - "copyDirSync kept as local function in both install.ts and update.ts rather than extracting to shared utility — simple enough to not warrant over-engineering"
  - "detect-plugins.ts uses megazordDir existence as primary check with installed_plugins.json as secondary fallback for older installations"

patterns-established:
  - "Silent CLI commands: single result line, no banners, no spinners, no prompts"
  - "Atomic file operations: temp dir + rename pattern with rollback on failure"
  - "Fire-and-forget background work: import().then().catch(() => {}) pattern"

requirements-completed: [NPM-02]

# Metrics
duration: 3min 15s
completed: 2026-02-19
---

# Phase 15 Plan 02: Install/Update/Uninstall Refactor Summary

**Silent atomic install/update/uninstall to ~/.claude/megazord/ with npm update check and /mz:update skill**

## Performance

- **Duration:** 3min 15s
- **Started:** 2026-02-19T22:44:18Z
- **Completed:** 2026-02-19T22:47:33Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- install.ts copies 6 directories (.claude-plugin, hooks, skills, commands, agents, scripts) to ~/.claude/megazord/ atomically with temp dir rollback
- update.ts overwrites ~/.claude/megazord/ silently, uninstall.ts removes it and deregisters from Claude Code
- update-check.ts queries npm registry with 24h caching and 3-second timeout, writes .update-check JSON
- /mz:update slash command created, delegating to `bunx megazord-cli@latest update`
- All three CLI commands now produce single-line output with zero interactive prompts

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor install.ts for silent install to ~/.claude/megazord/** - `a982680` (feat)
2. **Task 2: Refactor update.ts and uninstall.ts for new file placement** - `f50c33a` (feat)
3. **Task 3: Implement update check utility and /mz:update command skill** - `d2385c8` (feat)

## Files Created/Modified
- `src/cli/commands/install.ts` - Silent atomic install with rollback, 6-dir copy, marketplace registration
- `src/cli/commands/update.ts` - Silent overwrite of ~/.claude/megazord/ with version update
- `src/cli/commands/uninstall.ts` - Remove megazordDir, deregister CLI + JSON cleanup
- `src/cli/utils/detect-plugins.ts` - Primary check on megazordDir existence, fallback to installed_plugins.json
- `src/cli/utils/update-check.ts` - npm registry check with 24h cache, getUpdateNotification() for hooks
- `commands/update.md` - /mz:update slash command delegating to bunx megazord-cli@latest update

## Decisions Made
- Created update-check.ts stub in Task 1 to unblock typecheck since install.ts has a dynamic import to it (filled in Task 3)
- Kept copyDirSync as local function in both install.ts and update.ts rather than extracting to shared utility (simple enough, avoids over-engineering)
- detect-plugins.ts uses megazordDir existence as primary check with installed_plugins.json as secondary fallback for older installations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created update-check.ts stub to unblock typecheck**
- **Found during:** Task 1 (install.ts refactor)
- **Issue:** install.ts has a dynamic import to `../utils/update-check.js` which doesn't exist yet (created in Task 3). TypeScript compilation fails.
- **Fix:** Created a stub update-check.ts with exported function signatures. Full implementation completed in Task 3.
- **Files modified:** src/cli/utils/update-check.ts
- **Verification:** `bun run typecheck` passes
- **Committed in:** a982680 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock typecheck. The stub was fully replaced in Task 3. No scope creep.

## Issues Encountered

- `bun run build` postbuild script fails because megazord is not installed locally (pre-existing issue from 15-01, unrelated to changes). Core build (tsdown) succeeds. Out of scope per deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All CLI commands (install, update, uninstall) ready for npm publication
- Update check utility ready to be wired into session-start hook
- /mz:update slash command available for in-session updates
- Plan 15-03 can proceed with release workflow and final publication steps

## Self-Check: PASSED

- All files exist: install.ts, update.ts, uninstall.ts, detect-plugins.ts, update-check.ts, update.md, SUMMARY.md
- All commits verified: a982680, f50c33a, d2385c8

---
*Phase: 15-npm-publication*
*Completed: 2026-02-19*
