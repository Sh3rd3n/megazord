# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** One framework that handles the entire development lifecycle with agents that actually communicate and coordinate
**Current focus:** Phase 14.1 — CORTEX Thinking Frameworks

## Current Position

Phase: 14.1 of 16 (CORTEX Thinking Frameworks)
Plan: 2 of 2 (complete)
Status: Phase 14.1 complete
Last activity: 2026-02-20 — Phase 14.1 plan 01 executed

Progress: [####################################.] 97% (26/26 v1.0 plans complete, 10/10 v1.1 plans)

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 26
- Total execution time: ~3 days (2026-02-17 to 2026-02-19)

**v1.1:**
- Plans completed: 10
- 12-01: 1min 29s (2 tasks, 5 files)
- 12-02: 1min 57s (2 tasks, 4 files)
- 13-01: 3min 11s (2 tasks, 2 files)
- 14-01: 1min 41s (1 task, 2 files)
- 14-02: 1min 33s (2 tasks, 1 file)
- 14.1-01: 2min 39s (2 tasks, 2 files)
- 14.1-02: 2min 17s (2 tasks, 3 files)
- 15-01: 1min 5s (2 tasks, 3 files)
- 15-02: 3min 15s (3 tasks, 6 files)

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log with outcomes.

Recent decisions affecting current work:
- Kept original megazord bin entry alongside megazord-cli for global install users
- Placed megazord path constants after claudeDir and before pluginsDir in paths.ts
- Silent CLI install/update/uninstall: single result line, no prompts, no banners
- Atomic install with temp dir + rename pattern for rollback safety
- detect-plugins.ts uses megazordDir existence as primary check (installed_plugins.json as fallback)
- Package name: `megazord-cli` (unscoped, `megazord` is taken on npm by a squatter)
- npm publish must use `npm publish` (not bun) for OIDC/provenance support — CI-only exception
- Marketplace requires separate repo `sh3rd3n/megazord-marketplace` (plugin root constraint)
- `scripts/` missing from `files` array is a showstopper — FIXED in 12-01
- npm package name is `megazord-cli` (unscoped), bin command stays `megazord`
- files array includes scripts/ and CHANGELOG.md, excludes dist/
- CHANGELOG.md uses Keep a Changelog 1.1.0 format with comparison links
- VERSION extracted to shared utility reading package.json at runtime via directory walking
- GitHub repo created as sh3rd3n/megazord (private) with topics for discoverability
- README hero SVG with dark #18181B background, gradient accent matching badge colorA
- CI badge uses ci.yml placeholder URL — activates after Phase 14
- Demo GIF deferred to manual recording — placeholder with quickstart callout
- CI triggers on both push and PR to master for badge activation and quality gating
- Lint uses bunx biome ci --error-on-warnings (CI mode with zero-tolerance)
- Test uses bun run test (vitest via package.json) not bun test (Bun built-in runner)
- OIDC Trusted Publishing chosen (zero static secrets, auto-rotating credentials)
- Node.js 24 for publish step (bundles npm 11 natively, no upgrade needed)
- Repository made public (required for npm provenance attestation)
- Branch protection via rulesets API (modern, API-first approach)
- workflow_dispatch included on release workflow for manual re-trigger capability
- Issue Tree + Ishikawa activation is conditional: full decomposition for non-trivial bugs, skip for obvious fixes
- CORTEX boundary: manual /mz:debug = debug skill owns, execution context = executor CORTEX owns
- Go orchestrator reads skills/cortex/SKILL.md and embeds as <cortex_protocol> block when cortex_enabled is true
- CORTEX protocol duplicated inline in executor (not @-referenced) due to Task boundary limitation -- sync comment added
- 8-signal classification matrix replaces 4-row domain table for reproducible classification
- Chaotic domain only from crisis signals, never from quantitative thresholds alone

### Roadmap Evolution

- Phase 14.1 inserted after Phase 14: CORTEX Thinking Frameworks (URGENT) — enhance CORTEX with structured thinking protocols before npm publication

### Pending Todos

None.

### Blockers/Concerns

- First npm publish of a new package requires manual `npm publish --access public` due to 2FA + Trusted Publishing chicken-and-egg
- Pre-existing lint errors (41 errors, 8 warnings) will block CI -- must be fixed before first PR
- Trusted Publishing on npmjs.com must be configured after first manual publish (see 14-02-SUMMARY.md)

### Future Ideas (post v1.1)

- TUI interface with tabs for agent teams
- Beads pattern (steveyegge/beads) for CORTEX enhancement
- Explore overstory and mulch for inspiration

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 14.1-01-PLAN.md
Resume file: .planning/phases/14.1-cortex-thinking-frameworks/14.1-01-SUMMARY.md
Stash ref: None
Last error: None
