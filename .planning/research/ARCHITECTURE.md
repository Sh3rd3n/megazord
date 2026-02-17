# Architecture Research

**Domain:** Claude Code Framework (Skills + Agents + Workflows + Agent Teams Orchestration)
**Researched:** 2026-02-17
**Confidence:** MEDIUM (Agent Teams integration is unproven in any framework; all other components are well-documented)

## Standard Architecture

### System Overview

```
                           MEGAZORD ARCHITECTURE
                           =====================

   ┌─────────────────────────────────────────────────────────────────────┐
   │                        USER INTERFACE LAYER                         │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
   │  │ Slash Cmds   │  │ CLAUDE.md    │  │ Settings / Config        │  │
   │  │ /mz init     │  │ Memory +     │  │ .claude/settings.json    │  │
   │  │ /mz plan     │  │ Instructions │  │ megazord.config.json     │  │
   │  │ /mz go ...   │  │              │  │                          │  │
   │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
   │         │                 │                        │                │
   ├─────────┴─────────────────┴────────────────────────┴────────────────┤
   │                      SKILL / WORKFLOW LAYER                         │
   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
   │  │ Project     │  │ Quality    │  │ Execution  │  │ Utility     │  │
   │  │ Skills      │  │ Skills     │  │ Skills     │  │ Skills      │  │
   │  │ (init,plan) │  │ (tdd,      │  │ (go,quick, │  │ (status,    │  │
   │  │             │  │  review,   │  │  debug)    │  │  pause,     │  │
   │  │             │  │  discuss)  │  │            │  │  resume)    │  │
   │  └──────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  │
   │         │               │               │                │         │
   ├─────────┴───────────────┴───────────────┴────────────────┴─────────┤
   │                      ORCHESTRATION LAYER (TypeScript)               │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
   │  │ Team         │  │ State        │  │ Config                   │  │
   │  │ Manager      │  │ Manager      │  │ Manager                  │  │
   │  │ (create,     │  │ (STATE.md,   │  │ (quality settings,       │  │
   │  │  coordinate, │  │  handoff,    │  │  project prefs,          │  │
   │  │  shutdown)   │  │  resume)     │  │  defaults)               │  │
   │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
   │         │                 │                        │                │
   ├─────────┴─────────────────┴────────────────────────┴────────────────┤
   │                      AGENT LAYER                                    │
   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
   │  │ Executor   │  │ Reviewer   │  │ Researcher │  │ Debugger    │  │
   │  │ Agent      │  │ Agent      │  │ Agent      │  │ Agent       │  │
   │  │ (.md def)  │  │ (.md def)  │  │ (.md def)  │  │ (.md def)   │  │
   │  └──────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  │
   │         │               │               │                │         │
   ├─────────┴───────────────┴───────────────┴────────────────┴─────────┤
   │                      COORDINATION LAYER                             │
   │  ┌────────────────────────────────────────────────────────────────┐ │
   │  │  Agent Teams (TeamCreate, SendMessage, TaskList, TaskUpdate)   │ │
   │  │  + Subagent Tool (Task) for fire-and-forget work               │ │
   │  ├────────────────────────────────────────────────────────────────┤ │
   │  │  Hooks: TeammateIdle, TaskCompleted, SubagentStart/Stop, Stop │ │
   │  └────────────────────────────────────────────────────────────────┘ │
   │                                                                     │
   ├─────────────────────────────────────────────────────────────────────┤
   │                      PERSISTENCE LAYER                              │
   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
   │  │ STATE.md │  │ PROJECT  │  │ ROADMAP  │  │ Git Worktrees      │ │
   │  │ (session │  │ .md      │  │ .md      │  │ (parallel          │ │
   │  │  state)  │  │ (spec)   │  │ (phases) │  │  isolation)        │ │
   │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │
   └─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Slash Commands** | User-facing entry points that route to skills | SKILL.md files in `skills/` with frontmatter, invoked via `/mz:command` |
| **Skills (Markdown)** | Procedural knowledge and workflow instructions | SKILL.md files with YAML frontmatter; some with `context: fork`, some inline |
| **Agents (Markdown)** | Specialized subagent definitions with tool restrictions | .md files in `agents/` with frontmatter (name, description, tools, model) |
| **Orchestration (TypeScript)** | State management, team lifecycle, config resolution | TS scripts callable via `Bash` hook or skill `!`command`` injection |
| **Agent Teams** | Multi-agent coordination with messaging | Native Claude Code feature: TeamCreate, SendMessage, TaskList |
| **Subagents (Task tool)** | Fire-and-forget delegation for focused tasks | Built-in Task tool with `subagent_type` referencing agent definitions |
| **Hooks** | Quality gates, lifecycle automation, team enforcement | JSON config in settings.json or hooks/hooks.json; shell scripts |
| **Persistence (Markdown files)** | Cross-session state, project context, phase tracking | STATE.md, PROJECT.md, ROADMAP.md, PHASE-*.md on disk |
| **Config** | User preferences, quality settings, project defaults | megazord.config.json + settings.json for hook/permission config |

## Recommended Project Structure

### Distribution Format: Plugin (not raw npm installer)

**Recommendation:** Distribute Megazord as a Claude Code **plugin**, not a raw npm package that copies files to `~/.claude/`. This is the correct approach because:

1. **Native support.** Claude Code has a first-class plugin system with `.claude-plugin/plugin.json` manifests, namespaced skills, and `/plugin install` commands.
2. **Clean namespacing.** Plugin skills get `mz:` prefix automatically (`/mz:init`, `/mz:plan`, `/mz:go`), preventing conflicts with other frameworks.
3. **Update path.** Plugins support versioning, easy updates, and marketplace distribution.
4. **Component separation.** Plugins natively organize skills/, agents/, hooks/, and .mcp.json without a custom installer script.

**Confidence: HIGH** -- Plugin system is well-documented in official Claude Code docs.

GSD uses a raw npm installer that copies files to `~/.claude/` because the plugin system did not exist when GSD was created. Superpowers ships as a marketplace plugin. Megazord should follow the plugin path from day one.

### Repository Structure

```
megazord/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (name, version, description)
│
├── skills/                      # All slash commands and workflow skills
│   ├── init/
│   │   └── SKILL.md             # /mz:init — project initialization
│   ├── plan/
│   │   └── SKILL.md             # /mz:plan — phase planning
│   ├── go/
│   │   ├── SKILL.md             # /mz:go — execute phase (orchestrates teams)
│   │   └── templates/           # Supporting files for execution
│   │       └── wave-plan.md
│   ├── quick/
│   │   └── SKILL.md             # /mz:quick — fast single-task mode
│   ├── review/
│   │   └── SKILL.md             # /mz:review — two-stage code review
│   ├── debug/
│   │   └── SKILL.md             # /mz:debug — systematic debugging
│   ├── discuss/
│   │   └── SKILL.md             # /mz:discuss — Socratic brainstorming
│   ├── verify/
│   │   └── SKILL.md             # /mz:verify — UAT verification
│   ├── status/
│   │   └── SKILL.md             # /mz:status — project/phase status
│   ├── pause/
│   │   └── SKILL.md             # /mz:pause — context handoff for session end
│   ├── resume/
│   │   └── SKILL.md             # /mz:resume — context restore for session start
│   └── map/
│       └── SKILL.md             # /mz:map — brownfield codebase analysis
│
├── agents/                      # Subagent definitions
│   ├── mz-executor.md           # Implements code with TDD discipline
│   ├── mz-reviewer.md           # Two-stage code review (spec + quality)
│   ├── mz-researcher.md         # Domain research with source verification
│   ├── mz-debugger.md           # Systematic root-cause debugging
│   ├── mz-planner.md            # Phase decomposition and wave planning
│   ├── mz-verifier.md           # UAT and acceptance testing
│   └── mz-mapper.md             # Brownfield codebase analysis
│
├── hooks/
│   └── hooks.json               # Plugin hook definitions
│
├── bin/                         # TypeScript orchestration tools
│   ├── mz-tools.ts              # CLI helper (state management, config, git)
│   └── tsconfig.json
│
├── templates/                   # File templates for project initialization
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── PHASE.md
│   └── STATE.md
│
├── package.json                 # For bun build of TS tools + distribution
├── tsconfig.json
└── README.md
```

### Structure Rationale

- **skills/:** Each skill is a directory with SKILL.md (required) plus optional supporting files. Claude Code discovers these natively. The skill name becomes the slash command after the plugin namespace prefix.
- **agents/:** Subagent definitions as Markdown with YAML frontmatter. Claude Code loads these from the plugin's agents/ directory and makes them available for Task tool delegation.
- **hooks/:** Plugin hooks defined in hooks.json. Used for quality gates (TaskCompleted, TeammateIdle, Stop) and lifecycle automation (SessionStart for context restore).
- **bin/:** TypeScript tooling compiled with bun. Called via `Bash` from skills or hooks. Handles operations that pure Markdown cannot: file manipulation, JSON parsing, git worktree management, state file updates.
- **templates/:** Markdown templates for initialized project files. Skills reference these via relative paths when creating new projects.

## Architectural Patterns

### Pattern 1: Skill-as-Orchestrator

**What:** Skills serve as the primary orchestration layer. A skill's SKILL.md contains the full workflow instructions, references agents by name, and coordinates the overall process. The skill does NOT execute code -- it instructs Claude on what to do.

**When to use:** For every user-facing command. The skill is the entry point; it decides whether to use Agent Teams, subagents, or inline execution.

**Trade-offs:** Keeps orchestration in readable Markdown (easy to understand, modify, distribute). Limited by what prompt instructions can express -- complex conditional logic may need TypeScript helpers.

**Example:**
```yaml
---
name: go
description: Execute the current phase. Creates an Agent Team for parallel implementation with coordinated review.
context: fork
disable-model-invocation: true
---

