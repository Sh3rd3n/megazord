# Roadmap: Megazord

## Overview

Megazord unifies project management, code quality discipline, and multi-agent coordination into one Claude Code framework. The roadmap progresses from stable foundations (plugin scaffold, configuration, core skills) through proven single-agent execution (subagents, code review) before tackling the highest-risk differentiator (Agent Teams). Quality skills and advanced project management follow once the execution pipeline is solid. Each phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Plugin Scaffold and Build Pipeline** - Working Claude Code plugin with manifest, npm distribution, TypeScript build, and context budget enforcement (completed 2026-02-17)
- [x] **Phase 2: Project Initialization and Configuration** - `/mz:init` creates project structure with full configuration schema for quality, workflow, and agent settings (completed 2026-02-17)
- [x] **Phase 3: Core Skills and State Management** - Core slash commands (plan, status, pause, resume, quick) with state lifecycle and context management (completed 2026-02-17)
- [x] **Phase 4: Subagent Execution and Atomic Commits** - Task tool execution pipeline with atomic git commits and graceful degradation path (completed 2026-02-17)
- [x] **Phase 5: Code Review and Verification** - Two-stage code review and UAT verification gate integrated into execution workflow (completed 2026-02-18)
- [x] **Phase 6: Agent Teams Integration** - Native Agent Teams coordination with hybrid approach, reviewer feedback loops, worktree isolation, and delegate mode (completed 2026-02-18)
- [x] **Phase 7: Quality and Debugging Skills** - TDD enforcement, Socratic brainstorming, systematic debugging, and CORTEX adaptive thinking (completed 2026-02-18)
- [x] **Phase 8: Brownfield Support and Project Lifecycle** - Codebase analysis for existing projects and full lifecycle management (roadmap, milestones, phase transitions) (completed 2026-02-18)

## Phase Details

### Phase 1: Plugin Scaffold and Build Pipeline
**Goal**: A developer can install Megazord as a Claude Code plugin and have the framework load without conflicting with other plugins or exceeding context budget
**Depends on**: Nothing (first phase)
**Requirements**: DIST-01, DIST-03, DIST-04, DIST-05, PROJ-12
**Success Criteria** (what must be TRUE):
  1. Running `bunx megazord` installs the plugin and `plugin.json` manifest is recognized by Claude Code
  2. Megazord plugin coexists with Superpowers and GSD installed simultaneously without namespace conflicts or skill collisions
  3. TypeScript orchestration CLI (`mz-tools`) compiles, bundles, and executes basic commands (version, help)
  4. Framework overhead at session start measures under 15% of context window with all skills registered
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold, plugin manifest, and 13 skill stubs
- [ ] 01-02-PLAN.md -- TypeScript CLI, build pipeline, coexistence and context budget verification

### Phase 2: Project Initialization and Configuration
**Goal**: A developer can run `/mz:init` to set up a new project with their preferred quality and workflow settings persisted in config
**Depends on**: Phase 1
**Requirements**: PROJ-01, CONF-01, CONF-02, CONF-03, CONF-04, QUAL-05, QUAL-07, CRTX-06
**Success Criteria** (what must be TRUE):
  1. Running `/mz:init` creates `.planning/` directory with PROJECT.md, STATE.md, and `megazord.config.json`
  2. User is prompted for workflow preferences (mode, depth, parallelization, git tracking) and quality settings (TDD, review, brainstorming, debug mode, CORTEX)
  3. All settings are persisted in `megazord.config.json` and can be modified after init without re-running the command
  4. Quality and workflow configuration is respected by downstream skills when they load config
  5. AI model selection (quality/balanced/budget) is configurable and stored in config
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Config schema (Zod v4), presets, GSD migration, and design system reference
- [ ] 02-02-PLAN.md -- /mz:init skill with deep context gathering, /mz:settings skill, help update

### Phase 3: Core Skills and State Management
**Goal**: A developer can plan work, track progress, pause mid-session, resume later, and run quick tasks -- the complete single-user project management workflow
**Depends on**: Phase 2
**Requirements**: DIST-02, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07, PROJ-11
**Success Criteria** (what must be TRUE):
  1. Running `/mz:plan` decomposes a phase into tasks with dependencies and completion criteria
  2. Running `/mz:status` shows current phase, completed tasks, next actions, and overall progress
  3. Running `/mz:pause` creates a context handoff file, and `/mz:resume` in a new session restores full working context from STATE.md
  4. Running `/mz:quick` executes a simple task without requiring project ceremony (no roadmap, no phases)
  5. All ~12 slash commands are registered and routable, even if some are stubs pending later phases
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- State management library and CLI tooling (state.ts, progress, stash commands)
- [ ] 03-02-PLAN.md -- /mz:plan skill with researcher and planner agent definitions
- [ ] 03-03-PLAN.md -- /mz:status, pause, resume, quick skills + stub updates + help refresh

