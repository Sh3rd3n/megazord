<h1 align="center">Megazord</h1>

<p align="center">
  <em>One framework for the entire development lifecycle -- with agents that actually talk to each other.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/megazord-cli"><img src="https://img.shields.io/npm/v/megazord-cli?style=flat&colorA=18181B&colorB=28CF8D" alt="npm version"></a>
  <a href="https://github.com/sh3rd3n/megazord/actions"><img src="https://img.shields.io/github/actions/workflow/status/sh3rd3n/megazord/ci.yml?branch=master&label=CI&style=flat&colorA=18181B" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat&colorA=18181B" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D22-green?style=flat&colorA=18181B" alt="Node.js >= 22"></a>
  <a href="https://claude.ai/code"><img src="https://img.shields.io/badge/Claude_Code-Plugin-purple?style=flat&colorA=18181B" alt="Claude Code"></a>
  <img src="https://img.shields.io/badge/Commands-15-orange?style=flat&colorA=18181B" alt="Commands: 15">
</p>

---

Megazord is a Claude Code plugin that turns your development workflow into something that feels coordinated instead of chaotic. It brings project management, code quality, and multi-agent coordination into a single framework -- so you go from idea to shipped code without juggling a dozen tools and hoping nothing falls through the cracks.

What makes it different? Megazord is the first framework built on Claude Code's native Agent Teams. That means your agents don't just get spawned and forgotten -- they actually communicate, hand off context, and build on each other's work. Planning, execution, review, and verification all happen through 15 slash commands that cover the full development lifecycle.

Whether you're starting a greenfield project or bringing structure to an existing codebase, Megazord gives you a clear path from "what should I build?" to "it's built and verified."

## Prerequisites

Before you get started, make sure you have these installed:

