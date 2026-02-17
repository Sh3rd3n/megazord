# Megazord

## What This Is

Megazord is a Claude Code framework that unifies project management (from GSD), code quality discipline (from Superpowers), and real multi-agent coordination (via Claude Code's native Agent Teams) into a single tool. Distributed as an npm package, it replaces the need to choose between or combine multiple frameworks. It targets solo developers and teams building software with Claude Code.

## Core Value

One framework that handles the entire development lifecycle — from project initialization to code delivery — with agents that actually communicate and coordinate, not just get spawned and forgotten.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Full project management lifecycle (init, roadmap, phases, milestones, pause/resume, brownfield support) — parity with GSD
- [ ] Code quality discipline baked into execution (TDD, brainstorming, systematic debugging, two-stage code review) — parity with Superpowers
- [ ] Native Agent Teams coordination (TeamCreate, SendMessage, shared TaskList) — agents that communicate, reviewer can send code back to implementer, agents share discoveries
- [ ] Hybrid agent approach: Agent Teams where coordination matters, Task tool for fire-and-forget work
- [ ] Git worktree isolation for parallel workstreams — inspired by Claude Squad
- [ ] ~12 slash commands with smart defaults (`/mz init`, `/mz plan`, `/mz go`, `/mz status`, `/mz resume`, `/mz quick`, `/mz review`, `/mz debug`, `/mz verify`, `/mz discuss`, `/mz pause`, `/mz map`)
- [ ] Configurable quality settings at init time (TDD on/off, code review auto/manual, brainstorming, debugging mode)
- [ ] Context management across sessions (STATE.md, context handoff, resume from any point)
- [ ] npm package distribution (`bunx megazord` to install)

### Out of Scope

- Enterprise orchestration (Claude Flow-level swarm intelligence) — complexity not justified for v1
- Desktop app / GUI (Auto-Claude-style) — CLI-first, UI later if ever
- Real-time chat between agents — Agent Teams is async message-passing, not conversation
- Support for non-Claude AI providers — Claude Code native only
- Backward compatibility with GSD/Superpowers configs — clean break, migration guide instead

## Context

### Ecosystem Analysis

A comprehensive analysis of the Claude Code framework ecosystem was conducted (see `superpowers-vs-gsd-analysis.md`). Key findings:

- **GSD** (14.9k stars): Strong project management and context management, but no code quality enforcement
- **Superpowers** (52.8k stars): Strong code quality discipline (TDD, review), but no project-level structure
- **Claude Flow** (14k stars): Enterprise swarm orchestration — overkill for individual devs
- **Claude Squad** (5.6k stars): Workspace multiplexer — useful concept (worktree isolation) but not a workflow
- **Critical gap**: No framework uses Claude Code's native Agent Teams (TeamCreate, SendMessage, shared TaskList)

### Technical Foundation

Claude Code Agent Teams provide:
- `TeamCreate` — create a team with shared task list
- `SendMessage` — direct messages between agents (DM, broadcast, shutdown requests)
- `TaskList/TaskCreate/TaskUpdate` — shared task list visible to all team members
- Agents go idle between turns (async, not real-time)
- No shared memory beyond TaskList and files on disk

### Risk: Agent Teams is Unproven

No existing framework has built on Agent Teams. The first phase of development must be a prototype to validate that the coordination model works in practice before investing in the full framework.

## Constraints

- **Stack**: Hybrid — Markdown for workflows/skills/agents + TypeScript for orchestration logic
- **Distribution**: npm package that installs into `~/.claude/` (skills, agents, workflows, bin)
- **Package manager**: Always use `bun`/`bunx`, never npm/npx/yarn/pnpm
- **Compatibility**: Claude Code only (uses native features like Agent Teams, Task tool, Skills)
- **Commands**: ~12 slash commands — enough to be powerful, few enough to learn in a day
- **Quality config**: TDD, code review, brainstorming, debugging mode — all configurable at init, not forced

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace GSD+Superpowers (not coexist) | Users shouldn't need to choose between or combine 3 frameworks. One tool, one workflow. | — Pending |
| Hybrid agent approach (Teams + Task tool) | Teams for coordination, Task for fire-and-forget. Pragmatic — not everything needs inter-agent communication. | — Pending |
| Prototype Agent Teams first | De-risk the core differentiator before building the full framework. If Teams doesn't work well enough, design changes. | — Pending |
| ~12 commands (not 5, not 32) | 5 was too minimal (user feedback). 32 (GSD) is too many. 12 covers core + quality + management. | — Pending |
| Configurable quality discipline | TDD/review/brainstorming should be on by default but configurable — not everyone wants rigid TDD for every task. | — Pending |
| TypeScript for orchestration | Markdown-only (Superpowers) can't handle sophisticated Team lifecycle management. TS adds build complexity but enables real orchestration. | — Pending |
| npm distribution | Marketplace plugin limits distribution. npm gives flexibility and reach. | — Pending |

---
*Last updated: 2026-02-17 after initialization*
