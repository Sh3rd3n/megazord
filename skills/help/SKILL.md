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
+===============================================+
|  MEGAZORD > HELP                              |
+===============================================+
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
| `/mz:go` | Execute the current phase plan (subagent or Agent Teams mode) | Available |
| `/mz:review` | Two-stage code review (spec + quality) | Available |
| `/mz:verify` | Verify phase deliverables match criteria | Available |
| `/mz:debug` | Systematic four-phase debugging | Available |
| `/mz:discuss` | Socratic brainstorming before implementation | Available |
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
/mz:go --teams     Force Agent Teams mode (requires experimental flag)
/mz:go --no-teams  Force subagent mode (skip Agent Teams)
/mz:review          Review the latest commit
/mz:review --plan 05-01  Review all changes from a plan
/mz:review --files src/lib/auth.ts  Review specific files
/mz:review --last 3      Review last 3 commits
/mz:verify           Verify current phase deliverables
/mz:verify 5         Verify a specific phase
/mz:verify --partial Verify even with incomplete plans
/mz:discuss {topic}  Brainstorm approaches for a topic
/mz:discuss 7        Brainstorm for phase 7 context
/mz:debug {issue}    Debug an issue systematically
/mz:debug "tests failing in auth module"  Debug with description
```

Skills marked "Coming soon" are planned for future phases and not yet functional.

## About Megazord

Megazord unifies project management, code quality discipline, and multi-agent coordination into one Claude Code framework.

**Version:** 0.1.0
**Phase:** 7 of 8 (Quality and Debugging Skills)
