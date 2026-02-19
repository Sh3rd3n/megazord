<p align="center">
  <img src="assets/megazord-hero.svg" alt="Megazord" width="600" />
</p>

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

<!-- Command Reference and Workflow Examples added in Task 2 -->

## License

[MIT](LICENSE) -- use it, fork it, build on it.
