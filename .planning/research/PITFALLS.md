# Pitfalls Research

**Domain:** Claude Code meta-framework (project management + code quality + multi-agent coordination)
**Researched:** 2026-02-17
**Confidence:** HIGH (verified against official docs, GitHub issues, and community reports)

## Critical Pitfalls

### Pitfall 1: Instruction Attenuation — Claude Ignores Your Framework's Rules

**What goes wrong:**
Claude Code wraps CLAUDE.md and skill content inside a `<system-reminder>` tag with a disclaimer: "this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task." As instruction count increases beyond ~150 total instructions (with ~50 consumed by Claude Code's own system prompt), instruction-following quality degrades **uniformly** across all instructions — not just later ones. A framework that loads a project management system, code quality rules, and agent coordination instructions simultaneously will far exceed this threshold.

**Why it happens:**
Megazord combines three frameworks' worth of instructions. GSD alone has 32 workflow files and 11 agents. Superpowers has 14 skills. Loading even a subset of these into context simultaneously pushes well past the ~100-instruction budget available to user directives. The "may or may not be relevant" framing gives Claude permission to selectively ignore instructions, and it takes that permission — especially during multi-step tasks where task completion is prioritized over procedural compliance.

**How to avoid:**
- Keep the root CLAUDE.md under 60 lines (high-performing teams' target) or 300 lines maximum. Only universally-applicable instructions belong there.
- Use Claude Code's skill loading mechanism so instructions are loaded on-demand per workflow, not all at once. Skills are loaded into context only when invoked, not at session start.
- Ruthlessly prune: every instruction competes with every other instruction. Adding a rule reduces compliance with all existing rules.
- Position the most critical rules at the very beginning and very end of any instruction file (LLM attention bias favors peripheries).
- Never duplicate instructions across files — duplication bloats context without improving compliance.
- Test instruction compliance quantitatively: run the same task 5 times and measure how many instructions are actually followed.

**Warning signs:**
- Claude apologizes for not following rules then repeats the same violation next session (documented pattern in GitHub issue #18454).
- Users add increasingly forceful language ("MANDATORY", "DO NOT SKIP") to compensate — this is a symptom, not a fix.
- Framework behavior is inconsistent across sessions — works sometimes, fails other times.

**Phase to address:**
Phase 1 (Core Architecture). The instruction budget is the single most important architectural constraint. Every design decision must be evaluated against "how many context tokens does this consume?"

---

### Pitfall 2: Context Window Exhaustion in Combined Frameworks

**What goes wrong:**
A framework that loads project management state (PROJECT.md, ROADMAP.md, STATE.md), code quality rules (TDD workflow, review checklists), and agent coordination prompts can consume 30-50% of the context window before the user even types their first message. MCP server tool descriptions alone can consume 51K tokens. When the context window fills, Claude Code triggers server-side compaction (automatic summarization), which can drop framework-critical instructions from active context.

**Why it happens:**
Each framework layer wants to be "always available." GSD loads state files at session start. Superpowers wants TDD rules loaded during any coding task. Agent Teams need coordination prompts. The combined cost is multiplicative, not additive, because each layer also generates coordination overhead (status checks, state updates, verification steps). With Opus 4.6's 1M token context window, this is less about hard limits and more about attention degradation — instructions at tokens 400K+ get less attention than those at tokens 1-10K.

**How to avoid:**
- Implement a **context budget system**: measure and cap the total tokens consumed by framework instructions. Target under 15% of context for framework overhead.
- Use lazy loading exclusively: no framework state loads until a specific workflow is invoked. The skill system supports this natively — use it.
- Design state files to be small summaries, not full histories. GSD's STATE.md is a good model: current phase, current task, blocklist — not a log of everything that happened.
- Never load more than one "mode" simultaneously. If the user is in project-planning mode, don't also load code-quality enforcement rules.
- Use the native session memory system (`~/.claude/projects/<hash>/<session>/session-memory/summary.md`) instead of custom state files where possible — Claude already summarizes efficiently.

**Warning signs:**
- Sessions become noticeably slower or less coherent after 20-30 minutes of work.
- Claude starts "forgetting" instructions it followed earlier in the same session.
- Framework state files grow beyond 200 lines.
- The `/compact` command is being used frequently — a sign context is being mismanaged.

**Phase to address:**
Phase 1 (Core Architecture). Context budget must be a first-class architectural concern, not an optimization added later.

---

### Pitfall 3: Agent Teams Are Experimental and Fragile

**What goes wrong:**
Agent Teams is explicitly marked as experimental with known limitations that directly impact a framework building on top of them: no session resumption for in-process teammates, task status can lag (teammates fail to mark tasks complete, blocking dependent tasks), no nested teams (teammates cannot spawn their own teams), one team per session, and the lead is fixed for the team's lifetime. Building a framework that relies on Agent Teams as a core feature means inheriting all these limitations as framework limitations.

**Why it happens:**
Agent Teams was released February 5, 2026 — it is 12 days old as of this research. The feature is behind an experimental flag (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`). The limitations are architectural, not bugs — no session resumption means any framework state maintained by a teammate is lost if the session is interrupted. No nested teams means a framework cannot have hierarchical agent structures (e.g., a project-manager agent that spawns phase-executor agents that each spawn task-worker agents).

**How to avoid:**
- Do NOT make Agent Teams a hard dependency. Design the framework to work with subagents (the stable, non-experimental alternative) as the default, with Agent Teams as an optional upgrade path.
- Implement framework-level state persistence that does not depend on teammate session continuity. If a teammate dies, the framework should be able to respawn it with full context from disk-based state files.
- Use the `TeammateIdle` and `TaskCompleted` hooks for quality gates, but do not rely on them for critical state transitions — they may not fire reliably.
- Design around the "no nested teams" constraint from day one. Use a flat team topology where all agents are peers under one lead, not a hierarchy.
- Implement your own task dependency tracking rather than relying solely on the built-in task list, since task status can lag.

**Warning signs:**
- Framework behavior changes after a Claude Code update (experimental features change without notice).
- Teammates appear to "hang" or stop working without notification.
- The lead starts implementing tasks itself instead of delegating (documented behavior — requires explicit "delegate mode" to prevent).
- Task dependencies appear stuck even though work is complete.

**Phase to address:**
Phase 2 or 3 (not Phase 1). Build the core framework on stable primitives (subagents, skills, hooks) first. Add Agent Teams support only after the foundation is solid and the API has stabilized.

---

### Pitfall 4: File Conflict Hell in Multi-Agent Execution

**What goes wrong:**
When multiple agents (whether Agent Teams teammates, subagents in waves, or parallel Claude Code sessions) work on the same codebase, they can overwrite each other's changes. Two agents editing the same file leads to silent overwrites. Git worktrees help but introduce their own problems: shared databases (SQLite, Docker, etc.), disk space explosion (a 2GB codebase can consume 10GB+ with worktrees and build artifacts), and IDE recognition failures.

**Why it happens:**
Neither GSD's wave execution nor Superpowers' sequential subagents solved this fully. GSD coordinates via files on disk (STATE.md) but two parallel executors can still touch the same file. Agent Teams uses file locking for task claiming but not for file editing. Git worktrees isolate the filesystem but share the same local database, Docker daemon, and cache directories — two agents modifying database state simultaneously creates race conditions.

**How to avoid:**
- Enforce strict file ownership: each agent/task gets a declared set of files it can modify. Verify at the framework level (via hooks) that agents only touch their assigned files.
- Use `PostToolUse` hooks on Write/Edit operations to detect and block unauthorized file modifications.
- For git worktrees: include worktree cleanup as a framework-managed lifecycle step, not something users do manually. Budget for 5x disk space of the base repo.
- Avoid shared mutable state entirely. If agents need to coordinate, use message passing (SendMessage) or append-only log files, not shared files that multiple agents read-write.
- Design task decomposition to minimize file overlap: tasks should own modules/directories, not individual functions scattered across files.

**Warning signs:**
- Test failures that appear "random" (they pass individually but fail when agents run in parallel).
- Git merge conflicts on files that only one agent should have touched.
- Build artifacts from one worktree bleeding into another.
- Disk space warnings during parallel execution.

**Phase to address:**
Phase 2 (Multi-Agent Coordination). This must be solved before any parallel execution features are shipped.

---

### Pitfall 5: Paradigm Collision Between Project Management and Code Quality

**What goes wrong:**
GSD and Superpowers operate at different abstraction levels with conflicting control flows. GSD's `/gsd:execute-phase` spawns executor agents with their own workflow. Superpowers' TDD cycle (brainstorm -> worktree -> plan -> implement -> test -> review) is a different workflow. Running both simultaneously creates confusion: which system is "in charge"? Users who invoke GSD planning and then try to use Superpowers TDD within execution end up with duplicated planning, conflicting commit strategies, and agents that don't know which instructions to follow.

**Why it happens:**
Both frameworks want to be the "outer loop." GSD wraps the entire project lifecycle (phases, milestones, roadmaps). Superpowers wraps the individual task lifecycle (brainstorm, code, test, review). When combined naively, you get a Russian-doll problem: GSD spawns an executor that tries to follow GSD's execution protocol, but the user also wants Superpowers' TDD enforcement inside that executor. The executor now has two conflicting sets of workflow instructions competing for its limited instruction budget (see Pitfall 1).

**How to avoid:**
- Define a clear hierarchy: Megazord's project management layer is the outer loop, code quality enforcement is the inner loop. Never let them compete.
- Create explicit "handoff points" where one system yields control to the other. For example: Megazord's project layer creates the task and its acceptance criteria, then the code quality layer takes over for implementation, then control returns to the project layer for verification.
- Do NOT simply merge GSD and Superpowers instructions. Synthesize a new unified workflow that takes the best of each without redundancy.
- Implement mutual exclusion: when the code quality workflow is active, project management state checks are suspended (and vice versa). Only one "mode" drives behavior at a time.

**Warning signs:**
- Users need to "choose a master" per session (the analysis document already identified this as an issue).
- Duplicate planning artifacts (a GSD phase plan AND a Superpowers task plan for the same work).
- Agents receive contradictory instructions about commit granularity, testing requirements, or review processes.
- The combined framework feels like "two frameworks duct-taped together" rather than one coherent system.

**Phase to address:**
Phase 1 (Core Architecture). The unified workflow model must be designed before any code is written. This is an architecture decision, not an implementation detail.

---

### Pitfall 6: Installation and Distribution Fragility

**What goes wrong:**
GSD distributes via npm and copies files to `~/.claude/`. This creates conflicts: multiple npm installations can overwrite each other's files, Claude Code's own npm installation can conflict with native binary installations, and plugin name collisions across marketplaces cause "flaky installation behavior" (documented in Superpowers issue #355). Users running both GSD and Superpowers can have agent definition files in `~/.claude/agents/` that conflict or create unexpected behavior.

**Why it happens:**
The `~/.claude/` directory is a shared global namespace. Any framework that installs files there is competing with every other framework and with Claude Code itself. The plugin marketplace system has known upstream bugs with name resolution across multiple marketplaces. npm-based distribution has documented issues: multiple installation methods conflict (npm-local at `~/.claude/local` vs native at `~/.local/bin/claude`), permission errors on global prefixes, and auto-update mechanisms that can break installations.

**How to avoid:**
- Distribute as a Claude Code plugin (marketplace), NOT via npm file-copying scripts. Plugins have namespacing (`/megazord:command`) that prevents name collisions.
- Never install files directly into `~/.claude/agents/` or `~/.claude/commands/`. Use the plugin directory structure (`.claude-plugin/plugin.json` + `skills/` + `agents/`).
- Implement an idempotent installer that checks for conflicts before installation: detect existing frameworks (GSD, Superpowers), warn users, and offer clean migration paths.
- Test installation on clean systems, systems with GSD installed, systems with Superpowers installed, and systems with both.
- Use the `--plugin-dir` flag during development for isolation.

**Warning signs:**
- "Works on my machine" reports — installation behavior differs across environments.
- Users report that unrelated frameworks stop working after installing Megazord.
- Global `~/.claude/` directory has files from multiple frameworks with no clear ownership.
- Installation succeeds sometimes and fails other times (the exact symptom from Superpowers #355).

**Phase to address:**
Phase 1 (Core Architecture) for distribution strategy decision. Phase 3+ for actual marketplace publication.

---

### Pitfall 7: State Drift Across Sessions

**What goes wrong:**
Framework state files (project status, phase progress, task assignments) get out of sync with actual repository state. A user completes work in a "quick" Claude Code session without the framework, or manually edits files, or a session crashes mid-execution. The framework's state files now describe a reality that no longer exists. The next session reads stale state and makes incorrect decisions (re-doing completed work, skipping incomplete work, or creating merge conflicts).

**Why it happens:**
State is stored in files on disk (GSD's STATE.md, SUMMARY.md, ROADMAP.md) but actual project state lives in git (commits, branches, file contents). These two sources of truth can diverge whenever work happens outside the framework. Claude Code's session memory system (`~/.claude/projects/<hash>/<session>/session-memory/summary.md`) also stores per-session state, creating a third potential source of truth. Agent Teams store team state in `~/.claude/teams/{team-name}/config.json` and tasks in `~/.claude/tasks/{team-name}/` — a fourth source.

**How to avoid:**
- Use git as the single source of truth. Derive framework state from git state (branches, commits, tags) rather than maintaining a parallel state system.
- If state files are necessary, make them **derivable** — they should be regeneratable from git state at any time. Include a "rebuild state from git" command.
- Implement state validation at session start: compare state files against actual git state and auto-correct discrepancies.
- Design state files as caches, not canonical stores. If they're missing or corrupt, the framework should still function (with a performance penalty for re-derivation).
- Use Claude Code's native session memory for session-specific context, not custom files.

**Warning signs:**
- State files reference branches or commits that don't exist.
- Phase progress shows "complete" but files are actually unchanged.
- Framework suggests re-doing work that's already committed.
- Users feel they need to manually update state files to "fix" the framework.

**Phase to address:**
Phase 1 (Core Architecture) for the state management design. Phase 2 for implementation of state validation and recovery.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Loading all framework instructions at session start | Everything "just works" immediately | Context budget blown, instruction compliance drops to ~60% | Never — lazy loading is mandatory |
| Storing state in custom markdown files alongside code | Easy to read and debug | State drift (Pitfall 7), merge conflicts in state files, pollutes git history | MVP only — must migrate to git-derived state |
| Copying files to `~/.claude/` via npm postinstall | Simple installation | Conflicts with other frameworks, no clean uninstall, no versioning | Never — use plugin marketplace |
| Hardcoding Agent Teams as the execution engine | Access to full team coordination features | Framework breaks when experimental API changes, excludes users without Agent Teams access | Never — abstract behind an interface |
| Putting all workflow logic in a single monolithic SKILL.md | Fewer files to manage | Exceeds instruction budget, can't load selectively, hard to test individual workflows | Never — decompose into focused skills |
| Skipping file ownership enforcement in parallel execution | Faster development, less infrastructure | Silent overwrites, "works alone fails together" bugs (Pitfall 4) | Never — file conflicts are the #1 multi-agent failure mode |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code Plugin System | Placing `skills/` and `agents/` inside `.claude-plugin/` directory | Only `plugin.json` goes inside `.claude-plugin/`. All component directories at plugin root level. |
| Agent Teams Task List | Assuming task status is always current | Task status can lag. Implement framework-level verification that checks actual work output, not just task status. |
| Git Worktrees | Assuming filesystem isolation means full isolation | Worktrees share databases, Docker daemon, cache directories, and ports. Isolate those separately. |
| Claude Code Hooks | Using hooks for critical state transitions | Hooks are best-effort. Use them for quality gates (exit code 2 to reject), not for state management. |
| Session Memory | Fighting Claude's native memory with custom state files | Work with the native `session-memory/summary.md` system. Custom state should complement, not replace. |
| MCP Servers | Loading multiple MCP servers for framework tooling | MCP tool descriptions consume massive context (51K tokens for 4 servers documented). Use the new Tool Search feature to lazy-load. |
| Plugin Marketplaces | Publishing to multiple marketplaces | Name collisions across marketplaces cause flaky installation (Superpowers #355). Pick one marketplace. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full project state at session start | 5-10 second delay before Claude responds, high token usage on first message | Lazy load: only read state files when a framework command is invoked | Projects with >10 phases or >50 tasks |
| Full-repo scans for state validation | Session start takes 30+ seconds, high API costs | Cache validation results, use git status as a proxy, validate incrementally | Repos with >1000 files |
| Spawning Agent Teams for small tasks | $5-20 per simple task, 2-5 minute overhead for team setup | Use subagents for tasks <15 minutes, reserve Agent Teams for genuinely parallel work | Any task that could be done sequentially |
| Recursive state file updates (state update triggers hook that updates state that triggers hook...) | Infinite loops, rapidly filling context window | Implement a "state update lock" — no hooks fire during state writes | Any project with hooks on file writes |
| Git worktree proliferation without cleanup | Disk full errors, 10GB+ for a 2GB repo | Framework-managed worktree lifecycle: create, use, merge, delete. Auto-cleanup on session end. | After 3-5 parallel sessions without cleanup |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Too many slash commands (GSD has 32 workflows) | Users can't remember commands, cognitive overload, feel like learning a new IDE | Maximum 7-10 top-level commands. Use progressive disclosure: `/megazord:start` then contextual suggestions. |
| Requiring project initialization before any work | Users bounce before seeing value (GSD requires `/gsd:new-project` → roadmap → phase planning before any code) | Provide a zero-config quick mode that works immediately. Full project management is opt-in, not required. |
| Verbose framework output in Claude's responses | Framework "ceremony" drowns out actual useful output; users scroll past boilerplate | Framework coordination should be invisible. Only show status when the user asks or something goes wrong. |
| Forcing TDD on every task including trivial ones | 5-minute config change becomes a 20-minute TDD cycle; users disable the framework | Make code quality enforcement proportional to task complexity. Quick tasks get quick checks. |
| Requiring the user to understand the framework's internal concepts (phases, waves, state files) | Steep learning curve, only power users persist | Users should think in terms of their project, not the framework. "Build the auth module" not "execute phase 3 wave 2". |
| Framework errors that blame the user | "You didn't run /megazord:init first" when the user just wanted to ask a question | Graceful degradation: work without initialization, suggest setup when beneficial. |

## "Looks Done But Isn't" Checklist

- [ ] **Plugin installation:** Often missing conflict detection — verify it works alongside GSD, Superpowers, and other frameworks already installed
- [ ] **Instruction compliance:** Often missing quantitative testing — verify by running the same workflow 5 times and checking consistency
- [ ] **Multi-agent file safety:** Often missing cross-agent file write tests — verify by having two agents modify adjacent files simultaneously
- [ ] **State recovery:** Often missing crash recovery — verify by killing a session mid-execution and resuming
- [ ] **Context budget:** Often missing measurement — verify by checking token usage at session start with framework loaded vs without
- [ ] **Git worktree cleanup:** Often missing error path cleanup — verify worktrees are removed when sessions crash (not just when they end gracefully)
- [ ] **Agent Teams fallback:** Often missing graceful degradation — verify the framework works when Agent Teams experimental flag is disabled
- [ ] **Instruction priority:** Often missing edge case testing — verify framework instructions still hold when user gives a contradictory direct instruction

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Instruction attenuation (Pitfall 1) | MEDIUM | Split monolithic instruction files into focused skills. Measure token budget. Cut instructions until compliance returns to >90%. |
| Context exhaustion (Pitfall 2) | LOW | Implement lazy loading. Move from "load everything" to "load on demand." Can be done incrementally per workflow. |
| Agent Teams API change (Pitfall 3) | HIGH | If deeply coupled to Agent Teams internals, may require significant rewrite. Abstraction layer prevents this. |
| File conflicts (Pitfall 4) | HIGH | After data loss, no recovery. Prevention-only. Must be designed in, cannot be retrofitted. |
| Paradigm collision (Pitfall 5) | HIGH | Requires redesigning the unified workflow model. Cannot be patched — the integration design must be rethought. |
| Installation conflicts (Pitfall 6) | LOW | Migrate to plugin distribution. Provide uninstaller that cleans `~/.claude/` of framework files. |
| State drift (Pitfall 7) | MEDIUM | Add "rebuild state from git" command. Implement state validation. Can be added incrementally. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Instruction attenuation | Phase 1 (Architecture) | Measure: total framework tokens < 15% of context. Compliance test: >90% instruction following across 5 runs. |
| Context exhaustion | Phase 1 (Architecture) | Measure: session start token usage with/without framework. Target: <10K tokens framework overhead at start. |
| Agent Teams fragility | Phase 2+ (after stable core) | Test: disable Agent Teams flag. Framework must still function using subagents. |
| File conflicts | Phase 2 (Multi-Agent) | Test: two agents working simultaneously. Zero file overwrites. Zero merge conflicts on owned files. |
| Paradigm collision | Phase 1 (Architecture) | Review: unified workflow document exists. No duplicate planning. No contradictory instructions between layers. |
| Installation conflicts | Phase 1 (Architecture decision), Phase 3+ (implementation) | Test: install on clean system, system with GSD, system with Superpowers, system with both. All succeed. |
| State drift | Phase 1 (Architecture), Phase 2 (implementation) | Test: complete work outside framework, resume. State auto-corrects within one session start. |

## Sources

- [Agent Teams official documentation](https://code.claude.com/docs/en/agent-teams) — limitations section (HIGH confidence)
- [GitHub issue #18454: Claude Code ignores CLAUDE.md and Skills files during multi-step tasks](https://github.com/anthropics/claude-code/issues/18454) (HIGH confidence — first-party bug report)
- [GitHub issue #22309: CLAUDE.md instructions wrapped in "may or may not be relevant" disclaimer](https://github.com/anthropics/claude-code/issues/22309) (HIGH confidence — first-party bug report)
- [Superpowers issue #355: Plugin installation flaky due to name collision](https://github.com/obra/superpowers/issues/355) (HIGH confidence — documented upstream bug)
- [GitHub issue #10280: Multiple installation conflicts npm-local + native binary](https://github.com/anthropics/claude-code/issues/10280) (HIGH confidence)
- [Claude Code MCP context bloat reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734) (MEDIUM confidence — third-party analysis)
- [CLAUDE.md instruction-following best practices](https://www.buildcamp.io/guides/the-ultimate-guide-to-claudemd) (MEDIUM confidence — community guide, verified against official docs)
- [Claude Code plugin creation documentation](https://code.claude.com/docs/en/plugins) (HIGH confidence — official docs)
- [Git worktree limitations for AI agents](https://devcenter.upsun.com/posts/git-worktrees-for-parallel-ai-coding-agents/) (MEDIUM confidence — developer case study)
- [superpowers-vs-gsd-analysis.md](superpowers-vs-gsd-analysis.md) — local analysis document (HIGH confidence — project-specific)

---
*Pitfalls research for: Claude Code meta-framework (Megazord)*
*Researched: 2026-02-17*
