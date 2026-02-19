# Phase 5: Code Review and Verification - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated quality gates integrated into the execution workflow. Two components: (1) two-stage code review (spec compliance + code quality) that runs after task execution via subagent, and (2) `/mz:verify` skill that validates phase deliverables against acceptance criteria. This phase uses Task tool subagents only — Agent Teams coordination is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Review feedback & reporting
- Three severity levels: critical (blocks task), warning (recommended fix), info (informational)
- Two separate reports: one for spec compliance, one for code quality — not merged
- Reports persisted as markdown files in the phase directory (audit trail)
- Spec compliance findings must cite the specific plan task/requirement not satisfied (explicit traceability)

### Failure handling
- On critical findings: auto-fix and re-review loop
- Retry limit before escalation to user: Claude's discretion (evaluate case by case)
- Warning handling (block or report-only): Claude's discretion based on quantity and type
- Escalation behavior (stop execution or continue other tasks): Claude's discretion based on severity
- Architectural pushback: reviewer can flag structural concerns as warning/info, but these do NOT block — the approach is already decided, pushback is advisory only

### Verification approach
- Hybrid mode: automated check first, then user confirmation only on ambiguous or subjective criteria
- Criteria source: both ROADMAP.md success criteria (phase-level) and PLAN.md task completion criteria (granular)
- Behavior when criteria fail: Claude's discretion based on severity
- Output persistence (VERIFICATION.md): Claude's discretion based on result

### Review integration point
- Review runs after every individual task (not per-wave or per-plan)
- Dedicated reviewer subagent (separate from executor) — fresh eyes on the code
- When review is disabled in config: brief one-time notice ("review disabled"), then proceed without
- Auto-fix handler (who fixes after failed review): Claude's discretion — orchestrator manages the flow with Task tool subagents
- Review feedback format (inline vs summary): Claude's discretion

### Claude's Discretion
- Review report format (inline comments, summary, or both)
- Retry limit for auto-fix before escalation
- Warning blocking behavior
- Escalation strategy (stop vs continue)
- Verification output persistence
- Verification fail behavior (block vs override)
- Auto-fix agent selection (new executor vs reviewer-fixes)

</decisions>

<specifics>
## Specific Ideas

- Agent Teams (Phase 6) will enhance the review-fix loop with direct SendMessage between reviewer and executor — Phase 5 designs the flow so Phase 6 can upgrade it
- User noted that AI pushback on overall approach matters — captured as "architectural warning" capability in reviewer

</specifics>

<deferred>
## Deferred Ideas

- Agent Teams review-fix loop with direct inter-agent communication — Phase 6
- Reviewer-executor real-time feedback via SendMessage — Phase 6

</deferred>

---

*Phase: 05-code-review-and-verification*
*Context gathered: 2026-02-18*
