# Phase 9: Config Consumption Wiring - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make config settings collected during `/mz:init` actually drive framework behavior. Model selection controls agent spawns, workflow toggles gate optional agents, and dead code from superseded approaches is cleaned up. No new features — this wires existing config to existing behavior.

</domain>

<decisions>
## Implementation Decisions

### Model profile mapping
- Standard mapping: quality → opus, balanced → sonnet, budget → haiku
- Two modes available: **uniform** (all agents same model) and **differentiated** (per-agent overrides)
- Config supports smart predefined profiles as defaults + per-agent override section for customization
- Override precedence logic: Claude's discretion (likely override wins for simplicity)
- Skills affected: `/mz:plan`, `/mz:go`, `/mz:map` — all Task tool spawns pass the model parameter

### Skip behavior feedback
- When plan_check, verifier, or other toggles are disabled: Claude's discretion on whether to show skip messages
- Manual skills always available regardless of config — `/mz:review` works even when review is off in pipeline
- `/mz:status` includes a config section showing active/inactive toggles at a glance
- Toggles to wire: plan_check, verifier, review, tdd, brainstorming, cortex, debug_mode (7 total)

### Dead code cleanup
- Full cleanup: remove dead exports, orphan imports, related tests, all references
- If ownership.ts is entirely dead: delete the file completely (no stubs or placeholders)
- Broad scan: check entire codebase for dead code, not just ownership.ts
- Any dead code found gets removed immediately in this phase
- Safety verification: Claude's discretion on approach (grep + build likely)
- Documentation: commit messages only, no separate cleanup log file
- Opportunistic fix: if touching files and spotting obvious violations, fix them

### Claude's Discretion
- Skip message format and when to show (verbose vs silent)
- Override precedence logic (override wins vs profile-as-floor)
- Dead code verification approach (grep, build, or combination)
- Whether to show skip notifications in output

</decisions>

<specifics>
## Specific Ideas

- User wants to be able to easily set everything to Opus via quality profile
- Per-agent overrides should feel optional — profiles should be good enough for most users
- Manual invocation of skills (`/mz:review`, `/mz:verify`, etc.) must never be gated by config toggles

</specifics>

<deferred>
## Deferred Ideas

- Full clean code audit of entire codebase — user wants this as a dedicated future phase (post-Phase 11, or as new insertion)
- Not in scope for Phase 9: only opportunistic fixes on files already being touched

</deferred>

---

*Phase: 09-config-consumption-wiring*
*Context gathered: 2026-02-19*
