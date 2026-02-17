# Phase 3: Core Skills and State Management - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Core slash commands (`/mz:plan`, `/mz:status`, `/mz:pause`, `/mz:resume`, `/mz:quick`) with state lifecycle and context management. All ~12 slash commands registered and routable, even if some are stubs pending later phases. This phase delivers the complete single-user project management workflow.

</domain>

<decisions>
## Implementation Decisions

### Planning workflow (/mz:plan)
- Research runs by default before planning; `--skip-research` flag to skip it
- Multi-plan approach like GSD: a phase can have multiple plans (01, 02, 03...) executed in sequence; the planner decides how many are needed
- Task granularity is adaptive: simple tasks get coarse decomposition, complex tasks get fine-grained breakdown
- Soft check for CONTEXT.md: if missing, warns the user ("No context found — run /mz:discuss first for better results, or continue without") but doesn't block

### Status & progress (/mz:status)
- Two verbosity levels: compact by default, `--verbose` for detailed view with individual tasks and metrics
- Always suggests next action at the end ("▶ Next Up" section with the appropriate command)
- Progress bar uses text blocks: `[███░░░░░░░] 25%`
- Shows last error context if the most recent session had problems — helps users resume after failures

### Session lifecycle (/mz:pause, /mz:resume)
- Pause captures snapshot + `git stash`: modified files are stashed, stash ref recorded in STATE.md. Resume does `stash pop`
- Resume shows context and suggests next step ("Would you like to continue with /mz:go?") but does NOT auto-execute
- Pause is manual only — no auto-pause when context is running low
- If session ends without explicit pause, STATE.md still has the last known position for best-effort recovery

### Quick task behavior (/mz:quick)
- Like GSD: atomic commit + tracked in STATE.md. Minimum discipline maintained
- Respects config quality gates: if TDD/review are enabled, quick uses them. Quick = less project ceremony, not less quality
- Always available, even with an active project — for things that don't belong to any phase (fix typo, update README)

### Stub behavior
- Stub commands show informative message with phase number: "This skill will be available in Phase 7: Quality and Debugging Skills. Current phase: 3."
- Every stub message ends with: "Run /mz:help to see available commands."

### Claude's Discretion
- Discuss/plan integration approach (how soft check behaves internally)
- Pause handoff detail level (what exactly goes into STATE.md beyond position + stash ref)
- Resume without explicit pause behavior (best-effort from STATE.md)
- Quick task invocation pattern (description as argument, interactive mode, or both)
- Which commands need to be registered as stubs vs. already exist from Phase 1
- Stub implementation: whether to use smart stubs (model invocation) or static templates (zero cost)

</decisions>

<specifics>
## Specific Ideas

- Planning follows the GSD pipeline: discuss (optional) → research (optional) → plan → execute
- Quick tasks should feel like a fast lane, not a lesser experience — same quality, less paperwork
- Stash-based pause is a safety net: if the session crashes, the stash is still recoverable via `git stash list`
- Status error context should be recent only — don't show stale errors from 5 sessions ago

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-skills-and-state-management*
*Context gathered: 2026-02-17*
