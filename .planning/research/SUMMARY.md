# Project Research Summary

**Project:** Megazord
**Domain:** Claude Code meta-framework (project management + code quality + multi-agent coordination)
**Researched:** 2026-02-17
**Confidence:** MEDIUM (core patterns are well-documented; Agent Teams integration is unproven territory)

## Executive Summary

Megazord is a Claude Code framework that unifies project management (from GSD), code quality enforcement (from Superpowers), and multi-agent coordination (via native Agent Teams) into a single plugin. Experts building Claude Code frameworks distribute as Claude Code plugins with namespaced skills, use markdown-as-orchestration for workflow logic, keep TypeScript thin (CLI helpers only, not application frameworks), and enforce quality through hooks rather than prompts. The recommended approach is to build on Claude Code's native primitives -- skills, agents, hooks, and the plugin system -- rather than reimplementing capabilities that already exist.

The primary differentiator is native Agent Teams integration. No existing framework (Superpowers, GSD, Claude Flow) has shipped this despite documented community demand (Superpowers #429/#469, Claude Flow #1098). The secondary differentiator is configurable quality discipline -- Superpowers forces TDD on everything, GSD has none, and no framework lets users set the dial. Together these create a framework that is both more capable (agents that communicate) and more flexible (quality enforcement that adapts to context) than anything available today.

The critical risk is that Agent Teams is 12 days old, experimental, and fragile. Building the entire framework on an experimental API is reckless. The mitigation is firm: build the core framework on stable primitives (subagents via Task tool, skills, hooks) first, then layer Agent Teams on top as an enhancement with graceful degradation. The second major risk is instruction attenuation -- combining three frameworks' worth of instructions will exceed Claude's ~100-instruction attention budget, causing uniform compliance degradation. This must be addressed architecturally through lazy loading and aggressive instruction pruning, not by adding "MANDATORY" labels to everything.

## Key Findings

### Recommended Stack

The stack is modern TypeScript (5.8) targeting Node.js 22 LTS, built with tsdown (Rust-based successor to tsup), using Bun as package manager and script runner. The distribution model is a Claude Code plugin with an npm fallback installer.

**Core technologies:**
- **TypeScript ~5.8 + Node.js >=22:** Language and runtime. Type safety is non-negotiable for a framework others depend on. Node 22 is LTS through 2027.
- **Commander.js ^14:** CLI framework for the `megazord` binary (~12 subcommands). Battle-tested, excellent TS types.
- **Zod ^4.3:** Schema validation for config files and STATE.md parsing. 14x faster than v3, ecosystem dominance.
- **tsdown ^0.20:** TypeScript bundler (successor to tsup). Pre-1.0 but actively developed, Rust-based, ESM-first.
- **Biome ^2.3:** Linting + formatting in one binary. Replaces ESLint + Prettier with 25x speed improvement.
- **Vitest ^4.0:** Test runner with rich mocking, coverage, and watch mode. Preferred over `bun test` for feature richness.

**Key stack decision:** Distribute as a Claude Code plugin (namespaced skills, native lifecycle management) rather than GSD's approach of copying files to `~/.claude/`. The plugin system is official, well-documented, and prevents namespace conflicts. An npm `bunx megazord` command serves as fallback installer.

### Expected Features

**Must have (table stakes):**
- Slash command interface (~12 commands: init, plan, go, quick, review, debug, verify, discuss, status, pause, resume, map)
- Structured planning before execution (decompose into tasks with completion criteria)
- Context management and session pause/resume (STATE.md, fresh subagent spawning, context handoff)
- Atomic commits per task (clean git history, bisect-friendly)
- Code review (two-stage: spec compliance + code quality, configurable)
- Quick mode for simple tasks (bypass full ceremony)
- Subagent execution via Task tool (stable, non-experimental foundation)
- Verification/UAT gate before marking work complete

**Should have (competitive advantage):**
- Native Agent Teams integration (the primary differentiator -- no competitor has it)
- Hybrid agent approach (Teams for coordination, Task tool for fire-and-forget)
- Configurable quality discipline (TDD on/off, review auto/manual/off, brainstorming on/off)
- TDD workflow with RED-GREEN-REFACTOR enforcement
- Socratic brainstorming before coding
- Systematic four-phase debugging

**Defer (v2+):**
- Full project lifecycle management (roadmap/milestones at GSD scale)
- Wave execution optimization
- Plan approval gates for teammates
- GitHub Issues integration

### Architecture Approach

The architecture is a layered plugin: user-facing slash commands invoke markdown skills, which orchestrate either Agent Teams or subagents depending on task complexity, with TypeScript helpers handling operations that pure markdown cannot (state file parsing, git worktree management, config resolution). Quality is enforced through hooks (hard gates), not just prompt instructions (soft suggestions). All state lives on disk in `.planning/` as markdown files, with git as the ultimate source of truth.

**Major components:**
1. **Skills layer (Markdown)** -- 12 SKILL.md files that serve as the orchestration layer, deciding execution strategy per invocation
2. **Agent definitions (Markdown)** -- 7 typed agents (executor, reviewer, researcher, debugger, planner, verifier, mapper) with focused roles and tool restrictions
3. **Orchestration helpers (TypeScript)** -- Thin `mz-tools.ts` CLI for state management, git worktree ops, and config parsing
4. **Coordination layer** -- Agent Teams (TeamCreate, SendMessage, TaskList) with Task tool fallback
5. **Persistence layer** -- STATE.md, PROJECT.md, ROADMAP.md, PHASE-{N}.md files in `.planning/`
6. **Quality gates (Hooks)** -- TaskCompleted, TeammateIdle, Stop hooks that enforce TDD, review, and verification

**Key architectural patterns:**
- Skill-as-orchestrator: Skills decide whether to use Teams, subagents, or inline execution
- Hybrid agent approach: Teams for coordination-heavy work, Task tool for fire-and-forget
- State-on-disk with TypeScript helpers: Markdown files for state, TS for structured operations
- Quality via hooks: Hard enforcement, not soft prompt suggestions

### Critical Pitfalls

1. **Instruction attenuation** -- Claude ignores framework rules when instruction count exceeds ~100 user directives. Prevent by keeping CLAUDE.md under 60 lines, using lazy skill loading, and measuring total framework tokens (<15% of context window). This is the #1 architectural constraint.

2. **Agent Teams fragility** -- The API is 12 days old, experimental, with no session resumption for teammates, task status lag, no nested teams, and one team per session. Prevent by building on stable primitives first, abstracting Teams behind an interface, and implementing graceful degradation to Task tool.

3. **Paradigm collision** -- Combining project management (GSD-style) and code quality (Superpowers-style) creates conflicting control flows. Prevent by designing a clear hierarchy: project layer is the outer loop, quality layer is the inner loop, with explicit handoff points. Never let both compete for control simultaneously.

4. **File conflict hell in multi-agent execution** -- Multiple agents editing the same file causes silent overwrites. Prevent by enforcing strict file ownership per task, using git worktrees for isolation, and using PostToolUse hooks to detect unauthorized file modifications. This cannot be retrofitted -- it must be designed in.

5. **State drift across sessions** -- Framework state files diverge from actual git state when work happens outside the framework. Prevent by deriving state from git where possible, implementing state validation at session start, and providing a "rebuild state from git" command.

## Implications for Roadmap

Based on combined research, here is the suggested phase structure. The ordering reflects three principles: (1) architectural constraints from PITFALLS.md must be addressed before building on them, (2) stable primitives before experimental features, and (3) the differentiator (Agent Teams) needs a solid foundation to build on.

### Phase 1: Foundation and Plugin Scaffold
**Rationale:** Everything depends on the plugin structure, state file formats, config schema, and agent definitions. Instruction budget and context management decisions must be made first (Pitfall 1, 2, 5). This phase establishes the architectural constraints that every subsequent phase must respect.
**Delivers:** Working Claude Code plugin with manifest, project templates, config schema, agent definitions, and the TypeScript build pipeline.
**Addresses:** Plugin distribution (table stake), installation (Pitfall 6), foundational architecture (ARCHITECTURE.md Phase 1)
**Avoids:** Instruction attenuation (by setting context budget), paradigm collision (by defining the unified workflow model), installation fragility (by using plugin format from day one)

### Phase 2: Core Skills and State Management
**Rationale:** Before adding multi-agent coordination, the single-agent workflow must work perfectly. Init, plan, status, pause, resume, and quick mode are table stakes that validate the framework's basic value proposition. State management is a prerequisite for everything that follows.
**Delivers:** Working `/mz:init`, `/mz:plan`, `/mz:status`, `/mz:pause`, `/mz:resume`, `/mz:quick`. Functional STATE.md lifecycle. TypeScript state helpers (`mz-tools.ts`).
**Addresses:** Structured planning, context management, session pause/resume, quick mode (all table stakes from FEATURES.md)
**Avoids:** State drift (Pitfall 7 -- state validation implemented here), context exhaustion (Pitfall 2 -- lazy loading enforced)

### Phase 3: Subagent Execution and Code Review
**Rationale:** The stable execution foundation must work before adding experimental Agent Teams. Task tool subagents are the proven, non-experimental mechanism. Code review (the most requested quality feature) ships here using subagent delegation. This phase delivers the framework's second differentiator: configurable quality discipline.
**Delivers:** Working `/mz:go` with Task tool execution, `/mz:review` with two-stage review, `/mz:verify` for UAT. Configurable quality settings (TDD on/off, review mode). Atomic commits per task.
**Addresses:** Subagent execution, code review, verification/UAT, atomic commits, configurable quality (from FEATURES.md)
**Avoids:** Agent Teams fragility (Pitfall 3 -- built on stable primitives)

### Phase 4: Agent Teams Integration
**Rationale:** With a solid foundation of skills, state management, and subagent execution, Agent Teams can be layered on as an enhancement. This is the highest-risk, highest-reward phase. Graceful degradation to Phase 3's subagent execution is the safety net.
**Delivers:** Agent Teams execution in `/mz:go` (TeamCreate, SendMessage, shared TaskList). Reviewer-executor feedback loop via SendMessage. TaskCompleted and TeammateIdle hooks. Automatic fallback to Task tool when Teams is unavailable.
**Addresses:** Native Agent Teams integration, hybrid agent approach (primary differentiators from FEATURES.md)
**Avoids:** Agent Teams fragility (Pitfall 3 -- abstracted behind interface with fallback), file conflicts (Pitfall 4 -- file ownership enforcement)

### Phase 5: Quality and Debugging Skills
**Rationale:** With Agent Teams working (or gracefully degraded), quality skills that leverage multi-agent coordination can be added. TDD enforcement, systematic debugging, and Socratic brainstorming are the polish that makes Megazord feel like a premium framework.
**Delivers:** `/mz:discuss` (brainstorming), `/mz:debug` (systematic four-phase debugging), TDD RED-GREEN-REFACTOR enforcement when enabled. Git worktree isolation for parallel execution.
**Addresses:** TDD workflow, Socratic brainstorming, systematic debugging, git worktree isolation (differentiators from FEATURES.md)
**Avoids:** File conflicts (Pitfall 4 -- worktree isolation), overloading instructions (Pitfall 1 -- quality skills loaded on-demand only)

### Phase 6: Brownfield Support and Project Lifecycle
**Rationale:** Advanced project management features require all foundational pieces to be working. Brownfield support needs codebase analysis agents. Full lifecycle management needs reliable state tracking. These are the features that transform Megazord from a task-execution tool into a project-management framework.
**Delivers:** `/mz:map` for brownfield codebase analysis, full roadmap/milestone management, wave execution optimization, delegate mode for team lead.
**Addresses:** Brownfield support, project lifecycle management, delegate mode, wave execution (v1.x and v2 features from FEATURES.md)

### Phase Ordering Rationale

- **Foundation before features:** Pitfalls 1, 2, 5, and 6 are architectural -- they cannot be fixed later. Phase 1 addresses all four.
- **Stable before experimental:** Phases 2-3 build on proven Claude Code primitives (skills, Task tool, hooks). Phase 4 adds experimental Agent Teams only after the framework works without them.
- **Single-agent before multi-agent:** The hardest bugs come from multi-agent coordination (Pitfall 4). Getting single-agent execution right first makes multi-agent debugging possible.
- **Quality features after execution:** TDD and debugging skills (Phase 5) are more valuable when they can leverage Agent Teams coordination (Phase 4), but they also work with subagent fallback.
- **Project management last:** Full lifecycle management (Phase 6) is the least urgent differentiator and the most complex addition. It depends on all prior phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Research needed on Claude Code plugin manifest format and namespacing behavior -- official docs are clear but integration testing with existing plugins (Superpowers) is untested
- **Phase 4:** Research needed on Agent Teams API stability, TaskList behavior under load, SendMessage reliability, and interaction with hooks -- this is genuinely uncharted territory since no framework has done it
- **Phase 5:** Research needed on TDD enforcement mechanisms -- how to detect RED (test fails) vs GREEN (test passes) vs REFACTOR state programmatically across different test frameworks

Phases with standard patterns (skip research-phase):
- **Phase 2:** Well-documented patterns from GSD (STATE.md, pause/resume) and Claude Code skills documentation
- **Phase 3:** Well-documented patterns from Superpowers (subagent execution, two-stage review) and Claude Code Task tool documentation
- **Phase 6:** Well-documented patterns from GSD (roadmap, milestones, brownfield analysis)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies are stable, well-documented, and battle-tested. Only tsdown (pre-1.0) is a minor risk with a clear fallback (tsup). |
| Features | HIGH | Extensive primary source analysis of 8 competing frameworks. Feature gaps and differentiators are well-documented with GitHub issues as evidence. |
| Architecture | MEDIUM | Plugin system and skill patterns are well-documented. Agent Teams integration architecture is sound in theory but unproven in practice -- no framework has attempted it. |
| Pitfalls | HIGH | Verified against official docs, GitHub issues, and community reports. Instruction attenuation and Agent Teams fragility are documented with specific issue numbers. |

**Overall confidence:** MEDIUM -- The core framework architecture is solid and well-supported by existing patterns. The confidence gap is entirely in Agent Teams integration, which is the primary differentiator. This is an acceptable risk because the architecture explicitly accounts for it with graceful degradation.

### Gaps to Address

- **Agent Teams reliability under real workloads:** No data exists on Teams' behavior with 4+ teammates doing actual code work simultaneously. Must be validated empirically in Phase 4 with progressively larger teams.
- **Instruction budget measurement:** The 15% context budget target for framework overhead is a best-practice recommendation, not a measured baseline. Phase 1 must include actual token measurement of skill loading.
- **Plugin coexistence testing:** No data on whether a Megazord plugin coexists cleanly with Superpowers or GSD plugins installed simultaneously. Must test before publishing.
- **tsdown stability for production bundling:** tsdown is pre-1.0 (0.20.x). If build issues arise, fall back to tsup ^8.5 or esbuild. Low risk but worth noting.
- **Hook reliability for quality gates:** Pitfalls research notes hooks are "best-effort." Must verify that TaskCompleted hooks reliably block task closure on test failure before depending on them for TDD enforcement.

## Sources

### Primary (HIGH confidence)
- [Claude Code Agent Teams documentation](https://code.claude.com/docs/en/agent-teams) -- API surface, limitations, lifecycle
- [Claude Code Skills documentation](https://code.claude.com/docs/en/skills) -- Skill format, loading, namespacing
- [Claude Code Plugins documentation](https://code.claude.com/docs/en/plugins) -- Plugin manifest, distribution, marketplace
- [Claude Code Subagents documentation](https://code.claude.com/docs/en/sub-agents) -- Task tool, agent definitions
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) -- Hook types, configuration, behavior
- [Superpowers GitHub repository](https://github.com/obra/superpowers) -- TDD workflow, code review, brainstorming patterns
- [GSD GitHub repository](https://github.com/glittercowboy/get-shit-done) -- Project management, state management, context rotation patterns
- [GitHub issue #18454](https://github.com/anthropics/claude-code/issues/18454) -- Instruction attenuation documentation
- [GitHub issue #22309](https://github.com/anthropics/claude-code/issues/22309) -- CLAUDE.md "may or may not be relevant" disclaimer
- [Superpowers Issue #429](https://github.com/obra/superpowers/issues/429) -- Community demand for Agent Teams integration

### Secondary (MEDIUM confidence)
- [Claude Flow GitHub repository](https://github.com/ruvnet/claude-flow) -- Enterprise swarm patterns (cautionary)
- [Claude Squad GitHub repository](https://github.com/smtg-ai/claude-squad) -- Git worktree isolation patterns
- [tsdown documentation](https://tsdown.dev/guide/) -- Bundler configuration and migration from tsup
- [Addy Osmani: Claude Code Swarms](https://addyosmani.com/blog/claude-code-agent-teams/) -- Practitioner perspective on Agent Teams
- [CLAUDE.md instruction-following best practices](https://www.buildcamp.io/guides/the-ultimate-guide-to-claudemd) -- Instruction budget guidelines

### Tertiary (LOW confidence)
- [Superpowers issue #355](https://github.com/obra/superpowers/issues/355) -- Plugin marketplace name collision (single report, may be resolved)
- [RIPER-5 GitHub repository](https://github.com/tony/claude-code-riper-5) -- Modal execution pattern (small community)

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