# Execute Phase

## Step 1: Load Context
Read `.planning/STATE.md` to determine current phase.
Read `.planning/ROADMAP.md` for phase details.
Read the current PHASE-{N}.md for task breakdown.

## Step 2: Determine Execution Strategy
- If phase has 1 task: use subagent (Task tool with mz-executor)
- If phase has 2+ independent tasks: create Agent Team
- If phase has dependent tasks: create Agent Team with task dependencies

## Step 3: Agent Team Execution
Create a team with:
- One mz-executor teammate per independent task
- One mz-reviewer teammate for code review
- Shared TaskList with all phase tasks and dependencies

After all tasks complete:
- mz-reviewer reviews all changes
- If review passes: commit and update STATE.md
- If review fails: send feedback to relevant executor via SendMessage

## Step 4: Update State
Run: `bun ~/.claude/plugins/megazord/bin/mz-tools.ts update-state --phase-complete`
```

### Pattern 2: Hybrid Agent Approach (Teams + Subagents)

**What:** Use Agent Teams when agents need to communicate (executor + reviewer feedback loop, parallel research with synthesis). Use plain subagents (Task tool) when work is fire-and-forget (single research query, quick code generation, file exploration).

**When to use:** Always. This is a core architectural decision, not a situational pattern.

**Trade-offs:** Agent Teams cost significantly more tokens (each teammate is a full Claude instance). Subagents are cheaper but cannot communicate. The skill-as-orchestrator decides which approach based on task complexity.

**Decision matrix:**

| Scenario | Mechanism | Why |
|----------|-----------|-----|
| Single task, no review needed | Subagent (Task) | No coordination overhead |
| Parallel tasks, independent | Agent Team | Shared TaskList for coordination |
| Implementation + review cycle | Agent Team | Reviewer sends feedback to executor via SendMessage |
| Quick research query | Subagent (Explore) | Read-only, result returned to caller |
| Multi-angle research | Agent Team | Researchers share and challenge findings |
| Debugging with hypotheses | Agent Team | Competing hypotheses in parallel |

### Pattern 3: State-on-Disk with TypeScript Helpers

**What:** All project state lives in Markdown files on disk (.planning/ directory). TypeScript helpers in `bin/mz-tools.ts` handle structured operations (parse/update STATE.md, manage config, create worktrees). Skills call these helpers via `!`command`` injection or Bash tool.

**When to use:** For any state mutation that needs to be reliable (updating phase progress, parsing JSON config, git operations).

**Trade-offs:** Adding TypeScript introduces a build step and dependency on bun. But pure Markdown skills cannot reliably parse JSON, manage git worktrees, or handle complex state transitions. The TS layer is deliberately thin -- it is a CLI tool, not an application framework.

**Example:**
```typescript
// bin/mz-tools.ts -- thin CLI helper
import { parseArgs } from "util";

