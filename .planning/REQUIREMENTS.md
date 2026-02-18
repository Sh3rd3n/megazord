# Requirements: Megazord

**Defined:** 2026-02-17
**Core Value:** One framework that handles the entire development lifecycle with agents that actually communicate and coordinate

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation & Distribution

- [ ] **DIST-01**: Framework distributed as Claude Code plugin with `plugin.json` manifest and namespaced skills (`/mz:command`)
- [ ] **DIST-02**: ~12 slash commands available: init, plan, go, status, resume, quick, review, debug, verify, discuss, pause, map
- [ ] **DIST-03**: npm fallback installation via `bunx megazord` for environments without plugin marketplace
- [ ] **DIST-04**: Plugin coexists safely with other installed frameworks (no conflicts with GSD, Superpowers)
- [ ] **DIST-05**: TypeScript orchestration CLI (`mz-tools`) compiled and bundled for state management, git operations, config parsing

### Project Management

- [ ] **PROJ-01**: User can initialize a project with `/mz:init` that creates `.planning/` structure (PROJECT.md, STATE.md, config)
- [ ] **PROJ-02**: User can create a roadmap with phases, each phase having tasks with completion criteria
- [ ] **PROJ-03**: User can plan a specific phase with `/mz:plan` that decomposes work into tasks with dependencies
- [ ] **PROJ-04**: User can track project progress with `/mz:status` showing current phase, completed tasks, next actions
- [ ] **PROJ-05**: User can pause work with `/mz:pause` creating a context handoff file for session recovery
- [ ] **PROJ-06**: User can resume from any previous session with `/mz:resume` restoring full context from STATE.md
- [ ] **PROJ-07**: User can execute quick tasks with `/mz:quick` bypassing full project ceremony
- [x] **PROJ-08**: Each completed task produces exactly one atomic git commit with descriptive message
- [ ] **PROJ-09**: User can manage full project lifecycle: roadmap, phases, milestones, phase transitions
- [x] **PROJ-10**: User can analyze existing codebases with `/mz:map` for brownfield project support
- [ ] **PROJ-11**: Context management prevents context rot via fresh subagent spawning, dimensioned state files, and lazy loading
- [ ] **PROJ-12**: Framework overhead stays under 15% of context window at session start

### Code Quality

- [x] **QUAL-01**: Two-stage code review (spec compliance + code quality) runs automatically when enabled in config
- [x] **QUAL-02**: TDD workflow (RED-GREEN-REFACTOR) enforced when enabled: tests must fail before implementation, pass after, then refactor
- [x] **QUAL-03**: Socratic brainstorming explores 3+ alternative approaches before settling on a design with `/mz:discuss`
- [x] **QUAL-04**: Systematic debugging follows 4-phase methodology (reproduce, isolate, root-cause, fix) with `/mz:debug`
- [ ] **QUAL-05**: Quality settings configurable at init time: TDD on/off, review auto/manual/off, brainstorming on/off, debug systematic/quick
- [x] **QUAL-06**: Verification/UAT with `/mz:verify` confirms phase deliverables match acceptance criteria before marking complete
- [ ] **QUAL-07**: Quality configuration stored in `megazord.config.json` and respected by all execution workflows

### Adaptive Thinking (CORTEX)

- [x] **CRTX-01**: Task classification (Clear/Complicated/Complex/Chaotic) determines approach depth before any non-trivial task
- [x] **CRTX-02**: Challenge blocks (FAIL/ASSUME/COUNTER/VERDICT) mandatory before implementation on Complicated+ tasks
- [x] **CRTX-03**: Pushback mandate active: framework challenges unsound architecture, unnecessary complexity, sub-optimal choices
- [x] **CRTX-04**: Anti-sycophancy enforced: no performative agreement, only evidence-based evaluation
- [x] **CRTX-05**: Verification gate before completion claims: identify proof, run it, read output, verify, then claim done
- [ ] **CRTX-06**: CORTEX configurable at init: on/off like other quality settings

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

- [ ] **CONF-01**: `/mz:init` collects workflow preferences: mode (YOLO/interactive), depth, parallelization, git tracking
- [ ] **CONF-02**: Workflow agents configurable: research before planning, plan verification, post-phase verification
- [ ] **CONF-03**: AI model selection for planning agents: quality (Opus), balanced (Sonnet), budget (Haiku)
- [ ] **CONF-04**: All settings persistable and modifiable after init

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

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIST-01 | Phase 1 | Pending |
| DIST-02 | Phase 3 | Pending |
| DIST-03 | Phase 10 | Pending |
| DIST-04 | Phase 1 | Pending |
| DIST-05 | Phase 1 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 3 | Pending |
| PROJ-03 | Phase 3 | Pending |
| PROJ-04 | Phase 3 | Pending |
| PROJ-05 | Phase 3 | Pending |
| PROJ-06 | Phase 3 | Pending |
| PROJ-07 | Phase 3 | Pending |
| PROJ-08 | Phase 4 | Complete |
| PROJ-09 | Phase 11 | Pending |
| PROJ-10 | Phase 8 | Complete |
| PROJ-11 | Phase 3 | Pending |
| PROJ-12 | Phase 1 | Pending |
| QUAL-01 | Phase 5 | Complete |
| QUAL-02 | Phase 7 | Complete |
| QUAL-03 | Phase 7 | Complete |
| QUAL-04 | Phase 7 | Complete |
| QUAL-05 | Phase 2 | Pending |
| QUAL-06 | Phase 5 | Complete |
| QUAL-07 | Phase 2 | Pending |
| CRTX-01 | Phase 7 | Complete |
| CRTX-02 | Phase 7 | Complete |
| CRTX-03 | Phase 7 | Complete |
| CRTX-04 | Phase 7 | Complete |
| CRTX-05 | Phase 7 | Complete |
| CRTX-06 | Phase 2 | Pending |
| AGNT-01 | Phase 6 | Complete |
| AGNT-02 | Phase 4 | Complete |
| AGNT-03 | Phase 6 | Complete |
| AGNT-04 | Phase 6 | Complete |
| AGNT-05 | Phase 6 | Complete |
| AGNT-06 | Phase 6 | Complete |
| AGNT-07 | Phase 6 | Complete |
| AGNT-08 | Phase 6 | Complete |
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 9 | Pending |
| CONF-03 | Phase 9 | Pending |
| CONF-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-19 gap closure phases 9-11 assigned*
