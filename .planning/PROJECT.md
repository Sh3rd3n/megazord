# Megazord

## What This Is

Megazord is a Claude Code framework that unifies project management, code quality discipline, and real multi-agent coordination into a single tool. Distributed as an npm package with 15 slash commands, it replaces the need to combine multiple frameworks. It supports the full development lifecycle — from project initialization through milestone completion — with agents that actually communicate and coordinate via Claude Code's native Agent Teams.

## Core Value

One framework that handles the entire development lifecycle — from project initialization to code delivery — with agents that actually communicate and coordinate, not just get spawned and forgotten.

## Requirements

### Validated

- ✓ Full project management lifecycle (init, plan, go, status, pause, resume, quick, verify, map, lifecycle) — v1.0
- ✓ Code quality discipline baked into execution (TDD, brainstorming, systematic debugging, two-stage code review) — v1.0
- ✓ Native Agent Teams coordination (TeamCreate, SendMessage, shared TaskList) with reviewer-to-implementer feedback — v1.0
- ✓ Hybrid agent approach: Agent Teams where coordination matters, Task tool for fire-and-forget work — v1.0
- ✓ Git worktree isolation for parallel workstreams — v1.0
- ✓ 15 slash commands with smart defaults — v1.0
- ✓ Configurable quality settings at init time (TDD, code review, brainstorming, debugging, CORTEX) — v1.0
- ✓ Config-driven behavior: model selection, workflow toggles, and quality settings consumed by all skills — v1.0
- ✓ Context management across sessions (STATE.md, context handoff, resume from any point) — v1.0
- ✓ npm package distribution (`bunx megazord` to install) with full autocomplete support — v1.0
- ✓ CORTEX adaptive thinking with task classification and anti-sycophancy — v1.0
- ✓ Brownfield codebase support via `/mz:map` analysis — v1.0
- ✓ Milestone lifecycle management via `/mz:lifecycle` — v1.0

### Active

<!-- v1.1 Distribution & Publication -->
- [ ] GitHub repo creation and code push (sh3rd3n/megazord)
- [ ] npm package publication (installable via `bunx megazord`)
- [ ] Claude Code marketplace registration (plugin discovery)
- [ ] README with quickstart, commands reference, usage examples
- [ ] CI/CD via GitHub Actions (test on PR + publish on tag)

### Out of Scope

- Enterprise orchestration (Claude Flow-level swarm intelligence) — complexity not justified for v1
- Desktop app / GUI — CLI-first, UI later if ever
- Real-time chat between agents — Agent Teams is async message-passing, not conversation
- Support for non-Claude AI providers — Claude Code native only
- Backward compatibility with GSD/Superpowers configs — clean break, migration guide instead
- Memory/RAG layer — CLAUDE.md + STATE.md + files on disk are sufficient
- TUI interface with agent team tabs — deferred to v1.2+
- CORTEX thinking patterns (untools.co) and beads integration — deferred to v1.2+

## Context

Shipped v1.0 with ~15,800 LOC across TypeScript, Markdown, JSON, and Shell.
Tech stack: TypeScript (orchestration CLI with Zod v4 schemas), Markdown (skills, agents, workflows), Shell (hooks, ownership enforcement).
42 requirements across 6 categories (Foundation, Project Management, Code Quality, CORTEX, Multi-Agent, Workflow Config) — all satisfied.
Built in 3 days across 11 phases and 26 plans.

### Ecosystem Position

- **GSD** (14.9k stars): Strong project management — Megazord inherits and extends
- **Superpowers** (52.8k stars): Strong code quality — Megazord inherits and extends
- **Critical gap filled**: First framework to use Claude Code's native Agent Teams for real multi-agent coordination

## Constraints

- **Stack**: Hybrid — Markdown for workflows/skills/agents + TypeScript for orchestration logic
- **Distribution**: npm package that installs into `~/.claude/` (skills, agents, hooks, bin)
- **Package manager**: Always use `bun`/`bunx`, never npm/npx/yarn/pnpm
- **Compatibility**: Claude Code only (uses native features like Agent Teams, Task tool, Skills)
- **Commands**: 15 slash commands — enough to be powerful, few enough to learn in a day
- **Quality config**: TDD, code review, brainstorming, CORTEX, debugging — all configurable at init

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace GSD+Superpowers (not coexist) | Users shouldn't need to choose between or combine 3 frameworks | ✓ Good — single framework covers both domains |
| Hybrid agent approach (Teams + Task tool) | Teams for coordination, Task for fire-and-forget | ✓ Good — auto-detect per wave based on review needs |
| Prototype Agent Teams first | De-risk the core differentiator before building full framework | ✓ Good — Agent Teams API stable enough for production |
| ~15 commands (not 5, not 32) | 5 was too minimal, 32 (GSD) is too many. 15 covers core + quality + management + lifecycle | ✓ Good — grew organically from 12 to 15 as gaps emerged |
| Configurable quality discipline | TDD/review/brainstorming on by default but configurable | ✓ Good — presets (strict/balanced/minimal) simplify init |
| TypeScript for orchestration | Markdown-only can't handle sophisticated lifecycle management | ✓ Good — TS handles config validation, plan parsing, state management |
| npm distribution | Marketplace plugin limits distribution. npm gives flexibility | ✓ Good — `bunx megazord` works, commands/ distributed for autocomplete |
| Config flag forwarding pattern | Orchestrator reads config, embeds in execution_rules, executor activates | ✓ Good — clean separation between config reading and behavior |
| Named subagent types with fallback | mz-executor, mz-researcher etc. with general-purpose fallback | ✓ Good — enables model selection per agent role |
| Advisory ownership enforcement | Shell hook reads .mz-agent-context.json, strict mode opt-in | ✓ Good — low friction default, strict available when needed |
| Gap-closure phases (9-11) | Audit revealed stored-but-not-consumed config, distribution gaps | ✓ Good — all gaps closed before milestone |

## Current Milestone: v1.1 Distribution & Publication

**Goal:** Make Megazord installable and usable by anyone — GitHub repo, npm package, marketplace plugin, documentation, and CI/CD.

**Target features:**
- GitHub repository (sh3rd3n/megazord) with full code push
- npm publication (`bunx megazord` works for anyone)
- Claude Code marketplace registration for discovery
- Solid README (quickstart, commands, examples)
- GitHub Actions CI/CD (test on PR, publish on tag)

---
*Last updated: 2026-02-19 after v1.1 milestone started*