const commands = {
  "update-state": async (args: string[]) => {
    // Read STATE.md, update phase/task status, write back
  },
  "create-worktree": async (args: string[]) => {
    // git worktree add for parallel isolation
  },
  "read-config": async (args: string[]) => {
    // Read megazord.config.json, return as structured output
  },
  "init-project": async (args: string[]) => {
    // Copy templates, create .planning/ structure
  }
};
```

### Pattern 4: Quality Gates via Hooks

**What:** Hooks enforce quality discipline without baking it into agent prompts. `TaskCompleted` hooks run tests before allowing task closure. `TeammateIdle` hooks verify work quality before agents go idle. `Stop` hooks check overall phase completion.

**When to use:** For enforcing TDD, code review, test coverage, and other quality constraints. Hooks are the enforcement mechanism; agent prompts are the instruction mechanism.

**Trade-offs:** Hooks add latency (scripts run before actions complete). But they provide hard guarantees that prompt-only instructions cannot. A prompt saying "run tests" is a suggestion; a `TaskCompleted` hook that fails on test failure is a gate.

**Example hook configuration:**
```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/mz-verify-task.sh"
          }
        ]
      }
    ],
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/mz-check-idle.sh"
          }
        ]
      }
    ]
  }
}
```

## Data Flow

### Primary Flow: Phase Execution (`/mz:go`)

```
User: /mz:go
    │
    ▼
