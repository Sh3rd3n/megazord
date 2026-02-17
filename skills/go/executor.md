# Execution Protocol

Reference file for the /mz:go skill. Covers spawning protocol, prompt structure, and execution constraints.

## Spawning Protocol

The /mz:go orchestrator reads agent definitions and plan content, then embeds everything inline in a Task tool prompt. This is required because @file references do NOT work across Task boundaries.

### Pre-spawn Checklist

Before spawning an executor subagent, the orchestrator must:

1. **Read** `agents/mz-executor.md` into memory
2. **Read** the target PLAN.md content (full file including frontmatter)
3. **Read** `megazord.config.json` content
4. **Compose** the Task prompt with all content embedded inline

### Prompt Structure

The executor receives a prompt with these sections:

```
<agent_role>
{Full content of agents/mz-executor.md}
</agent_role>

<plan>
{Full content of the target PLAN.md file}
</plan>

<config>
{Content of .planning/megazord.config.json}
</config>

<execution_rules>
- Phase: {phase_number}
- Plan: {plan_number}
- Phase directory: {phase_dir}
- Commit format: {type}({phase}-{plan}): {description}
- Do NOT add Co-Authored-By lines to commits
- Stage files individually (never git add . or git add -A)
- One commit per task, no exceptions
- Create SUMMARY.md at {phase_dir}/{padded}-{plan}-SUMMARY.md
- Do NOT update STATE.md or ROADMAP.md
- Use bun/bunx for all JS/TS operations (never npm/npx)
</execution_rules>
```

## Critical Constraint: @-References

@file references do NOT work across Task tool boundaries. The Task tool spawns a fresh agent session. Any `@path/to/file` in the prompt is treated as literal text, not a file reference.

The orchestrator MUST read all files before spawning and embed content inline. The executor uses the Read tool to access files listed in the plan's `<context>` section.

## Progress Tracking

- **Plan-level progress:** The orchestrator displays wave and plan progress in its output
- **Task-level progress:** Visible in the executor subagent's output (commit messages, verification results)
- **Completion signal:** The executor returns a structured `## PLAN COMPLETE` message that the orchestrator parses

## State Update Protocol

Only the orchestrator updates STATE.md and ROADMAP.md. Executors never touch state files.

| Responsibility | Owner |
|---------------|-------|
| Execute tasks | Executor |
| Commit tasks | Executor |
| Create SUMMARY.md | Executor |
| Advance plan counter | Orchestrator |
| Record metrics | Orchestrator |
| Add decisions | Orchestrator |
| Update session | Orchestrator |
| Update ROADMAP.md | Orchestrator |

## Failure Handling

If an executor fails (returns without `## PLAN COMPLETE`):

1. The orchestrator saves the error output to `{phase_dir}/{padded}-{plan}-ERROR.md`
2. Other plans in the same wave continue to completion
3. The orchestrator STOPS after the current wave -- no subsequent waves execute
4. STATE.md is updated with the last error
5. The user is directed to run `/mz:go` to resume from the first incomplete plan

## Parallel Execution

Within a wave, plans with no file conflicts can run in parallel via multiple Task tool calls. Plans with file conflicts are serialized within the wave.

The orchestrator determines parallelism from the wave computation and conflict analysis performed in Step 3.
