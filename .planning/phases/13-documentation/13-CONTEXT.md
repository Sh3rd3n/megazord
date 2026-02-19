# Phase 13: Documentation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

README.md that lets a new user landing on the GitHub repo or npm page understand what Megazord is, install it, and start using it within 5 minutes. Covers hero intro, quickstart, command reference for all 15 `/mz:` commands, and at least 3 usage examples showing real workflows.

</domain>

<decisions>
## Implementation Decisions

### Voice & positioning
- Conversational and warm tone — Remix/Astro docs style, approachable, explains the "why"
- Positioning: lifecycle-complete framework — "one framework for the entire development lifecycle with agents that communicate and coordinate"
- No competitor comparisons — Megazord speaks for itself through what it does
- English only, Claude generates a fitting tagline (no fixed tagline from user)

### Content depth
- Quickstart: Claude's discretion on depth — calibrate to match the warm, conversational tone
- Command reference: mini-doc per command (3-5 lines each: description, usage, when to use it)
- Commands grouped by workflow phase: Setup, Planning, Execution, Quality, Utilities
- Dedicated Prerequisites section before quickstart — what's needed (Claude Code, bun, etc.) with minimum versions

### Workflow examples
- 4 workflows to showcase:
  1. **Greenfield classic** — init → plan → go → verify (new project from scratch)
  2. **Brownfield onboarding** — map → plan → go (adding Megazord to existing project)
  3. **Quick task** — /mz:quick for fast tasks without ceremony
  4. **Debug workflow** — /mz:debug for systematic debugging
- Plus any additional workflow Claude deems useful
- Each example uses a concrete fictitious project (e.g., "todo-app", "my-saas")
- Each workflow has a brief scenario intro (1-2 sentences: when/why you'd use this)
- Show commands + synthetic output (2-3 lines of typical output per command)

### Visual presentation
- Hero image/badge PNG or SVG as README header — professional look
- Badges: Claude's discretion on which ones (npm version, CI, license as baseline)
- Collapsible `<details>` sections for long content (command reference, workflow examples) — keeps README navigable
- At least one demo GIF showing Megazord in action in a terminal

### Claude's Discretion
- Quickstart depth calibration
- Badge selection beyond the baseline trio
- Tagline wording
- Whether to add any additional workflow examples beyond the 4 selected
- Exact collapsible section boundaries
- Demo GIF content and placement

</decisions>

<specifics>
## Specific Ideas

- Warm tone like Remix/Astro docs — not cold/corporate, not overly casual either
- Command reference organized by workflow stage makes it pedagogical, not just a lookup table
- Scenario intros for each workflow example ground them in real use cases
- Fictitious project names make examples tangible and copy-pasteable
- Collapsible sections prevent the README from feeling overwhelming on first scroll

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-documentation*
*Context gathered: 2026-02-19*