┌──────────────────┐
│  go/SKILL.md     │ ◄── Skill loaded (context: fork, in subagent)
│  reads context   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ STATE.md         │────►│ PHASE-{N}.md     │  Read current phase + tasks
│ (current phase)  │     │ (task breakdown)  │
└──────────────────┘     └────────┬──────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Decision:        │
                         │ Teams or Task?   │
                         └───────┬──────────┘
                        ┌────────┴────────┐
                        ▼                 ▼
              ┌─────────────────┐  ┌──────────────┐
              │  TeamCreate     │  │  Task tool   │
              │  (2+ tasks)     │  │  (1 task)    │
              └────────┬────────┘  └──────┬───────┘
                       │                  │
                       ▼                  │
        ┌──────────────────────┐          │
        │  Shared TaskList     │          │
        │  Task 1: Pending     │          │
        │  Task 2: Pending     │          │
        │  Task 3: Blocked(1)  │          │
        └──────────┬───────────┘          │
                   │                      │
          ┌────────┴────────┐             │
          ▼                 ▼             │
   ┌─────────────┐  ┌─────────────┐      │
   │ mz-executor │  │ mz-executor │      │
   │ Teammate A  │  │ Teammate B  │      │
   │ Claims T1   │  │ Claims T2   │      │
   └──────┬──────┘  └──────┬──────┘      │
          │                │              │
          ▼                ▼              │
   ┌─────────────────────────────┐        │
   │  TaskCompleted hook fires   │        │
   │  (runs tests, blocks if     │        │
   │   tests fail)               │        │
   └──────────┬──────────────────┘        │
              │                           │
              ▼                           │
   ┌─────────────────────┐               │
   │  mz-reviewer        │               │
   │  Teammate           │               │
   │  Reviews all changes│               │
   └──────┬──────────────┘               │
          │                              │
          ├── Pass ──► Commit + Update STATE.md
          │
          └── Fail ──► SendMessage(executor, feedback)
                       ──► Executor revises
                       ──► Re-review cycle
```

### Context Handoff Flow (Cross-Session Persistence)

```
Session N ending:
    │
    ▼
