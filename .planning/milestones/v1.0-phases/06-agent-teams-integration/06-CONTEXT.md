# Phase 6: Agent Teams Integration - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Native Agent Teams coordination for `/mz:go` execution. When work requires inter-agent communication (reviewer↔implementer feedback, parallel task coordination), Megazord creates a team via TeamCreate with shared TaskList and SendMessage communication. Includes worktree isolation per agent, file ownership enforcement, and delegate mode for the team lead. Graceful fallback to Task tool subagents when Agent Teams is unavailable.

</domain>

<decisions>
## Implementation Decisions

### Team activation & fallback
- Auto-detect based on plan complexity: independent tasks → subagents, coordination-heavy tasks (review loops, parallel with dependencies) → Agent Teams
- Flag override available: `--teams` / `--no-teams` force the mode regardless of auto-detect
- Fallback is silent: if Agent Teams fails (API unavailable, creation error), fall back to subagents with only a log-level notice — no user prompt

### Review feedback loops
- Hybrid review model: reviewer fixes minor issues directly (typo, formatting, simple style); structural/logical problems are sent back to the implementer via SendMessage
- Max review rounds: Claude's discretion (Phase 5 uses 3 as baseline)
- Reviewer↔implementer communication is visible to the user in real-time (messages flow through the team lead)
- Escalation strategy after max rounds: Claude's discretion

### Conflict & merge strategy
- One git worktree per agent — each parallel teammate works in complete isolation
- File ownership enforcement level: Claude's discretion (hard block vs advisory)
- Merge strategy: Claude's discretion (auto-merge, sequential, or hybrid)
- Worktree cleanup policy: Claude's discretion (immediate vs batch)

### Delegate mode behavior
- Delegate mode is the ONLY mode for Agent Teams — the team lead never implements directly, only coordinates via spawn/message/shutdown/task tools
- Dynamic task creation: Claude's discretion (whether lead can create tasks beyond the original plan)
- Progress communication: user sees agent messages in real-time (already visible), team lead communicates only the final result summary
- Team shutdown flow: Claude's discretion

### Claude's Discretion
- Mixed-plan granularity: how to split waves between subagents and Agent Teams when a plan has both simple and complex tasks
- File ownership enforcement level (hard vs soft)
- Merge strategy and worktree cleanup timing
- Max review rounds and escalation behavior
- Dynamic task creation flexibility for team lead
- Team shutdown flow (auto vs confirmation)

</decisions>

<specifics>
## Specific Ideas

- User's mental model: "research tasks = subagents (fast), coordination tasks = Agent Teams (communication)" — the auto-detect should match this intuition
- Real-time visibility is important — the user wants to see what's happening between agents, not just the end result
- Delegate mode is strict: the lead is a coordinator, never an implementer. This keeps the architecture clean

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-agent-teams-integration*
*Context gathered: 2026-02-18*
