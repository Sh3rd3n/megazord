---
name: help
description: Show all available Megazord skills with descriptions and usage examples
disable-model-invocation: false
---

# Megazord Help

Display the complete skill reference for Megazord.

Reference `@skills/init/design-system.md` for visual output formatting.

Display the stage banner:

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► HELP                           ║
╚═══════════════════════════════════════════════╝
```

## Available Skills

| Skill | Description | Status |
|-------|-------------|--------|
| `/mz:help` | Show this help listing | Available |
| `/mz:init` | Initialize project with config and planning structure | Available |
| `/mz:settings` | View and modify project configuration | Available |
| `/mz:plan` | Plan a phase into tasks with dependencies | Available |
| `/mz:status` | Show project progress and next actions | Available |
| `/mz:pause` | Save context for session handoff | Available |
| `/mz:resume` | Restore context from previous session | Available |
| `/mz:quick` | Run a quick task without project ceremony | Available |
| `/mz:go` | Execute the current phase plan with subagent delegation | Available |
| `/mz:review` | Two-stage code review (spec + quality) | Coming soon |
| `/mz:verify` | Verify phase deliverables match criteria | Coming soon |
| `/mz:debug` | Systematic four-phase debugging | Coming soon |
| `/mz:discuss` | Socratic brainstorming before implementation | Coming soon |
| `/mz:map` | Analyze existing codebase for brownfield support | Coming soon |

## Usage

Run any skill by typing its name as a slash command:

```
/mz:help           Show this listing
/mz:init           Initialize a new Megazord project
/mz:settings       View or modify project configuration
/mz:plan           Plan the next phase into tasks
/mz:status         Check project progress
/mz:status -v      Detailed progress with all phases and metrics
/mz:pause          Save session for later
/mz:resume         Restore and continue from last session
/mz:quick {task}   Run a quick task inline
/mz:go             Execute the current phase plan
/mz:go --dry-run   Preview execution plan without running
/mz:go --from 2    Start from plan 2, skip earlier plans
/mz:go --tasks 1,3 Execute only specific plans
```

Skills marked "Coming soon" are planned for future phases and not yet functional.

## About Megazord

Megazord unifies project management, code quality discipline, and multi-agent coordination into one Claude Code framework.

**Version:** 0.1.0
**Phase:** 4 of 8 (Subagent Execution and Atomic Commits)
