# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** One framework that handles the entire development lifecycle with agents that actually communicate and coordinate
**Current focus:** Phase 9 in progress -- Config Consumption Wiring

## Current Position

Phase: 9 of 9 (Config Consumption Wiring)
Plan: 2 of 3 in current phase
Status: In Progress
Last activity: 2026-02-19 -- Plan 09-02 complete (model selection and toggle gating in /mz:plan and /mz:map)

Progress: [█████████████████████░] 96%
## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: 3min
- Total execution time: 1.32 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 7min | 3.5min |
| 02 | 2 | 9min | 4.5min |
| 03 | 3 | 12min | 4min |
| 04 | 2 | 7min | 3.5min |
| 05 | 2/2 | 9min | 4.5min |
| 06 | 3/3 | 11min | 3.7min |
| 07 | 2/2 | 6min | 3min |

| 08 | 3/3 | 10min | 3.3min |
| 09 | 2/3 | 6min | 3min |

**Recent Trend:**
- Last 5 plans: 08-01 (3min), 08-02 (4min), 08-03 (3min), 09-01 (3min), 09-02 (3min)
- Trend: Consistent

*Updated after each plan completion*
| Phase 09 P02 | 3min | 2 tasks | 4 files |
| Phase 09 P01 | 3min | 2 tasks | 8 files |
| Phase 08 P01 | 3min | 2 tasks | 4 files |
| Phase 07 P02 | 3min | 3 tasks | 3 files |
| Phase 07 P01 | 3min | 2 tasks | 3 files |
| Phase 08 P03 | 3min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 8 phases derived from 42 requirements at comprehensive depth
- Roadmap: Stable primitives first (Phases 1-5), experimental Agent Teams after (Phase 6)
- Roadmap: Quality skills (Phase 7) placed after Agent Teams to leverage coordination, but designed to work with subagent fallback
- Phase 1: Megazord is the successor to GSD/Superpowers — coexistence is temporary during migration
- Phase 1: `bunx megazord` = installation only; `/mz:init` = project configuration (Phase 2)
- Phase 1-01: Plugin name "mz" (not "megazord") for short /mz: prefix
- Phase 1-01: Zero SessionStart hooks -- context budget compliance via disable-model-invocation on stubs
- Phase 1-01: Flat /mz: namespace with no aliases per user decision
- Phase 1-02: Named tsdown entry for correct bin/megazord.mjs output
- Phase 1-02: findUp pattern for package.json resolution across dev and compiled contexts
- Phase 1-02: Context budget measured at 759 chars (3.7% of skill description budget)
- Phase 2-01: fs-extra requires default import in ESM (CJS module)
- Phase 2-01: Zod v4 .default() on objects requires full output type, not partial/empty
- Phase 2-01: Biome migrated from v2.3.0 to v2.4.2 schema
- Phase 2-02: Init flow is preset-first: select profile, then override individual toggles
- Phase 2-02: SKILL.md kept at 367 lines with 3 supporting files for detail
- Phase 2-02: Settings skill uses iterative modification: pick section, change toggles, repeat or exit
- Phase 3-01: Tools registered as subgroup under existing megazord CLI (not separate binary)
- Phase 3-01: Section-based markdown parsing with line-by-line extraction (not regex on whole file)
- Phase 3-01: Stash commands under separate stash group, not nested under state
- Phase 3-02: Agent definitions in agents/ directory as reference docs, read and embedded in Task prompts
- Phase 3-02: subagent_type='general-purpose' for all agents, matching GSD pattern
- Phase 3-02: SKILL.md delegates spawning patterns to agents.md supporting file
- Phase 3-02: Roadmap creation handled within /mz:plan when ROADMAP.md missing
- Phase 3-03: Status skill uses CLI tools for data, formats display within Markdown skill
- Phase 3-03: All 6 stubs use static templates with disable-model-invocation: true for zero context cost
- Phase 3-03: Quick tasks tracked in .planning/quick/{NNN}-{slug}/ with plan and summary
- Phase 4-01: Synchronous file reads (readFileSync) matching existing state.ts pattern
- Phase 4-01: Full plan content returned in PlanFile for embedding in Task prompts
- Phase 4-01: Wave conflict detection operates per-wave via computeWaves then detectWaveConflicts
- Phase 4-01: Line-level STATE.md manipulation for tables and decision lists
- Phase 4-02: Executor agent logs architectural issues instead of stopping (full-auto Phase 4)
- Phase 4-02: No Co-Authored-By lines in commits per user decision
- Phase 4-02: Task tool pipeline is the only execution path (graceful degradation IS the default)
- Phase 4-02: State updates are orchestrator-only responsibility, never executors
- Phase 5-01: Reviewer agent spawned by executor (not orchestrator) for per-task granularity
- Phase 5-01: Reviewer definition pre-loaded by orchestrator, embedded in <reviewer_agent> tags
- Phase 5-01: Max 3 review passes per task (initial + 2 re-reviews) before escalation
- Phase 5-01: Auto mode auto-fixes criticals; Manual mode reports to user; Off disables review entirely
- Phase 5-01: Architectural pushback is advisory only (warning/info), never critical
- Phase 5-02: Verifier uses goal-backward verification: starts from phase GOAL, checks codebase for evidence
- Phase 5-02: 3-level artifact checking: exists (file present), substantive (not stub), wired (connected to system)
- Phase 5-02: Hybrid verification mode: automated checks first, user confirmation only for UNCERTAIN items
- Phase 5-02: /mz:review works independently of config.quality.review -- always available on demand
- Phase 5-02: Help updated to 11 Available skills, 3 Coming soon (debug, discuss, map)
- [Phase 06]: Phase 6-02: Teammate mode is additive -- all existing subagent content unchanged, new sections appended
- [Phase 06]: Phase 6-02: Mode detection via execution_rules fields (execution_mode for executor, review_mode_type for reviewer)
- [Phase 06]: Phase 6-02: Delta re-review in teammate mode (reviewer checks only changes since last review)
- [Phase 06]: Phase 6-02: Reviewer never modifies implementer worktree -- minor fixes noted for lead, structural issues via SendMessage
- Phase 6-01: Worktree branch naming: mz/{team}/{agent} convention for namespace isolation
- Phase 6-01: Ownership validation uses prefix matching (not exact) for directory-level scope
- Phase 6-01: Agent not in manifest defaults to unrestricted access (opt-in enforcement)
- Phase 6-03: Hybrid detection order: CLI flags > config.agent_teams.enabled > per-wave auto-detect
- Phase 6-03: Auto-detect triggers Agent Teams when (review enabled AND 2+ plans) or inter-plan dependencies
- Phase 6-03: Delegate mode enforced at skill level, not API-level permissionMode (avoids teammate tool loss bug)
- Phase 6-03: File ownership context via .mz-agent-context.json (env vars cannot be set for teammates)
- Phase 6-03: Advisory ownership enforcement by default; strict mode opt-in via config
- Phase 7-02: /mz:discuss outputs to CONTEXT.md for phase context, .planning/brainstorms/ for standalone use
- Phase 7-02: /mz:debug adapts techniques within each phase based on issue type (runtime, build, test, perf, logic)
- Phase 7-02: Help skill updated to 13 Available, 1 Coming soon (/mz:map only)
- [Phase 07]: Phase 7-01: TDD Protocol placed after Review Protocol, before Summary Creation
- [Phase 07]: Phase 7-01: Verification Gate replaces Self-Check content in-place rather than adding separate section
- [Phase 07]: Phase 7-01: Config flag forwarding pattern: orchestrator reads config.quality.{flag}, embeds in execution_rules, executor activates protocol
- Phase 8-01: 4 focus areas (tech, architecture, quality, concerns) producing 7 documents plus synthesis SUMMARY.md
- Phase 8-01: Synthesis agent runs only on full maps, not focused single-area runs
- Phase 8-01: Orchestrator never reads map document content -- only checks existence via wc -l
- Phase 8-01: Re-mapping offers 3 options: Refresh (clean slate), Update (overwrite), Skip (reuse)
- Phase 8-01: Focus aliases: arch -> architecture, conventions -> quality
- Phase 08: Phase 8-02: Verification gate treats both passed and human_needed as passing (matches Phase 5 verification pattern)
- Phase 08: Phase 8-02: Milestone archive copies full phase directories for history preservation, git tag creation is best-effort
- [Phase 08]: Phase 8-03: Brownfield detection is a soft warning with user choice (continue or run /mz:map first)
- [Phase 08]: Phase 8-03: Verification gate is advisory only -- user always has final authority to proceed
- [Phase 08]: Phase 8-03: Milestone audit writes MILESTONE-AUDIT.md to .planning/ root (spans all phases)
- Phase 9-01: z.object with optional fields for modelOverridesSchema (z.record with z.enum key requires all keys, incompatible with partial overrides)
- Phase 9-01: Differentiated balanced profile: planner->opus, others->sonnet; budget profile: planner->sonnet, others->haiku
- Phase 9-02: Named subagent types (mz-researcher, mz-planner, mz-mapper) with fallback to general-purpose + inline embedding
- Phase 9-02: Task prompts carry only per-invocation context when using registered subagent names

### Pending Todos

None yet.

### Blockers/Concerns

- RESOLVED: Plugin coexistence verified -- mz:, gsd:, superpowers: use distinct namespaces with no path conflicts
- Phase 6: Agent Teams API is experimental (12 days old). Graceful degradation is the safety net.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 09-02-PLAN.md
Resume file: .planning/phases/09-config-consumption-wiring/09-03-PLAN.md
Stash ref: None
Last error: None