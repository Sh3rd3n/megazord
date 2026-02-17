# Phase 4: Subagent Execution and Atomic Commits - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

`/mz:go` executes planned tasks via Task tool subagents with wave-based parallelism. Each completed task produces exactly one atomic git commit. When Agent Teams is unavailable (Phase 6), the framework gracefully falls back to this Task tool pipeline without user intervention.

Worktree isolation, reviewer feedback loops, and delegate mode are Phase 6 concerns — not this phase.

</domain>

<decisions>
## Implementation Decisions

### Execution flow
- Wave-based execution: tasks without mutual dependencies run in parallel within a wave
- Full auto: once launched, all waves execute without pause between them
- No plan = error: if no plan exists for the current phase, show clear error message directing to `/mz:plan`
- Selezione opzionale: default executes entire plan, but `--tasks 3,5` or `--from 4` flags allow partial execution
- Progress live: user sees real-time progress (current task, wave number, %) but does not intervene

### Commit behavior
- Strict 1:1 mapping: one task = exactly one commit, no exceptions
- No Co-Authored-By: commits appear clean, as if made by the user
- Post-execution: summary of what was done + suggested next step (e.g., "Phase complete. Use /mz:verify to validate.")

### Claude's Discretion
- Commit message format (conventional commits, task references, or hybrid)
- Whether state files (STATE.md, plan updates) are included in task commits or separate commits
- Plan granularity: whether `/mz:go 04-01` targets a specific plan or only full-phase execution
- File conflict detection strategy when parallel tasks in the same wave overlap
- Dry run support: evaluate whether `--dry-run` adds value vs what `/mz:status` already shows
- Failure strategy: rollback mechanism (git-based vs checkpoint), retry policy, dependency chain handling
- Failure reporting level: inline summary vs file-based log
- Subagent permission mode: respect user permissions vs bypass for delegated work

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants "fire and forget with visibility" — launch, see progress, get results. Not interactive approval per task.
- Wave-based parallism mirrors GSD's execute-phase pattern — the user is already familiar with this approach.
- Worktree question came up during discussion — user understands this is Phase 6 territory.
- Lots of "tu decidi" on technical details — user trusts Claude to make pragmatic implementation choices for failure handling, rollback, and commit formatting.

</specifics>

<deferred>
## Deferred Ideas

- Git worktree isolation for parallel agents — Phase 6 (Agent Teams Integration)
- Reviewer feedback loops during execution — Phase 5/6
- Auto-advance to next phase after completion — evaluate during implementation, may be configurable

</deferred>

---

*Phase: 04-subagent-execution-and-atomic-commits*
*Context gathered: 2026-02-17*
