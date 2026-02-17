# Feature Research

**Domain:** Claude Code development frameworks (workflow discipline, project management, multi-agent coordination)
**Researched:** 2026-02-17
**Confidence:** HIGH (extensive primary source analysis of 8 competing frameworks)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Slash command interface** | Every framework (GSD, Superpowers, CCPM, RIPER-5) delivers via `/command`. Users expect this interaction pattern in Claude Code. | LOW | ~12 commands. Install as Skills with `.md` frontmatter. Claude Code's native mechanism. |
| **Structured planning before execution** | Superpowers, GSD, RIPER-5 all enforce plan-before-code. Users who install a framework want discipline, not freeform prompting. | MEDIUM | Plan should decompose work into tasks with clear completion criteria. GSD uses XML-structured plans; Superpowers uses Markdown with 2-5 min task sizing. |
| **Atomic commits per task** | GSD enforces this. Superpowers does it. Users expect clean git history from a framework that manages execution. Without it, reverting a single change means untangling a monolith commit. | LOW | One commit per completed task. Clear commit messages. Git bisect-friendly. |
| **Context management / anti-context-rot** | GSD's core value proposition. Context rot is the #1 pain point in long Claude Code sessions. Any framework without explicit context management will degrade on multi-hour work. | HIGH | Requires: state files (STATE.md), fresh subagent spawning per task, structured context handoff between sessions, session pause/resume. GSD solves this with dimensioned file structures. |
| **Session pause and resume** | GSD has `/gsd:pause-work` and `/gsd:resume-work`. Users working across days/sessions expect to pick up where they left off with full context. | MEDIUM | Write state to disk on pause. On resume, reconstruct context from STATE.md + ROADMAP.md + recent SUMMARY files. Must handle interrupted mid-task gracefully. |
| **Code review** | Superpowers' two-stage review is its signature. RIPER-5 has a review phase. Even basic frameworks include post-implementation validation. Users expect the framework to catch mistakes before committing. | MEDIUM | At minimum: automated review that checks implementation against spec. Superpowers does two-stage (spec compliance + code quality). Critical issues block progress. |
| **Quick mode for simple tasks** | GSD has `/gsd:quick`. Not every task needs full project ceremony. Users will abandon the framework if fixing a typo requires roadmap creation. | LOW | Bypass planning/roadmap for small, well-defined tasks. Direct execute with minimal overhead. |
| **Subagent execution** | Both GSD and Superpowers spawn subagents via Task tool for parallel/isolated execution. Users expect the framework to leverage Claude Code's native parallelism. | MEDIUM | Fresh context per task (prevents context rot). GSD uses typed agents (executor, verifier). Superpowers uses implementer + reviewer subagents. |
| **Verification / UAT** | GSD has explicit verification step. Superpowers has review. Users expect a "did it actually work?" gate before marking work complete. | MEDIUM | Run tests, check specs, validate behavior. Should be a distinct step, not just "trust the agent." |
| **npm/CLI distribution** | GSD distributes via npm. Users expect `bunx megazord` or similar one-liner install. Plugin marketplace is an option but limits control. | LOW | Install script copies skills/agents/workflows to `~/.claude/`. Include uninstall. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Native Agent Teams integration** | **No existing framework uses Claude Code's Agent Teams** (TeamCreate, SendMessage, shared TaskList). Superpowers has open issues (#429, #469) requesting it. Claude Flow has an open issue (#1098). This is Megazord's primary differentiator. Agents that actually communicate — reviewer sends code back to implementer, agents share discoveries in real-time via SendMessage. | HIGH | Experimental API (must enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`). Known limitations: no session resumption with in-process teammates, task status can lag, one team per session, no nested teams. Must gracefully degrade to Task tool when Teams unavailable. |
| **Hybrid agent approach (Teams + Task tool)** | Not everything needs inter-agent communication. Use Teams for coordination-heavy work (implementation + review cycles, competing hypotheses debugging). Use Task tool for fire-and-forget (quick fixes, isolated research). No framework offers this pragmatic split. | HIGH | Decision logic: "Does this task benefit from agents talking to each other?" YES = Teams, NO = Task. Must be transparent to the user — they shouldn't need to choose. |
| **Configurable quality discipline** | Superpowers forces TDD on everything. GSD has no quality enforcement. Neither lets you configure the quality dial. Megazord lets users set TDD on/off, review auto/manual, brainstorming yes/no at init time. Solo hacker prototyping? TDD off. Production code? Full discipline. | MEDIUM | Quality config stored in project config. Settings: `tdd: on|off`, `review: auto|manual|off`, `brainstorming: on|off`, `debugging: systematic|quick`. Defaults should be opinionated (TDD on, review auto, brainstorming on). |
| **TDD as a first-class workflow** | Superpowers' RED-GREEN-REFACTOR cycle produces 85-95% test coverage. GSD has zero TDD enforcement. Megazord inherits this but makes it configurable. When on, tests must fail before implementation (RED), pass after (GREEN), then clean up (REFACTOR). | MEDIUM | Requires hooks or skill logic to enforce the cycle. Must work with project's existing test framework (auto-detect). Critical: don't just run tests — enforce the RED-GREEN-REFACTOR sequence. |
| **Socratic brainstorming before coding** | Superpowers' brainstorming skill explores alternatives before implementation. Prevents "first idea" syndrome. Most frameworks jump straight to planning. | LOW | Claude asks probing questions, explores 3+ approaches, documents trade-offs before settling on a design. Can be skipped for well-defined tasks. |
| **Systematic debugging with root-cause analysis** | Superpowers' four-phase debugging: (1) reproduce, (2) isolate, (3) root-cause, (4) fix. Prevents "shotgun debugging" where Claude tries random fixes. | MEDIUM | Must enforce the sequence: no fix attempts before root cause is identified. Deviation tracking to prevent wandering. |
| **Project-level lifecycle management** | GSD's roadmap/phases/milestones system for multi-week projects. Superpowers has no project-level structure. | HIGH | Init -> Roadmap -> Phases -> Tasks -> Verify -> Ship. Brownfield support (analyze existing codebase). Milestone tracking. Phase dependencies. |
| **Git worktree isolation** | Claude Squad's core concept. Each parallel workstream gets its own worktree — no branch conflicts, clean isolation. Combined with Agent Teams, each teammate could get its own worktree. | MEDIUM | `git worktree add` for each parallel task/teammate. Clean up worktrees on completion. Must handle merge conflicts on integration. Inspired by Claude Squad, dmux, workmux patterns. |
| **Brownfield / existing codebase support** | GSD has `/gsd:new-milestone` for existing projects. Most frameworks assume greenfield. Brownfield requires codebase analysis, architecture understanding, and incremental approach. | MEDIUM | Codebase mapping (structure, dependencies, patterns), architecture documentation, risk identification. Feed analysis into planning so tasks respect existing patterns. |
| **Delegate mode for team lead** | Claude Code Agent Teams supports delegate mode (Shift+Tab) where the lead only coordinates, never implements. Megazord should integrate this for complex multi-agent work. | LOW | When in delegate mode, lead only uses coordination tools: spawn, message, shutdown, task management. Prevents lead from starting to code when it should be orchestrating. |
| **Plan approval gates for teammates** | Agent Teams supports requiring teammates to plan before implementing (read-only plan mode until lead approves). Useful for risky changes. | LOW | Configurable per-teammate. Lead reviews plan, approves or rejects with feedback. Rejected teammates revise and resubmit. Criteria configurable in prompt. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Enterprise swarm orchestration** | Claude Flow does it. Users may want "maximum agents." | Massive token cost, coordination overhead, debugging nightmare. Claude Flow's complexity is enterprise-grade — overkill for solo devs and small teams. Agent Teams already handles 4-8 agents well. | Cap at 6-8 teammates max. Use Task tool for simple parallelism. Teams for coordination. |
| **Desktop app / GUI** | Auto-Claude has a Kanban board. Visual progress is appealing. | Doubles the codebase (Electron + backend). Maintenance burden. Claude Code is CLI-native — a GUI fights the grain. | Rich terminal output. Status commands (`/mz status`) with clear formatting. Integration with existing tools (GitHub Issues via CCPM pattern) if users want visual tracking. |
| **Autonomous loop execution** | Ralph Loop shows impressive results for batch work. "Launch and walk away" is tempting. | No quality gates. Can burn tokens in infinite loops. No human judgment for design decisions. Ralph Loop's dual-condition exit gate helps but doesn't prevent subtle quality degradation. | Wave execution with checkpoints. Human approval gates between waves. Max iterations as safety net. Never fully unattended for creative/design work. |
| **Support for non-Claude AI providers** | GSD supports OpenCode and Gemini CLI. Wider compatibility seems good. | Agent Teams is Claude Code-only. The core differentiator doesn't work on other platforms. Supporting multiple providers means lowest-common-denominator features. | Claude Code only. Be explicit about this. Users who want Gemini CLI can use GSD. |
| **Backward compatibility with GSD/Superpowers** | Users of existing frameworks want migration, not replacement. | Supporting two config formats, two state structures, two agent patterns adds massive complexity and creates bugs. | Clean break. Provide a migration guide document. Import/convert existing roadmaps on first run if feasible, but don't maintain dual compatibility. |
| **Real-time chat between agents** | Sounds powerful — agents discussing code like developers. | Agent Teams is async message-passing, not conversation. Attempting real-time creates polling loops, token waste, and coordination bugs. The architecture doesn't support it. | Async message-passing (SendMessage). Agents share findings via messages and shared TaskList. This is how Agent Teams actually works. |
| **Plugin marketplace distribution** | Superpowers is on the Anthropic marketplace. Legitimacy signal. | Marketplace limits control over distribution, updates, and dependencies. Can't include executable code (JS/TS) in a pure plugin. Megazord needs TypeScript for orchestration. | npm distribution primary. Consider marketplace listing for discovery, but core install via `bunx megazord`. |
| **Memory/RAG layer** | Claude Flow has RAG integration. Persistent memory across sessions sounds valuable. | Over-engineering for a development framework. Claude Code already has CLAUDE.md for project context and `--continue` for session resumption. A custom RAG layer adds complexity without clear benefit for code tasks. | Use CLAUDE.md for persistent project context. STATE.md for session state. Files on disk for shared knowledge. These are simple, debuggable, and sufficient. |
| **Adaptive quality gates based on correction history** | Some frameworks adjust strictness based on how often Claude gets corrected. Sounds smart. | Creates unpredictable behavior. User doesn't know why review was skipped or enforced. Hard to debug. Premature optimization of a UX that should be explicit. | Explicit quality config set at init. User knows exactly what gates are active. Can change with a command, not automatically. |

## Feature Dependencies

```
[Context Management (STATE.md, handoff)]
    └──requires──> [Session Pause/Resume]
    └──requires──> [Structured Planning]

[Agent Teams Integration (TeamCreate, SendMessage)]
    └──requires──> [Subagent Execution (Task tool fallback)]
    └──enhances──> [Code Review (reviewer messages implementer)]
    └──enhances──> [Systematic Debugging (competing hypotheses)]
    └──enhances──> [Git Worktree Isolation (worktree per teammate)]

[Hybrid Agent Approach (Teams + Task)]
    └──requires──> [Agent Teams Integration]
    └──requires──> [Subagent Execution]

[TDD Workflow (RED-GREEN-REFACTOR)]
    └──enhances──> [Code Review (tests as review evidence)]
    └──enhances──> [Verification/UAT]

[Configurable Quality Settings]
    └──controls──> [TDD Workflow]
    └──controls──> [Code Review]
    └──controls──> [Brainstorming]
    └──controls──> [Systematic Debugging]

[Project Lifecycle Management (roadmap, phases)]
    └──requires──> [Context Management]
    └──requires──> [Structured Planning]
    └──enhances──> [Brownfield Support]

[Quick Mode]
    └──conflicts──> [Full Project Lifecycle (for that task)]
    └──requires──> [Subagent Execution (minimal)]

[Git Worktree Isolation]
    └──enhances──> [Agent Teams Integration (worktree per teammate)]
    └──enhances──> [Subagent Execution (isolated workspace)]

[Brownfield Support]
    └──requires──> [Structured Planning]
    └──enhances──> [Project Lifecycle Management]

[Delegate Mode]
    └──requires──> [Agent Teams Integration]

[Plan Approval Gates]
    └──requires──> [Agent Teams Integration]
```

### Dependency Notes

- **Agent Teams requires Task tool fallback:** Agent Teams is experimental. When unavailable (disabled, wrong plan tier, API changes), the framework MUST degrade gracefully to Task tool-based subagents. This is a hard requirement — the framework cannot break when Teams is unavailable.
- **TDD enhances Code Review:** When TDD is active, the reviewer has test results as evidence. Without TDD, review is opinion-based. The two features are stronger together but work independently.
- **Context Management requires Structured Planning:** You can only manage context across sessions if the work is structured into resumable units (phases, tasks). Freeform work can't be paused and resumed.
- **Quick Mode conflicts with Full Lifecycle:** Quick mode is an escape hatch. It bypasses roadmap/phases for simple tasks. Both exist in the same framework but apply to different situations.
- **Configurable Quality controls 4 features:** Quality config is the master switch. If TDD is off, the TDD skill doesn't activate. If review is off, review subagent doesn't spawn. This must be checked at every execution entry point.
- **Git Worktree enhances Agent Teams:** Each teammate can get its own worktree, preventing file conflicts. Without worktrees, teammates editing the same file cause overwrites (documented Agent Teams limitation).
- **Delegate Mode requires Agent Teams:** Only meaningful when there's a team to delegate to. Must be a no-op or hidden when running in Task-tool-only mode.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept and the Agent Teams differentiator.

- [ ] **Agent Teams prototype** — Validate that TeamCreate/SendMessage/TaskList works reliably for a coordinated implementation+review cycle. This is the core differentiator and the highest-risk feature. Build first, fail fast.
- [ ] **Slash command interface (~12 commands)** — `/mz init`, `/mz plan`, `/mz go`, `/mz status`, `/mz resume`, `/mz quick`, `/mz review`, `/mz debug`, `/mz verify`, `/mz discuss`, `/mz pause`, `/mz map`. Delivered as Claude Code Skills.
- [ ] **Structured planning** — Decompose work into tasks with completion criteria. Support both single-phase (quick) and multi-phase (roadmap) planning.
- [ ] **Context management and pause/resume** — STATE.md, context handoff, resume from any point. Core table stake.
- [ ] **Task tool fallback** — Graceful degradation when Agent Teams is unavailable. Subagent execution via Task tool with typed agents.
- [ ] **Atomic commits** — One commit per task with descriptive messages.
- [ ] **Code review (configurable)** — Two-stage review (spec + quality) when enabled. At minimum spec compliance check.
- [ ] **Quick mode** — Fast path for simple tasks that bypasses full ceremony.
- [ ] **npm distribution** — `bunx megazord` installs everything to `~/.claude/`.
- [ ] **Configurable quality settings** — TDD/review/brainstorming/debug mode set at init.

### Add After Validation (v1.x)

Features to add once Agent Teams integration is proven and core is working.

- [ ] **TDD workflow (RED-GREEN-REFACTOR)** — Add after confirming the review cycle works with Agent Teams. Trigger: users report wanting stronger quality enforcement.
- [ ] **Socratic brainstorming** — Add when users report "first idea" quality issues. Low complexity, high value.
- [ ] **Systematic debugging** — Add when users report "shotgun debugging" from agents. Four-phase methodology.
- [ ] **Git worktree isolation** — Add when parallel Agent Teams work causes file conflicts. Trigger: conflict reports.
- [ ] **Brownfield support** — Add when users try Megazord on existing projects and request codebase analysis.
- [ ] **Delegate mode** — Add when Agent Teams usage matures and users want lead-as-coordinator pattern.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Plan approval gates for teammates** — Useful but adds UX complexity. Defer until users request it.
- [ ] **Wave execution optimization** — GSD's wave system for parallel task batching. Adds complexity to scheduler. Defer until performance matters.
- [ ] **Project lifecycle management (full roadmap/milestones)** — Full GSD-level project management. Defer until single-phase workflow is validated.
- [ ] **GitHub Issues integration** — CCPM-style tracking with GitHub as backend. Defer to v2+ for team collaboration use cases.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Agent Teams integration | HIGH | HIGH | P1 |
| Slash command interface | HIGH | LOW | P1 |
| Structured planning | HIGH | MEDIUM | P1 |
| Context management / pause-resume | HIGH | MEDIUM | P1 |
| Task tool fallback (graceful degradation) | HIGH | MEDIUM | P1 |
| Atomic commits | HIGH | LOW | P1 |
| Code review (configurable) | HIGH | MEDIUM | P1 |
| Quick mode | MEDIUM | LOW | P1 |
| npm distribution | HIGH | LOW | P1 |
| Configurable quality settings | MEDIUM | LOW | P1 |
| TDD workflow | HIGH | MEDIUM | P2 |
| Socratic brainstorming | MEDIUM | LOW | P2 |
| Systematic debugging | MEDIUM | MEDIUM | P2 |
| Git worktree isolation | MEDIUM | MEDIUM | P2 |
| Brownfield support | MEDIUM | MEDIUM | P2 |
| Delegate mode | LOW | LOW | P2 |
| Plan approval gates | LOW | LOW | P3 |
| Wave execution optimization | MEDIUM | HIGH | P3 |
| Full project lifecycle (roadmap/milestones) | MEDIUM | HIGH | P3 |
| GitHub Issues integration | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — validates the differentiator and covers table stakes
- P2: Should have, add when v1 is stable — quality and workflow improvements
- P3: Nice to have, future consideration — advanced features for mature product

## Competitor Feature Analysis

| Feature | Superpowers | GSD | Claude Flow | Claude Squad | CCPM | RIPER-5 | **Megazord** |
|---------|-------------|-----|-------------|--------------|------|---------|-------------|
| Slash commands | 14 skills | 32 workflows | N/A (platform) | N/A (multiplexer) | /pm/* commands | 5 phases | ~12 commands |
| Structured planning | Task-level plans (2-5 min tasks) | Phase-level plans (XML-structured) | Workflow definitions | None | PRD-driven | Plan phase (mode-restricted) | Phase + task-level plans |
| TDD enforcement | RED-GREEN-REFACTOR (mandatory) | None | None | None | None | None | RED-GREEN-REFACTOR (configurable) |
| Code review | Two-stage (spec + quality) | None (verifier only) | None | None | None | Review phase | Two-stage (configurable) |
| Context management | None | STATE.md, SUMMARY.md, fresh agents | Session memory | None | .claude/context/ | Memory bank | STATE.md + fresh agents + handoff |
| Session pause/resume | None | /gsd:pause-work, /gsd:resume-work | Session persistence | None | None | None | /mz pause, /mz resume |
| Agent Teams | None (Issue #429 open) | None | None (Issue #1098 open) | None | None | None | **Native integration** |
| Subagent execution | Task tool (sequential) | Task tool (wave-parallel) | Swarm (distributed) | tmux sessions | Task tool | 3 typed agents | Teams + Task (hybrid) |
| Inter-agent communication | None | Via files on disk | Swarm messaging | None | None | None | **SendMessage (native)** |
| Git worktree isolation | Yes (per task) | None | None | Yes (per session) | Yes (per agent) | None | Yes (per teammate) |
| Brownfield support | None | /gsd:new-milestone | None | N/A | Context analysis | None | /mz map |
| Quick mode | None | /gsd:quick | None | N/A | None | None | /mz quick |
| Brainstorming | Socratic brainstorming skill | None | None | None | None | Innovate phase (optional) | Socratic (configurable) |
| Systematic debugging | 4-phase debugging skill | None | None | None | None | Research phase | 4-phase (configurable) |
| Quality config | None (always on) | None (always off) | None | N/A | None | None | **Init-time configurable** |
| Project lifecycle | None | Full (roadmap, phases, milestones) | Workflow-level | N/A | PRD-driven | None | Phased (v1 basic, v2 full) |
| Distribution | Plugin marketplace | npm package | npm package | Go binary | npm package | Skills (.md) | npm package |
| Autonomy level | Low (interactive) | Medium | High | N/A (multiplexer) | Medium | Low (modal) | Medium (configurable gates) |

### Key Takeaways from Competitor Analysis

1. **Agent Teams is the open gap.** Superpowers (Issue #429), Claude Flow (Issue #1098), and GSD have no integration. Community demand is documented and unmet.
2. **No framework offers configurable quality.** Superpowers is always-on TDD. GSD is always-off. Users have no dial.
3. **Context management + code quality has never been combined.** GSD handles sessions, Superpowers handles code. No single framework does both.
4. **Git worktree + Agent Teams is unexplored.** Claude Squad uses worktrees for manual session isolation. Superpowers uses worktrees per task. Nobody assigns worktrees to Agent Teams teammates.

## Sources

- [Superpowers GitHub repository](https://github.com/obra/superpowers) — PRIMARY, HIGH confidence
- [GSD GitHub repository](https://github.com/glittercowboy/get-shit-done) — PRIMARY, HIGH confidence
- [Claude Code Agent Teams documentation](https://code.claude.com/docs/en/agent-teams) — PRIMARY, HIGH confidence (official Anthropic docs)
- [Superpowers Issue #429: Agent Teams support](https://github.com/obra/superpowers/issues/429) — PRIMARY, HIGH confidence
- [Superpowers Issue #469: Leverage agent teams for parallel execution](https://github.com/obra/superpowers/issues/469) — PRIMARY, HIGH confidence
- [Claude Flow Issue #1098: Agent Teams integration](https://github.com/ruvnet/claude-flow/issues/1098) — PRIMARY, HIGH confidence
- [Claude Flow GitHub repository](https://github.com/ruvnet/claude-flow) — PRIMARY, HIGH confidence
- [Claude Squad GitHub repository](https://github.com/smtg-ai/claude-squad) — PRIMARY, HIGH confidence
- [CCPM GitHub repository](https://github.com/automazeio/ccpm) — PRIMARY, HIGH confidence
- [RIPER-5 GitHub repository](https://github.com/tony/claude-code-riper-5) — PRIMARY, MEDIUM confidence (small community)
- [Auto-Claude GitHub repository](https://github.com/AndyMik90/Auto-Claude) — PRIMARY, MEDIUM confidence
- [Ralph Loop GitHub repository](https://github.com/frankbria/ralph-claude-code) — PRIMARY, MEDIUM confidence
- [Superpowers Complete Guide 2026](https://pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide) — SECONDARY, MEDIUM confidence
- [GSD Framework Guide](https://pasqualepillitteri.it/en/news/169/gsd-framework-claude-code-ai-development) — SECONDARY, MEDIUM confidence
- [Beating context rot with GSD - The New Stack](https://thenewstack.io/beating-the-rot-and-getting-stuff-done/) — SECONDARY, MEDIUM confidence
- [Claude Code Agent Teams blog post](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/) — SECONDARY, MEDIUM confidence
- [dmux - dev agent multiplexer](https://github.com/formkit/dmux) — SECONDARY, MEDIUM confidence
- [Project analysis: superpowers-vs-gsd-analysis.md](../superpowers-vs-gsd-analysis.md) — PROJECT, HIGH confidence

---
*Feature research for: Claude Code development frameworks*
*Researched: 2026-02-17*
