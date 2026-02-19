# Phase 11: Milestone Lifecycle Completion - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Skill-level path for the full milestone lifecycle: audit, archive, and next version preparation. Users can complete the entire cycle through skills without falling back to CLI commands. The existing CLI tools (milestone.ts, roadmap.ts) provide the foundation — this phase wires them into a guided skill experience.

</domain>

<decisions>
## Implementation Decisions

### Skill flow design
- Claude's Discretion: whether to use a single unified skill or separate skills for each step
- Claude's Discretion: interaction model (fully automatic vs interactive with confirmations)
- Always show a milestone status summary (phases completed, gaps, progress) before proceeding with archive

### Archive behavior
- Claude's Discretion: archive destination structure (e.g., .planning/archive/v1.0/)
- Claude's Discretion: move vs copy strategy for archived phase directories
- Claude's Discretion: git tag creation (automatic vs prompted)
- Claude's Discretion: ROADMAP.md and STATE.md reset behavior after archive

### Next version preparation
- Deferred items: collect from all CONTEXT.md files, present the list to the user, user selects which to carry forward into the new milestone backlog
- Configuration (megazord.config.json) is inherited as-is — no config review prompt on new milestone
- Version numbering: suggest the next version number (semver bump), user confirms or modifies
- Claude's Discretion: whether to guide directly into new milestone creation or just suggest next steps

### Audit-archive link
- When audit finds gaps: propose gap-closure phases (like v1.0 phases 9-11 pattern)
- After gap-closure phases complete: auto re-audit to verify gaps are closed
- Iteration limit: unlimited — keep proposing gap closure until audit passes 100%
- Skip audit: support a --skip-audit flag for projects where formality isn't needed

### Claude's Discretion
- Overall skill architecture (unified vs separate skills)
- Level of interactivity at each step
- Archive file organization and cleanup strategy
- Git tag naming and creation
- State file reset approach
- Post-archive flow (guided vs suggested next steps)

</decisions>

<specifics>
## Specific Ideas

- Gap closure should follow the same pattern used for v1.0 (phases 9-11 were created to close audit gaps — replicate this workflow)
- The deferred items selection is important: show all deferred items collected across phases, let user cherry-pick which become requirements for the next milestone

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-milestone-lifecycle-completion*
*Context gathered: 2026-02-19*