User: /mz:pause
    │
    ▼
┌──────────────────────┐
│  pause/SKILL.md      │
│  Captures:           │
│  - Current phase     │
│  - In-progress tasks │
│  - Open questions    │
│  - Key decisions     │
│  - File locations    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  STATE.md updated    │  ◄── bun mz-tools.ts update-state --pause
│  {                   │
│    phase: 2,         │
│    status: "paused", │
│    tasks: [...],     │
│    context: "..."    │
│  }                   │
└──────────────────────┘

           ═══════════════ Session boundary ═══════════════

Session N+1 starting:
    │
    ▼
User: /mz:resume
    │
    ▼
┌──────────────────────┐
│  resume/SKILL.md     │
│  Reads STATE.md      │
│  Restores context:   │
│  - Where we left off │
│  - What's next       │
│  - Open questions    │
└──────────────────────┘
```

### Key Data Flows

1. **Skill invocation flow:** User types `/mz:go` -> Claude loads SKILL.md -> Skill reads state files -> Skill decides execution strategy -> Creates Agent Team or spawns subagent -> Agents do work -> Hooks enforce quality -> State updated on disk.

2. **Agent communication flow (within Team):** Lead spawns teammates with prompts -> Teammates claim tasks from shared TaskList -> On completion, TaskCompleted hook fires -> mz-reviewer teammate gets notified -> Review result sent via SendMessage -> If rejected, executor receives feedback message -> Executor revises -> Re-review cycle.

3. **Configuration flow:** `megazord.config.json` (project-level quality settings) -> Read by skills at invocation time -> Determines TDD on/off, review mode, brainstorming mode -> Passed to agent prompts and hook behavior.

4. **Git worktree flow:** `/mz:go` on multi-task phase -> `mz-tools.ts create-worktree` creates isolated branch per task -> Each Agent Team teammate works in its own worktree -> On completion, worktrees merged to main branch.

## Scaling Considerations

Megazord's "scale" is not about users -- it is about project complexity, task parallelism, and context window management.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single task (quick mode) | No Team, single subagent or inline execution. Minimal overhead. |
| Small phase (2-3 tasks) | Agent Team with 2-3 executors + 1 reviewer. ~4 Claude instances. |
| Large phase (5+ tasks) | Wave execution: 3-4 executors per wave, reviewer after each wave. Git worktrees for isolation. |
| Multi-phase project | Full state management via STATE.md + ROADMAP.md. Context handoff between sessions. |
| Brownfield codebase | `/mz:map` first to build codebase understanding. Agent memory for persistent knowledge. |

### Scaling Priorities

1. **First bottleneck: Context window saturation.** Long phases with many tasks fill the lead's context. Mitigation: wave execution (do 3 tasks, compact, do 3 more). The `PreCompact` hook can save state before compaction.

2. **Second bottleneck: Token cost.** Agent Teams are expensive (each teammate is a full Claude instance). Mitigation: hybrid approach -- use subagents for simple tasks, Teams only when coordination matters. The skill-as-orchestrator makes this decision per-invocation.

3. **Third bottleneck: File conflicts between teammates.** Two agents editing the same file causes overwrites. Mitigation: git worktree isolation (each teammate gets its own branch/worktree) plus task design that assigns file ownership.

## Anti-Patterns

### Anti-Pattern 1: Everything-in-Agent-Prompt

**What people do:** Put all workflow logic, state management, quality checks, and coordination instructions into the agent's .md system prompt, creating 500+ line agent definitions.

**Why it's wrong:** Agent prompts should define the agent's role and capabilities, not orchestrate workflows. Overloaded prompts lead to instruction-following degradation, are hard to maintain, and cannot be enforced (Claude can ignore prompt instructions).

**Do this instead:** Keep agent definitions focused on role + tools + behavior. Put workflow orchestration in skills. Put enforcement in hooks. A well-designed agent .md should be under 100 lines.

### Anti-Pattern 2: Agent Teams for Everything

**What people do:** Create an Agent Team even for single tasks or sequential work, because "Teams are the core differentiator."

**Why it's wrong:** Agent Teams add coordination overhead and use significantly more tokens. For a single task, a subagent is faster, cheaper, and simpler. For sequential work, the lead can do it directly or use chained subagents.

**Do this instead:** The skill-as-orchestrator pattern decides the execution mechanism based on task count and dependency structure. One task = subagent. Multiple independent tasks = Team. Sequential dependent tasks = chained subagents or lead execution.

### Anti-Pattern 3: TypeScript Doing Too Much

**What people do:** Build a full TypeScript application framework with a CLI, configuration system, plugin loader, and state machine, essentially reimplementing what Claude Code already provides.

**Why it's wrong:** Claude Code already has skills, agents, hooks, plugins, settings, and Agent Teams. A heavy TypeScript layer duplicates these capabilities and adds maintenance burden.

**Do this instead:** TypeScript should be a thin helper layer for operations that Markdown skills cannot do: file parsing, JSON manipulation, git worktree commands, state file updates. It is a CLI tool (`mz-tools.ts`), not an application.

### Anti-Pattern 4: Coupling Skills to Specific Agent Team Topology

**What people do:** Hard-code "create 3 executors named Alice, Bob, Charlie" into skill instructions, making the team structure rigid.

**Why it's wrong:** The optimal team size depends on the phase's task count and complexity. Hard-coded topology cannot adapt.

**Do this instead:** Skills should describe the desired outcome ("execute these N tasks in parallel with review"). Claude Code decides the team size based on the task list. The skill provides constraints ("max 4 executors per wave") not topology.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Git (worktrees, branches, commits) | `mz-tools.ts` via Bash from skills | Core isolation mechanism for parallel work |
| Claude Code Agent Teams API | Native (TeamCreate, SendMessage, TaskList) | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings |
| Claude Code Plugin System | Plugin manifest + directory structure | Distribution and installation |
| npm / bun registry | Package distribution via npm | For installing the plugin itself |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Skills <-> Agents | Skills reference agents by `subagent_type` name in Task tool calls or team spawn prompts | Skills never import agents; they name them |
| Skills <-> TypeScript | Skills call TS via `!`bun mz-tools.ts command`` or Bash tool | One-way: skills invoke TS, TS returns stdout |
| Skills <-> State Files | Skills Read/Write .planning/*.md files directly | State format is defined by templates/ |
| Agents <-> Agents (within Team) | SendMessage (DM or broadcast) + shared TaskList | Only within an active Agent Team |
| Hooks <-> Skills | Hooks enforce what skills instruct | Hooks are in hooks.json, independent of skill content |
| Config <-> Everything | megazord.config.json read by skills and hooks at runtime | Determines quality discipline level |

## Build Order (Dependencies Between Components)

The components have clear dependencies that determine build order:

```
Phase 1: Foundation (no dependencies)
├── Plugin manifest (.claude-plugin/plugin.json)
├── Templates (PROJECT.md, STATE.md, ROADMAP.md, PHASE.md)
├── Config schema (megazord.config.json format)
└── Agent definitions (mz-executor.md, mz-reviewer.md, etc.)

