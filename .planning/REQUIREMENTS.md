# Requirements: Megazord

**Defined:** 2026-02-17
**Core Value:** One framework that handles the entire development lifecycle with agents that actually communicate and coordinate

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation & Distribution

- [x] **DIST-01**: Framework distributed as Claude Code plugin with `plugin.json` manifest and namespaced skills (`/mz:command`)
- [x] **DIST-02**: ~12 slash commands available: init, plan, go, status, resume, quick, review, debug, verify, discuss, pause, map
- [x] **DIST-03**: npm fallback installation via `bunx megazord` for environments without plugin marketplace
- [x] **DIST-04**: Plugin coexists safely with other installed frameworks (no conflicts with GSD, Superpowers)
- [x] **DIST-05**: TypeScript orchestration CLI (`mz-tools`) compiled and bundled for state management, git operations, config parsing

### Project Management

- [x] **PROJ-01**: User can initialize a project with `/mz:init` that creates `.planning/` structure (PROJECT.md, STATE.md, config)
- [x] **PROJ-02**: User can create a roadmap with phases, each phase having tasks with completion criteria
- [x] **PROJ-03**: User can plan a specific phase with `/mz:plan` that decomposes work into tasks with dependencies
- [x] **PROJ-04**: User can track project progress with `/mz:status` showing current phase, completed tasks, next actions
- [x] **PROJ-05**: User can pause work with `/mz:pause` creating a context handoff file for session recovery
- [x] **PROJ-06**: User can resume from any previous session with `/mz:resume` restoring full context from STATE.md
- [x] **PROJ-07**: User can execute quick tasks with `/mz:quick` bypassing full project ceremony
- [x] **PROJ-08**: Each completed task produces exactly one atomic git commit with descriptive message
- [ ] **PROJ-09**: User can manage full project lifecycle: roadmap, phases, milestones, phase transitions
- [x] **PROJ-10**: User can analyze existing codebases with `/mz:map` for brownfield project support
- [x] **PROJ-11**: Context management prevents context rot via fresh subagent spawning, dimensioned state files, and lazy loading
- [x] **PROJ-12**: Framework overhead stays under 15% of context window at session start

### Code Quality

- [x] **QUAL-01**: Two-stage code review (spec compliance + code quality) runs automatically when enabled in config
- [x] **QUAL-02**: TDD workflow (RED-GREEN-REFACTOR) enforced when enabled: tests must fail before implementation, pass after, then refactor
- [x] **QUAL-03**: Socratic brainstorming explores 3+ alternative approaches before settling on a design with `/mz:discuss`
- [x] **QUAL-04**: Systematic debugging follows 4-phase methodology (reproduce, isolate, root-cause, fix) with `/mz:debug`
- [x] **QUAL-05**: Quality settings configurable at init time: TDD on/off, review auto/manual/off, brainstorming on/off, debug systematic/quick
- [x] **QUAL-06**: Verification/UAT with `/mz:verify` confirms phase deliverables match acceptance criteria before marking complete
- [x] **QUAL-07**: Quality configuration stored in `megazord.config.json` and respected by all execution workflows

### Adaptive Thinking (CORTEX)

- [x] **CRTX-01**: Task classification (Clear/Complicated/Complex/Chaotic) determines approach depth before any non-trivial task
- [x] **CRTX-02**: Challenge blocks (FAIL/ASSUME/COUNTER/VERDICT) mandatory before implementation on Complicated+ tasks
- [x] **CRTX-03**: Pushback mandate active: framework challenges unsound architecture, unnecessary complexity, sub-optimal choices
- [x] **CRTX-04**: Anti-sycophancy enforced: no performative agreement, only evidence-based evaluation
- [x] **CRTX-05**: Verification gate before completion claims: identify proof, run it, read output, verify, then claim done
- [x] **CRTX-06**: CORTEX configurable at init: on/off like other quality settings

### Multi-Agent Coordination

- [x] **AGNT-01**: Native Agent Teams integration via TeamCreate, SendMessage, shared TaskList for coordinated parallel work
- [x] **AGNT-02**: Graceful degradation to Task tool subagents when Agent Teams is unavailable or disabled
- [x] **AGNT-03**: Hybrid approach: Agent Teams for coordination-heavy work (impl+review cycles), Task tool for fire-and-forget
- [x] **AGNT-04**: Reviewer agent can send code back to specific implementer via SendMessage with actionable feedback
- [x] **AGNT-05**: Git worktree isolation: each parallel teammate gets its own worktree to prevent file conflicts
- [x] **AGNT-06**: Delegate mode: team lead coordinates without implementing, only using spawn/message/shutdown/task tools
- [x] **AGNT-07**: File ownership enforcement: each agent/task has declared files it can modify, violations blocked via hooks
- [x] **AGNT-08**: Wave execution for large phases: batches of parallel tasks with checkpoints between waves

### Workflow Configuration