### Phase 4: Subagent Execution and Atomic Commits
**Goal**: A developer can execute planned tasks via subagent delegation with each completed task producing exactly one clean git commit
**Depends on**: Phase 3
**Requirements**: PROJ-08, AGNT-02
**Success Criteria** (what must be TRUE):
  1. Running `/mz:go` spawns Task tool subagents that execute planned tasks according to the current phase plan
  2. Each completed task produces exactly one atomic git commit with a descriptive message that references the task
  3. When Agent Teams is unavailable or disabled, the framework gracefully falls back to Task tool subagents without user intervention
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md -- Plan parsing library, state extensions, and CLI tooling
- [x] 04-02-PLAN.md -- Executor agent definition and /mz:go orchestration skill

### Phase 5: Code Review and Verification
**Goal**: Completed work passes through quality gates before being marked done -- automated two-stage review and user acceptance verification
**Depends on**: Phase 4
**Requirements**: QUAL-01, QUAL-06
**Success Criteria** (what must be TRUE):
  1. When code review is enabled in config, a review subagent automatically runs two-stage review (spec compliance + code quality) after task execution
  2. Review findings are reported with actionable feedback and the task is not marked complete until review passes
  3. Running `/mz:verify` confirms phase deliverables match acceptance criteria, and the phase cannot transition to complete until verification passes
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Reviewer agent definition and execution pipeline review integration
- [x] 05-02-PLAN.md -- Verifier agent, /mz:verify skill, /mz:review standalone skill, help update

### Phase 6: Agent Teams Integration
**Goal**: Coordination-heavy work uses native Agent Teams for real inter-agent communication -- reviewers send code back to implementers, agents share task state, and parallel work is isolated
**Depends on**: Phase 5
**Requirements**: AGNT-01, AGNT-03, AGNT-04, AGNT-05, AGNT-06, AGNT-07, AGNT-08
**Success Criteria** (what must be TRUE):
  1. Running `/mz:go` with Agent Teams enabled creates a team via TeamCreate with shared TaskList, and agents communicate via SendMessage
  2. A reviewer agent can send code back to a specific implementer agent via SendMessage with actionable feedback, and the implementer revises
  3. Each parallel teammate operates in its own git worktree, preventing file conflicts during simultaneous execution
  4. File ownership enforcement blocks agents from modifying files outside their declared scope
  5. Delegate mode allows a team lead to coordinate work using only spawn/message/shutdown/task tools without implementing directly
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md -- Worktree management library, ownership validation, config extension, CLI tools
- [ ] 06-02-PLAN.md -- Executor and reviewer agent dual-mode updates (subagent + teammate)
- [ ] 06-03-PLAN.md -- /mz:go hybrid detection, Agent Teams execution path, ownership hook, help update

### Phase 7: Quality and Debugging Skills
**Goal**: Developers have access to structured thinking tools -- TDD enforcement, brainstorming before coding, systematic debugging, and adaptive task classification that matches approach depth to problem complexity
**Depends on**: Phase 6
**Requirements**: QUAL-02, QUAL-03, QUAL-04, CRTX-01, CRTX-02, CRTX-03, CRTX-04, CRTX-05
**Success Criteria** (what must be TRUE):
  1. When TDD is enabled, the framework enforces RED-GREEN-REFACTOR: tests must fail before implementation begins, pass after, then refactor
  2. Running `/mz:discuss` triggers Socratic brainstorming that explores 3+ alternative approaches before settling on a design
  3. Running `/mz:debug` follows systematic four-phase debugging (reproduce, isolate, root-cause, fix) with observable state transitions
  4. CORTEX task classification (Clear/Complicated/Complex/Chaotic) determines approach depth before non-trivial tasks, with challenge blocks on Complicated+ tasks
  5. Anti-sycophancy is enforced: the framework challenges unsound architecture and unnecessary complexity with evidence-based evaluation, not performative agreement
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md -- Executor agent: TDD protocol, CORTEX classification, challenge blocks, anti-sycophancy, pushback mandate, verification gate, config forwarding
- [ ] 07-02-PLAN.md -- /mz:discuss Socratic brainstorming, /mz:debug systematic debugging, help update