- **[Claude Code](https://claude.ai/code)** >= 2.x -- the AI coding assistant that Megazord runs inside. This is home base.
- **[Node.js](https://nodejs.org/)** >= 22 -- the runtime that powers the CLI and installer.
- **[bun](https://bun.sh/)** -- a fast JavaScript package manager. Any recent version works.

## Quickstart

Getting up and running takes about two minutes.

**1. Install Megazord**

```bash
bunx megazord-cli
```

This registers Megazord as a Claude Code plugin. You'll see something like:

```
Megazord v1.0.0
Detected Claude Code at ~/.claude
Installing plugin... done.
Plugin registered. Restart Claude Code to activate.
```

**2. Open Claude Code** in your project directory.

**3. Initialize your project**

```
/mz:init
```

Megazord sets up your planning structure and picks sensible defaults:

```
MEGAZORD v1.0.0
Preset: Balanced
Created .planning/megazord.config.json
Created .planning/ROADMAP.md
Created .planning/PROJECT.md

Ready! Run /mz:plan to start planning your first phase.
```

**4. See what's available**

```
/mz:help
```

This shows all 15 commands grouped by workflow stage -- setup, planning, execution, quality, and utilities. Each one comes with a description and usage example.

From here, you're ready to plan your first phase with `/mz:plan` and start building.

<details>
<summary><strong>Command Reference</strong> -- all 15 <code>/mz:</code> commands</summary>

### Setup

#### `/mz:init`

Initialize a new Megazord project with configuration and planning structure. This is always your first step -- it creates the `.planning/` directory, sets your quality preset, and gives you a starting point for everything else.

**Usage:** `/mz:init`
**When to use:** You just created a new project (or cloned one) and want to bring Megazord into it.

#### `/mz:settings`

View and modify your Megazord project configuration. Quality presets, model selection, workflow toggles -- everything lives here.

**Usage:** `/mz:settings` or `/mz:settings quality.preset strict`
**When to use:** You want to switch from Balanced to Strict mode, toggle TDD on or off, or just see what's currently configured.

#### `/mz:help`

Show all available Megazord commands with descriptions and usage examples. Think of it as this reference table, but inside Claude Code.

**Usage:** `/mz:help`
**When to use:** You can't remember the command name for what you want to do, or you want to see what's available.

### Planning

#### `/mz:plan`

Plan a phase into executable tasks with dependencies and waves. Megazord researches the technical landscape first, then decomposes your phase into concrete tasks that agents can pick up and run.

**Usage:** `/mz:plan` or `/mz:plan 3`
**When to use:** You've defined what a phase should accomplish and you're ready to break it down into work.

#### `/mz:discuss`

Socratic brainstorming to explore approaches before you commit to a direction. Megazord asks probing questions, surfaces tradeoffs, and helps you think through decisions -- without writing any code.

**Usage:** `/mz:discuss "Should we use JWT or session-based auth?"`
**When to use:** You're facing an architectural decision and want to think it through before planning.

#### `/mz:map`

Analyze an existing codebase for brownfield project support. Megazord scans your project structure, dependencies, patterns, and conventions so it understands what you're working with before planning changes.

**Usage:** `/mz:map`
**When to use:** You're adding Megazord to a project that already has code. Run this before `/mz:plan` so planning accounts for what exists.

### Execution

#### `/mz:go`

Execute the current phase plan with subagent delegation. This is where work actually happens -- Megazord spawns specialized agents that pick up tasks, execute them in dependency order, and commit atomically.

**Usage:** `/mz:go`
**When to use:** You have a plan ready (from `/mz:plan`) and you want to start building.

#### `/mz:quick`

Run a quick task without full project ceremony. No planning phase, no formal verification -- just describe what you need and Megazord handles it. Perfect for small, self-contained changes.

**Usage:** `/mz:quick "Add dark mode toggle to settings page"`
**When to use:** The task is small enough that full planning would be overkill. Think bug fixes, UI tweaks, adding a utility function.

### Quality

#### `/mz:review`

Two-stage code review covering both spec compliance and code quality. First it checks whether you built what was planned, then it reviews the code itself for issues, patterns, and improvement opportunities.

**Usage:** `/mz:review`
**When to use:** After `/mz:go` finishes, before you consider the phase done. Catches things verification alone might miss.

#### `/mz:verify`

Verify that phase deliverables actually match your acceptance criteria. This isn't "did tasks complete" -- it's "did we build what we said we'd build." Goal-backward verification that checks outcomes, not just outputs.

**Usage:** `/mz:verify`
**When to use:** After execution completes. Run this to make sure your phase delivered what it promised.

#### `/mz:debug`

Systematic four-phase debugging: reproduce, isolate, root-cause, fix. Instead of guessing at the problem, Megazord walks through it methodically and builds a clear chain from symptom to solution.

**Usage:** `/mz:debug "Users see stale cart totals after adding items"`
**When to use:** You've hit a bug that isn't obvious. Especially useful for issues that span multiple files or involve async behavior.

### Utilities

#### `/mz:status`

Show project progress, current phase, and what to do next. A quick snapshot of where you are in the overall project lifecycle.

**Usage:** `/mz:status`
**When to use:** You just opened Claude Code and want to know where you left off, or you want to check overall progress.

#### `/mz:pause`

Save session context for handoff to a future session. Captures what you were working on, what's done, and what's next -- so the next Claude Code session can pick up seamlessly.

**Usage:** `/mz:pause`
**When to use:** You're done for the day (or stepping away) and want to make sure nothing gets lost between sessions.

#### `/mz:resume`

Restore context from a previous session and continue work. Reads the pause snapshot and reconstructs your working context so you can keep going without re-explaining everything.

**Usage:** `/mz:resume`
**When to use:** You're starting a new Claude Code session and want to pick up where you left off.

#### `/mz:lifecycle`

Complete milestone lifecycle: audit deliverables, archive the milestone, and set up the next version. This is how you close out a major release and transition to the next one.

**Usage:** `/mz:lifecycle`
**When to use:** All phases in the current milestone are done and you're ready to wrap up and start the next version.

</details>

<details>
<summary><strong>Workflow Examples</strong> -- see Megazord in action</summary>

### Greenfield: Build a new project from scratch

> You're starting fresh -- a task management API called "todo-api." Megazord handles the full lifecycle from planning through verification.

```
/mz:init
```
```
MEGAZORD v1.0.0
Preset: Balanced
Created .planning/megazord.config.json
Created .planning/ROADMAP.md
Ready! Run /mz:plan to start planning.
```

```
/mz:plan 1
```
```
MEGAZORD > PLANNING
Researching phase 1...
Created 1-01-PLAN.md (8 tasks, 2 waves)
```

```
/mz:go
```
```
MEGAZORD > EXECUTE
Wave 1: Spawning 3 executor agents...
Task 1.1: Project structure [DONE]
Task 1.2: Database schema [DONE]
Wave 2: Spawning 2 executor agents...
All tasks complete. Run /mz:verify to check deliverables.
```

```
/mz:verify
```
```
MEGAZORD > VERIFY
Checking 4 success criteria...
[PASS] API endpoints respond correctly
[PASS] Database migrations run clean
Verification: PASSED (4/4 criteria met)
```

### Brownfield: Add Megazord to an existing project

> You have an existing SaaS codebase ("my-saas") and want to bring structure to your next round of feature work. Start with `/mz:map` so Megazord understands what's already there.

```
/mz:map
```
```
MEGAZORD > MAPPING
Scanning project structure...
Found: Next.js 15, Prisma, 47 routes, 12 models
Patterns: App Router, server actions, Stripe integration
Map saved to .planning/codebase-map.md
```

```
/mz:plan 1
```
```
MEGAZORD > PLANNING
Using codebase map for context...
Created 1-01-PLAN.md (5 tasks, 2 waves)
Plans account for existing patterns and conventions.
```

```
/mz:go
```
```
MEGAZORD > EXECUTE
Wave 1: Spawning 2 executor agents...
Task 1.1: Add user dashboard route [DONE]
Task 1.2: Extend Prisma schema [DONE]
All tasks complete.
```

### Quick Task: Skip the ceremony

> You need to add a dark mode toggle to "my-app" -- it's small enough that full planning would be overkill.

```
/mz:quick "Add dark mode toggle to settings page"
```
```
MEGAZORD > QUICK
Analyzing task scope...
Creating settings/theme-toggle.tsx
Updating settings/page.tsx
Adding dark mode CSS variables to globals.css
Done. 3 files modified, 1 created.
```

### Debug: Track down a tricky bug

> Users of "checkout-service" are seeing stale cart totals after adding items. Instead of guessing, let Megazord work through it systematically.

```
/mz:debug "Users see stale cart totals after adding items"
```
```
MEGAZORD > DEBUG
Phase 1: Reproducing...
  Found: cart total updates on refresh but not on add
Phase 2: Isolating...
  Narrowed to: useCart hook not invalidating query cache
Phase 3: Root cause...
  Cache key mismatch between addItem mutation and cart query
Phase 4: Fixing...
  Updated mutation to invalidate ['cart', userId] query key
Fix applied and verified. 1 file modified.
```

</details>

## See It in Action

<!-- TODO: Add demo GIF showing Megazord workflow in Claude Code -->
<!-- Record with: screen capture of Claude Code session running /mz:init -> /mz:plan -> /mz:go -->

> Demo coming soon -- in the meantime, install and try it yourself! The quickstart above takes under 2 minutes.

## How It Works

Megazord isn't just a collection of prompts. It's a structured framework with real coordination between specialized agents:

- **15 slash commands** covering the full lifecycle -- from project setup through milestone completion
- **6 specialized agent types** (executor, planner, researcher, reviewer, verifier, mapper) that each handle one job well
- **Native Agent Teams** -- agents coordinate through Claude Code's built-in multi-agent system, not ad-hoc spawning
- **3 quality presets** (strict, balanced, minimal) so you choose the right level of ceremony for your project
- **Separate phases for planning, execution, and verification** -- with clear handoffs between each step, so nothing gets lost

Every command, every agent, every workflow feeds into the same planning structure. Your project state is always consistent, always recoverable, and always moving forward.

## License

[MIT](LICENSE) -- use it, fork it, build on it.