- [x] **CONF-01**: `/mz:init` collects workflow preferences: mode (YOLO/interactive), depth, parallelization, git tracking
- [x] **CONF-02**: Workflow agents configurable: research before planning, plan verification, post-phase verification
- [x] **CONF-03**: AI model selection for planning agents: quality (Opus), balanced (Sonnet), budget (Haiku)
- [x] **CONF-04**: All settings persistable and modifiable after init

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: GitHub Issues integration for team collaboration (CCPM-style tracking)
- **ADV-02**: Plan approval gates for teammates (read-only plan mode until lead approves)
- **ADV-03**: Adaptive quality gates based on task complexity (auto-escalate quality for complex tasks)
- **ADV-04**: Migration tool to import GSD/Superpowers project state

### Enterprise

- **ENT-01**: Multi-project dashboard across repositories
- **ENT-02**: Token usage tracking and cost estimation per phase
- **ENT-03**: Custom agent definitions (user-defined agent types beyond built-in ones)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Enterprise swarm orchestration | Claude Flow-level complexity not justified. Cap at 6-8 teammates. |
| Desktop app / GUI | CLI-first. Claude Code is terminal-native. |
| Autonomous loop execution | No quality gates. Token burn risk. Ralph Loop territory. |
| Non-Claude AI provider support | Agent Teams is Claude-only. Core differentiator breaks on other platforms. |
| Real-time agent conversation | Agent Teams is async message-passing. Architecture doesn't support it. |
| Backward compatibility with GSD/Superpowers configs | Clean break. Migration guide instead. |
| Memory/RAG layer | Over-engineering. CLAUDE.md + STATE.md + files on disk are sufficient. |
| Plugin marketplace as primary distribution | Limits control. npm primary, marketplace for discovery. |

## Traceability