Phase 2: Core Skills (depends on Phase 1)
├── /mz:init (needs templates, config schema)
├── /mz:status (needs STATE.md format)
├── /mz:pause + /mz:resume (needs STATE.md format)
└── /mz:map (needs mz-mapper agent)

Phase 3: TypeScript Tooling (depends on Phase 1)
├── mz-tools.ts: state management commands
├── mz-tools.ts: git worktree commands
├── mz-tools.ts: config management
└── Build pipeline (bun build)

Phase 4: Agent Teams Integration (depends on Phases 1-3)
├── /mz:go with Team execution
├── TaskCompleted hook
├── TeammateIdle hook
├── SendMessage-based review cycle
└── Wave execution logic

Phase 5: Quality Skills (depends on Phase 4)
├── /mz:review (two-stage, uses mz-reviewer agent)
├── /mz:debug (systematic, uses mz-debugger agent)
├── /mz:discuss (Socratic brainstorming)
└── /mz:verify (UAT)

Phase 6: Planning Skills (depends on Phases 2-3)
├── /mz:plan (phase planning with wave decomposition)
├── /mz:quick (fast single-task mode)
└── Quality configuration integration (TDD on/off at runtime)
```

**Build order rationale:**
- **Phase 1 first** because everything else depends on the foundational formats and agent definitions.
- **Phase 2 before Phase 4** because Agent Teams integration needs working state management and basic skills to test against.
- **Phase 3 (TypeScript) before Phase 4** because Team execution needs git worktree management and state updates.
- **Phase 4 (Agent Teams) is the critical path** and the highest-risk component. Building it after solid foundations means we can validate the core differentiator against working infrastructure.
- **Phase 5 (Quality) after Phase 4** because code review and debugging workflows leverage Agent Teams coordination (reviewer sends feedback to executor).
- **Phase 6 (Planning) can partially overlap with Phase 4-5** since planning skills are less dependent on Agent Teams.

## Key Architectural Decision: Plugin vs. npm Installer

| Criterion | Plugin (recommended) | npm Installer (GSD approach) |
|-----------|---------------------|------------------------------|
| **Installation** | `/plugin install megazord` or `--plugin-dir` | `bunx megazord --global` copies files |
| **Namespacing** | Automatic (`/mz:init`) | Manual (risk of conflicts) |
| **Updates** | Plugin version management | Re-run installer |
| **Component discovery** | Native (skills/, agents/, hooks/) | Custom installer logic |
| **TS tooling** | Bundled in plugin, called via Bash | Copied to ~/.claude/bin/ |
| **Hook registration** | hooks/hooks.json in plugin | Must modify user's settings.json |
| **Maintenance** | Plugin API is stable, documented | Custom installer needs ongoing maintenance |

**Decision: Use the plugin system.** The npm package exists only to provide a convenient install command (`bunx megazord` that runs `/plugin install`), not as the distribution mechanism itself.

**Confidence: HIGH** -- Plugin system is official, well-documented, and already used by Superpowers.

## Key Architectural Decision: Agent Teams Lifecycle

Agent Teams are experimental. The lifecycle must be defensive:

1. **Enable check:** Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set before attempting TeamCreate. If not, fall back to subagent-only execution with a warning.
2. **Team creation:** One team per execution. Clean up before starting new work.
3. **Teammate spawning:** Spawn with detailed prompts (teammates don't inherit lead's conversation). Include all relevant file paths, constraints, and expected deliverables.
4. **Task dependencies:** Use TaskList dependencies to prevent blocked tasks from being claimed prematurely.
5. **Graceful degradation:** If Agent Teams fail or are unavailable, every workflow must have a subagent-only fallback path.
6. **Cleanup:** Always shut down teammates before cleaning up team. Lead handles cleanup.

**Confidence: MEDIUM** -- Agent Teams are experimental with known limitations (no session resumption, task status lag, one team per session). Defensive design is essential.

## Sources

- [Claude Code Agent Teams documentation](https://code.claude.com/docs/en/agent-teams) -- HIGH confidence, official docs
- [Claude Code Skills documentation](https://code.claude.com/docs/en/skills) -- HIGH confidence, official docs
- [Claude Code Subagents documentation](https://code.claude.com/docs/en/sub-agents) -- HIGH confidence, official docs
- [Claude Code Plugins documentation](https://code.claude.com/docs/en/plugins) -- HIGH confidence, official docs
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) -- HIGH confidence, official docs
- [Superpowers vs GSD analysis](../../../superpowers-vs-gsd-analysis.md) -- MEDIUM confidence, first-party research
- [GSD npm package](https://www.npmjs.com/package/get-shit-done-cc) -- MEDIUM confidence, community framework
- [Addy Osmani: Claude Code Swarms](https://addyosmani.com/blog/claude-code-agent-teams/) -- MEDIUM confidence, practitioner blog
- [Superpowers GitHub Issues on Agent Teams](https://github.com/obra/superpowers/issues/429) -- LOW confidence, discussion only

---
*Architecture research for: Claude Code framework (Megazord)*
*Researched: 2026-02-17*
