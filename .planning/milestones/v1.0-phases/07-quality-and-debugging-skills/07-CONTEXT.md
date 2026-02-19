# Phase 7: Quality and Debugging Skills - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Structured thinking tools that shape how development work happens: TDD enforcement (RED-GREEN-REFACTOR discipline), Socratic brainstorming (/mz:discuss), systematic debugging (/mz:debug), and CORTEX adaptive task classification (Clear/Complicated/Complex/Chaotic). Anti-sycophancy enforcement ensures Claude challenges unsound architecture with evidence, not performative agreement.

</domain>

<decisions>
## Implementation Decisions

### TDD Enforcement
- Hard block on violations: if implementation is written before a failing test, execution stops and reverts
- Auto-exempt non-code tasks: config changes, docs, CI, and pure refactors with existing passing tests skip TDD automatically
- Stage banners during execution: 🟥 RED (writing failing test), 🟩 GREEN (making it pass), 🔵 REFACTOR (cleaning up)
- Violation recovery: Claude's discretion — auto-fix for minor violations, escalate for structural ones

### Brainstorming Style (/mz:discuss)
- Socratic dialogue: Claude asks probing questions to pull out ideas, challenges assumptions, builds iteratively on user answers
- Minimum 5 alternative approaches explored before converging on a direction
- Output goes to CONTEXT.md (same format as /gsd:discuss-phase)
- Works standalone too: can be used for free-form brainstorming outside phase context (output to temporary file)

### CORTEX Classification Triggers
- Classifies every task before execution — no exceptions
- Classification is automatic by Claude — user sees the result but doesn't choose
- Depth scales with level:
  - Clear: execute directly
  - Complicated: analyze first + challenge blocks
  - Complex: brainstorm + spike + challenge blocks, proceed autonomously
  - Chaotic: stop and ask user before proceeding
- Challenge blocks on Complicated+: Claude must challenge its own plan before executing ("Why not X instead?")

### Pushback / Anti-sycophancy
- Intensity proportional to CORTEX level: Clear accepts, Complicated notes concerns, Complex/Chaotic actively challenges
- Tone: direct and technical — "This approach has a problem: [evidence]. Alternative: [proposal]." No sugarcoating.
- After user insists: Claude can push back twice with different evidence. After second rejection, accepts and proceeds.
- Self-challenge: Claude's discretion on when to challenge its own plans vs when it's unnecessary overhead

### Claude's Discretion
- /mz:discuss trigger timing (manual vs auto on certain conditions)
- Self-challenge frequency (when to challenge own plans)
- TDD violation recovery severity assessment (auto-fix vs escalate threshold)

</decisions>

<specifics>
## Specific Ideas

- TDD stage banners should be visually distinct — user should always know which stage they're in at a glance
- Brainstorming must feel like a thinking partner conversation, not an interview or questionnaire
- CORTEX classification should be lightweight — a line or two showing the level, not a verbose analysis
- Pushback must be evidence-based: never "I think this might be bad" — always "This causes X because Y"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-quality-and-debugging-skills*
*Context gathered: 2026-02-18*