| Requirement | Phase | Status | Evidence |
|-------------|-------|--------|----------|
| DIST-01 | Phase 1 | Complete | `.claude-plugin/plugin.json` manifest with `name: "mz"`; 14 skills in `skills/` directory; `/mz:` namespace prefix |
| DIST-02 | Phase 3 | Complete | 14 proxy files in `commands/` (debug, discuss, go, help, init, map, pause, plan, quick, resume, review, settings, status, verify) |
| DIST-03 | Phase 10 | Complete | `package.json` `files` array includes `commands`; `src/cli/commands/install.ts` `installFallback()` function; E2E tarball verified (10-01-SUMMARY.md) |
| DIST-04 | Phase 1 | Complete | `.claude-plugin/plugin.json` `name: "mz"` ensures `/mz:` namespace isolation; no path conflicts with GSD (`gsd:`) or Superpowers (`superpowers:`) |
| DIST-05 | Phase 1 | Complete | `bin/megazord.mjs` compiled output; `package.json` `bin.megazord` entry; `tsdown.config.ts` ESM build config |
| PROJ-01 | Phase 2 | Complete | `skills/init/SKILL.md` Step 8a creates `.planning/`; Steps 8b-8d write `megazord.config.json`, `PROJECT.md`, `STATE.md` |
| PROJ-02 | Phase 3 | Complete | `skills/plan/SKILL.md` Step 3 creates ROADMAP.md when missing; Step 6 creates phase plans with dependencies |
| PROJ-03 | Phase 3 | Complete | `skills/plan/SKILL.md` Steps 5-6 spawn researcher and planner agents; planner decomposes into tasks with waves and dependencies |
| PROJ-04 | Phase 3 | Complete | `skills/status/SKILL.md` Steps 4-5 display phase, plan, progress bar, recent phases, config toggles |
| PROJ-05 | Phase 3 | Complete | `skills/pause/SKILL.md` Step 3 stashes via CLI tools; Step 4 updates STATE.md session continuity fields |
| PROJ-06 | Phase 3 | Complete | `skills/resume/SKILL.md` Step 3 restores stash; Steps 4-5 display context, decisions, and resume point |
| PROJ-07 | Phase 3 | Complete | `skills/quick/SKILL.md` Step 5 executes inline; Step 6 applies quality gates; Step 7 atomic commit and tracking |
| PROJ-08 | Phase 4 | Complete | `agents/mz-executor.md` "One commit per task, no exceptions" rule; commit protocol with HEREDOC format |
| PROJ-09 | Phase 11 | Partial | `src/lib/roadmap.ts` phase add/remove/insert; `src/lib/milestone.ts` create/archive -- CLI-only, not yet skill-accessible. Phase 11 needed for `/mz:lifecycle` skill |
| PROJ-10 | Phase 8 | Complete | `skills/map/SKILL.md` spawns parallel mapper agents; `skills/map/mapper.md` analysis methodology; `.planning/codebase/` output |
| PROJ-11 | Phase 3 | Complete | `skills/go/SKILL.md` spawns fresh Task subagent per plan; `src/lib/state.ts` dimensioned state; per-invocation context only in prompts |
| PROJ-12 | Phase 1 | Complete | Phase 1 measurement: 759 chars = 3.7% of context budget; `hooks/hooks.json` PreToolUse only (no SessionStart model invocation) |
| QUAL-01 | Phase 5 | Complete | `skills/review/SKILL.md` two-stage review (spec compliance + code quality); `agents/mz-reviewer.md` reviewer protocol |
| QUAL-02 | Phase 7 | Complete | `agents/mz-executor.md` TDD Protocol section: RED-GREEN-REFACTOR with exemption rules and violation detection |
| QUAL-03 | Phase 7 | Complete | `skills/discuss/SKILL.md` Socratic brainstorming exploring 5+ alternatives; outputs to CONTEXT.md |
| QUAL-04 | Phase 7 | Complete | `skills/debug/SKILL.md` four-phase methodology (reproduce, isolate, root-cause, fix); adapts per issue type |
| QUAL-05 | Phase 2 | Complete | `src/lib/config.ts` `qualitySchema` (tdd, review, brainstorming, cortex, debug); `skills/init/SKILL.md` Step 6 quality customization gate |
| QUAL-06 | Phase 5 | Complete | `skills/verify/SKILL.md` goal-backward verification; `skills/verify/verifier.md` 3-level artifact checking (exists, substantive, wired) |
| QUAL-07 | Phase 2 | Complete | `src/lib/config.ts` `configSchema` single source of truth; `skills/go/SKILL.md` reads `config.quality.*` flags for execution rules |
| CRTX-01 | Phase 7 | Complete | `agents/mz-executor.md` CORTEX Classification section: Clear/Complicated/Complex/Chaotic levels before each task |
| CRTX-02 | Phase 7 | Complete | `agents/mz-executor.md` CORTEX Classification: challenge blocks mandatory on Complicated+ tasks |
| CRTX-03 | Phase 7 | Complete | `agents/mz-executor.md` "Intensity Scales with CORTEX Level" section; pushback enforced via reviewer agent protocol |
| CRTX-04 | Phase 7 | Complete | `agents/mz-reviewer.md` evidence-based evaluation; no performative agreement in review protocol |
| CRTX-05 | Phase 7 | Complete | `agents/mz-executor.md` verification gate: identify proof, run it, read output, verify, then claim done |
| CRTX-06 | Phase 2 | Complete | `src/lib/config.ts` `qualitySchema.cortex` boolean; `skills/init/SKILL.md` Step 6 "CORTEX" toggle (On/Off) |
| AGNT-01 | Phase 6 | Complete | `skills/go/SKILL.md` Step 6 Agent Teams mode: TeamCreate, SendMessage, TaskList for coordinated parallel work |
| AGNT-02 | Phase 4 | Complete | `skills/go/SKILL.md` Step 5 subagent delegation via Task tool; `skills/go/executor.md` fire-and-forget protocol |
| AGNT-03 | Phase 6 | Complete | `skills/go/SKILL.md` hybrid detection: Agent Teams for review cycles, Task tool for independent plans |
| AGNT-04 | Phase 6 | Complete | `skills/go/teams.md` SendMessage for reviewer-to-implementer feedback; delta re-review in teammate mode |
| AGNT-05 | Phase 6 | Complete | `src/lib/worktree.ts` worktree create/remove/merge; `skills/go/SKILL.md` Step 6 worktree isolation per teammate |
| AGNT-06 | Phase 6 | Complete | `skills/go/SKILL.md` delegate mode: lead uses TeamCreate/SendMessage/TaskList only; no direct file modification |
| AGNT-07 | Phase 6 | Complete | `hooks/hooks.json` PreToolUse hook on Edit/Write; `.mz-agent-context.json` ownership enforcement; advisory/strict modes |
| AGNT-08 | Phase 6 | Complete | `src/lib/plan.ts` `computeWaves()` groups plans by wave; `skills/go/SKILL.md` wave-sequential execution with checkpoints |
| CONF-01 | Phase 2 | Complete | `skills/init/SKILL.md` Step 5: mode (5b), depth (5c), git tracking (5d), model profile (5a); Step 4 preset selection |
| CONF-02 | Phase 9 | Complete | `src/lib/config.ts` `workflowSchema` (research, plan_check, verifier); `skills/plan/SKILL.md` Step 5 conditional research |
| CONF-03 | Phase 9 | Complete | `src/lib/config.ts` `resolveAgentModel()` with quality/balanced/budget profiles; `modelOverridesSchema` per-agent overrides |
| CONF-04 | Phase 2 | Complete | `skills/settings/SKILL.md` iterative modification: quality, workflow, model, execution sections; writes to `megazord.config.json` |

**Coverage:**
- v1 requirements: 42 total
- Complete: 41
- Partial: 1 (PROJ-09 -- Phase 11 needed)
- Pending: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-19 -- requirements traceability audit with codebase-verified evidence*
