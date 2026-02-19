# Phase 8: Brownfield Support and Project Lifecycle - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Megazord works for existing codebases (not just greenfield) and supports full project lifecycle management. Two capabilities: (1) `/mz:map` analyzes an existing codebase into structured documents that inform planning, and (2) lifecycle management including roadmap creation, milestone tracking, phase transitions with verification gates, and phase management commands.

</domain>

<decisions>
## Implementation Decisions

### Mapping scope and output
- Multi-document output per area (separate files, not a single monolith)
- Areas: at minimum GSD's four (tech stack, architecture, code quality, concerns) — Claude may add others if useful for planning
- Parallel agents: one agent per area, running concurrently
- Output location and synthesis (summary doc or not): Claude's discretion
- Optional focus parameter: user can specify a subset of areas (e.g., `/mz:map architecture`) — default runs all
- Re-mapping behavior on existing analysis: Claude's discretion

### Roadmap creation flow
- Brownfield roadmap creation uses automatic analysis + user review (Claude proposes, user approves/modifies)
- Dedicated agents: researcher for gathering/analysis, planner/roadmapper for structuring phases
- Integration between /mz:map and /mz:plan: Claude's discretion on how map output feeds into roadmap creation

### Milestone lifecycle
- Milestone model follows GSD pattern: milestones group phases, audit before closing, archive and transition
- Audit is mandatory before closing a milestone — deliverables must be verified
- Milestone creation and management: Claude's discretion on whether to use a dedicated skill or extend existing skills
- Archive strategy for completed milestone files: Claude's discretion

### Phase transition rules
- Verification (/mz:verify) is mandatory before advancing to next phase — verification gate is enforced
- Phase transitions are manual — user decides when to start next phase (no auto-advance between phases)
- Phase skip/reorder flexibility: Claude's discretion
- Phase management commands: dedicated commands for adding, removing, and inserting phases (like GSD's add-phase, remove-phase, insert-phase with decimal numbering)

### Claude's Discretion
- Output path structure and whether to synthesize a summary document from mapping
- Re-mapping behavior (overwrite vs ask)
- How /mz:map output feeds into /mz:plan for brownfield projects
- Roadmap format adaptation for brownfield (same as greenfield or with additional sections)
- Milestone skill architecture (new dedicated skill vs extension of existing skills)
- Archive strategy for completed milestones
- Phase skip/reorder flexibility
- Specific area categories beyond GSD's four defaults

</decisions>

<specifics>
## Specific Ideas

- GSD's codebase mapping pattern is the reference implementation for /mz:map (parallel agents writing to .planning/codebase/)
- GSD's milestone model is the reference for lifecycle management (milestone creation, audit, completion, archive)
- Roadmap creation should feel like "Claude proposes, user reviews" — not a long interactive questionnaire

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-brownfield-support-and-project-lifecycle*
*Context gathered: 2026-02-18*