### Phase 8: Brownfield Support and Project Lifecycle
**Goal**: Megazord works for existing codebases (not just greenfield) and supports full project lifecycle management from roadmap through milestones and phase transitions
**Depends on**: Phase 3 (core skills), Phase 5 (verification)
**Requirements**: PROJ-09, PROJ-10
**Success Criteria** (what must be TRUE):
  1. Running `/mz:map` on an existing codebase produces an analysis of architecture, dependencies, patterns, and entry points sufficient to plan work
  2. The full project lifecycle is supported: creating roadmaps with phases, managing milestones, transitioning between phases with verification gates
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md -- /mz:map codebase analysis skill with parallel mapper agents
- [ ] 08-02-PLAN.md -- Lifecycle management libraries (roadmap.ts, milestone.ts) and CLI tools
- [ ] 08-03-PLAN.md -- Skill integration: brownfield /mz:plan, milestone /mz:verify, help update

### Phase 9: Config Consumption Wiring
**Goal**: Configuration settings collected during `/mz:init` actually influence framework behavior — model selection affects agent spawns, workflow toggles gate agent execution
**Depends on**: Phase 2 (config schema), Phase 3 (skills that spawn agents)
**Requirements**: CONF-03, CONF-02
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. Setting `model_profile` to quality/balanced/budget in config causes `/mz:plan`, `/mz:go`, and `/mz:map` to pass the corresponding model parameter to Task tool spawns
  2. Setting `workflow.plan_check` to false in config causes `/mz:plan` to skip the plan-checker agent
  3. Setting `workflow.verifier` to false in config causes the execution pipeline to skip post-phase verification
  4. Dead `ownership.ts` library exports are removed (enforcement works via shell hook)
**Plans**: 3 plans

Plans:
- [ ] 09-01-PLAN.md -- Config schema extension, model resolution function, agent frontmatter, dead code cleanup
- [ ] 09-02-PLAN.md -- Wire model selection and toggle gating into /mz:plan and /mz:map
- [ ] 09-03-PLAN.md -- Wire model selection and toggles into /mz:go, /mz:status, /mz:debug, /mz:verify

### Phase 10: Distribution and Autocomplete Fixes
**Goal**: npm-installed users get full autocomplete for all skills, and the REQUIREMENTS.md traceability table accurately reflects project status
**Depends on**: Phase 1 (package.json, commands/)
**Requirements**: DIST-03
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. `commands/` directory is listed in `package.json` `files` array and included in npm distribution
  2. `commands/debug.md` and `commands/discuss.md` autocomplete proxies exist and follow the established pattern
  3. REQUIREMENTS.md traceability table reflects actual status (20 stale Pending markers updated to Complete)

### Phase 11: Milestone Lifecycle Completion
**Goal**: Users can complete the full milestone lifecycle through skills — from audit through archive — without falling back to CLI commands
**Depends on**: Phase 8 (milestone CLI tools), Phase 5 (verification)
**Requirements**: PROJ-09
**Gap Closure:** Closes gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. A skill-level path exists for milestone creation and archive (not CLI-only)
  2. After `/mz:verify --milestone` audit passes, the user can archive the milestone and prepare for the next version through a guided skill flow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Scaffold and Build Pipeline | 2/2 | Complete | 2026-02-17 |
| 2. Project Initialization and Configuration | 2/2 | Complete | 2026-02-17 |
| 3. Core Skills and State Management | 4/4 | Complete | 2026-02-17 |
| 4. Subagent Execution and Atomic Commits | 2/2 | Complete    | 2026-02-17 |
| 5. Code Review and Verification | 2/2 | Complete | 2026-02-18 |
| 6. Agent Teams Integration | 0/3 | Complete    | 2026-02-18 |
| 7. Quality and Debugging Skills | 0/2 | Complete    | 2026-02-18 |
| 8. Brownfield Support and Project Lifecycle | 1/3 | Complete    | 2026-02-18 |
| 9. Config Consumption Wiring | 1/3 | In Progress|  |
| 10. Distribution and Autocomplete Fixes | 0/0 | Pending | — |
| 11. Milestone Lifecycle Completion | 0/0 | Pending | — |

---
*Roadmap created: 2026-02-17*
*Last updated: 2026-02-19 (gap closure phases 9-11 added)*
