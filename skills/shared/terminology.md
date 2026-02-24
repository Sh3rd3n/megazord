---
name: terminology
description: Official terminology glossary for Megazord — every concept has exactly one name.
---

# Terminology

All Megazord skills MUST use these terms consistently. When in doubt, use the official term. Never introduce synonyms.

## Core Workflow Concepts

| Official Term | Definition | Do NOT use |
|---------------|------------|------------|
| **phase** | A major milestone unit containing one or more plans. Phases execute sequentially. | stage (except in "stage banner"), milestone phase, section |
| **plan** | An executable unit within a phase, containing 2-3 tasks. Plans may execute in parallel within a wave. | prompt, spec, blueprint |
| **task** | A single unit of work within a plan. Each task produces one commit. | step (in execution context), action, job, item |
| **wave** | A group of plans that execute in parallel. Waves execute sequentially. | batch, round, tier, group |
| **skill** | A slash-command capability (e.g., /mz:go). | command (when referring to the skill itself), tool, feature |
| **command** | The slash-command string the user types (e.g., `/mz:go`). | skill (when referring to what to type) |

## Execution Concepts

| Official Term | Definition | Do NOT use |
|---------------|------------|------------|
| **execute** | Run plans via /mz:go. | run (acceptable in informal context), deploy, build |
| **verify** | Check phase deliverables via /mz:verify. | validate (acceptable in technical context), check, audit (except milestone audit) |
| **plan** (verb) | Create plans via /mz:plan. | design, architect, spec out |

## State Concepts

| Official Term | Definition | Do NOT use |
|---------------|------------|------------|
| **complete** | A phase/plan/task that has finished successfully. | done, finished, closed |
| **in progress** | Currently being executed. | active (acceptable for "active phase"), running, ongoing |
| **pending** | Not yet started. | queued, waiting, upcoming, future |
| **failed** | Execution encountered an error. | broken, errored, crashed |

## Navigation Concepts

| Official Term | Definition | Do NOT use |
|---------------|------------|------------|
| **Next Up** | The block showing the next action with a copy-paste command. | next step (as a block name), what's next, suggested action |
| **recovery command** | The command suggested after an error. | fix command, resolution, workaround |
| **transition** | The visual indicator when a phase completes. | handoff, switchover |

## Document Concepts

| Official Term | Definition | Do NOT use |
|---------------|------------|------------|
| **roadmap** | ROADMAP.md — the phase listing with goals and requirements. | plan (when referring to the file), overview |
| **summary** | SUMMARY.md — post-execution record of what was built. | report, log, recap |
| **context** | CONTEXT.md — user decisions from /mz:discuss. | notes, decisions file, brainstorm output |

## Usage Notes

- "Step" is acceptable within skill instructions (Step 1, Step 2...) to describe the skill's internal flow. Do NOT use "step" as a synonym for "task" in execution output.
- "Stage" is acceptable only in "stage banner" (the visual header). Do NOT use "stage" as a synonym for "phase".
- "Run" is acceptable in informal contexts ("run /mz:go") but "execute" is preferred in skill output.
- "Validate" is acceptable in technical contexts (validate frontmatter, validate structure) but "verify" is preferred for phase-level checks.
