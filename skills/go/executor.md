# Execution Protocol

Reference file for the /mz:go skill. Covers spawning protocol, prompt structure, and execution constraints for both subagent and Agent Teams modes.

## Subagent Spawning Protocol

The /mz:go orchestrator reads agent definitions and plan content, then embeds everything inline in a Task tool prompt. This is required because @file references do NOT work across Task boundaries.

### Model Selection

The orchestrator resolves the executor model via config profile/overrides and updates the agent frontmatter before spawning. Model selection is transparent to the executor agent -- it simply runs on whatever model the orchestrator configured.

### Pre-spawn Checklist

Before spawning an executor subagent, the orchestrator must:

1. **Resolve** agent models via `resolveAgentModel()` using config `model_profile` and `model_overrides`, and update agent `.md` frontmatter `model` fields
2. **Read** `{plugin_path}/agents/mz-executor.md` into memory (where `{plugin_path}` is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`)
3. **Read** the target PLAN.md content (full file including frontmatter)
4. **Read** `megazord.config.json` content
5. If review is enabled: **Read** `{plugin_path}/agents/mz-reviewer.md` into memory
6. **Compose** the Task prompt with all content embedded inline

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

<reviewer_agent>
{Content of agents/mz-reviewer.md -- only included if review_enabled is true}
</reviewer_agent>

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
- Review enabled: {true|false}
- Review mode: {auto|manual} (only present if review_enabled is true)
- TDD enabled: {true|false}
- CORTEX enabled: {true|false}
</execution_rules>
```

## Agent Teams Spawning Protocol

When executing in Agent Teams mode, the orchestrator spawns teammates into an existing team. The prompt structure is extended with teammate-specific fields. Reference `@skills/go/teams.md` for the full lifecycle.

### Pre-spawn Checklist (Teammate)

Before spawning an executor teammate, the orchestrator must:

1. **Create worktree** for the agent via CLI tools
2. **Write** `.mz-agent-context.json` in the worktree directory
3. **Create team** via TeamCreate (once per wave)
4. **Create task** via TaskCreate (one per plan)
5. **Read** all agent definitions and plan content (same as subagent)
6. **Compose** the Task prompt with teammate-specific execution rules

### Executor Teammate Prompt Structure

Same sections as subagent mode, plus additional fields in `<execution_rules>`:

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

<reviewer_agent>
{Content of agents/mz-reviewer.md -- only included if review_enabled is true}
</reviewer_agent>

<execution_rules>
- execution_mode: teammate
- Phase: {phase_number}
- Plan: {plan_number}
- Phase directory: {phase_dir}
- worktree_path: {absolute path to agent's worktree}
- owned_files: {list of files from plan frontmatter files_modified}
- team_lead: mz-lead
- reviewer_name: reviewer-{plan_id} (if review enabled)
- task_id: {task ID from TaskCreate}
- Commit format: {type}({phase}-{plan}): {description}
- Do NOT add Co-Authored-By lines to commits
- Stage files individually (never git add . or git add -A)
- One commit per task, no exceptions
- Create SUMMARY.md at {phase_dir}/{padded}-{plan}-SUMMARY.md
- Do NOT update STATE.md or ROADMAP.md
- Use bun/bunx for all JS/TS operations (never npm/npx)
- Review enabled: {true|false}
- Review mode: {auto|manual} (only present if review_enabled is true)
- TDD enabled: {true|false}
- CORTEX enabled: {true|false}
</execution_rules>
```

The teammate-specific fields (`execution_mode`, `worktree_path`, `owned_files`, `team_lead`, `reviewer_name`, `task_id`) trigger the executor's teammate mode behavior: working within the worktree, respecting file ownership, communicating via SendMessage instead of return values, and claiming tasks via TaskUpdate.

### Reviewer Teammate Prompt Structure

```
<agent_role>
{Full content of agents/mz-reviewer.md}
</agent_role>

<review_rules>
- review_mode_type: teammate
- worktree_paths: {JSON map of agent names to worktree paths}
- team_lead: mz-lead
- Phase: {phase_number}
- Plan scope: {plan numbers in this wave}
- Max review rounds: 3 (initial + 2 re-reviews)
- Escalation: SendMessage to team lead after max rounds
</review_rules>
```

The reviewer's teammate mode activates SendMessage-based feedback loops instead of the nested subagent review-and-return pattern.

## Critical Constraint: @-References

@file references do NOT work across Task tool boundaries. The Task tool spawns a fresh agent session. Any `@path/to/file` in the prompt is treated as literal text, not a file reference.

The orchestrator MUST read all files before spawning and embed content inline. The executor uses the Read tool to access files listed in the plan's `<context>` section.

## Progress Tracking

- **Plan-level progress:** The orchestrator displays wave and plan progress in its output
- **Task-level progress:** Visible in the executor's output (commit messages, verification results)
- **Completion signal (subagent):** The executor returns a structured `## PLAN COMPLETE` message that the orchestrator parses
- **Completion signal (teammate):** The executor sends a `## PLAN COMPLETE` message to the lead via SendMessage, and marks its task as completed via TaskUpdate

## State Update Protocol

Only the orchestrator updates STATE.md and ROADMAP.md. Executors never touch state files.

| Responsibility | Owner | Subagent | Teammate |
|---------------|-------|----------|----------|
| Execute tasks | Executor | Yes | Yes (in worktree) |
| Commit tasks | Executor | Yes | Yes (in worktree) |
| Create SUMMARY.md | Executor | Yes | Yes |
| Claim task via TaskUpdate | Executor | N/A | Yes |
| Merge worktree | Orchestrator | N/A | Yes |
| Advance plan counter | Orchestrator | Yes | Yes |
| Record metrics | Orchestrator | Yes | Yes |
| Add decisions | Orchestrator | Yes | Yes |
| Update session | Orchestrator | Yes | Yes |
| Update ROADMAP.md | Orchestrator | Yes | Yes |
| Manage team lifecycle | Orchestrator | N/A | Yes |

## Failure Handling

### Subagent Mode

If an executor fails (returns without `## PLAN COMPLETE`):

1. The orchestrator saves the error output to `{phase_dir}/{padded}-{plan}-ERROR.md`
2. Other plans in the same wave continue to completion
3. The orchestrator STOPS after the current wave -- no subsequent waves execute
4. STATE.md is updated with the last error
5. The user is directed to run `/mz:go` to resume from the first incomplete plan

### Teammate Mode

If an executor teammate fails:

1. The teammate sends a failure message to the lead via SendMessage
2. The lead logs the failure
3. Other teammates in the wave continue working
4. After the wave, failed plans are NOT merged (no worktree merge for failed plans)
5. The orchestrator STOPS after the current wave
6. Failed worktrees are left intact for inspection

## Parallel Execution

### Subagent Mode

Within a wave, plans with no file conflicts can run in parallel via multiple Task tool calls. Plans with file conflicts are serialized within the wave.

### Teammate Mode

Within a wave, ALL plans run in parallel (each in its own worktree). File conflicts are prevented by worktree isolation -- each agent works on its own branch. The merge step handles integration sequentially.

The orchestrator determines parallelism from the wave computation and conflict analysis performed in Step 3.

## Review Integration

### Subagent Mode

When code review is enabled in config (`quality.review: "auto"` or `"manual"`), the executor performs a review cycle after each task commit.

| Responsibility | Owner |
|---------------|-------|
| Spawn reviewer subagent | Executor |
| Perform two-stage review | Reviewer |
| Write review report | Reviewer |
| Auto-fix critical findings | Executor |
| Re-spawn reviewer after fix | Executor |
| Log unresolved findings | Executor |
| Display review warnings | Orchestrator |

The reviewer agent definition is pre-loaded by the orchestrator and passed to the executor in `<reviewer_agent>` tags. The executor does not need to read it from disk.

### Teammate Mode

When code review is enabled in Agent Teams mode, the reviewer is a peer teammate that communicates via SendMessage:

| Responsibility | Owner |
|---------------|-------|
| Notify reviewer when task is ready | Executor (via SendMessage) |
| Review changes (delta for re-reviews) | Reviewer |
| Send findings to executor | Reviewer (via SendMessage) |
| Fix critical findings and re-commit | Executor |
| Escalate after max rounds | Reviewer (via SendMessage to lead) |
| Log unresolved findings | Lead |
| Display review warnings | Orchestrator (lead) |

Key difference: In teammate mode, the reviewer does NOT modify the implementer's worktree. Minor fixes are noted in the review message for the executor or lead to apply. Structural issues are sent back to the executor via SendMessage for the executor to fix.

### Review Prompt Structure (Subagent Mode)

```
<agent_role>
{Content of agents/mz-reviewer.md}
</agent_role>

<task_definition>
{The specific task block that was just executed}
</task_definition>

<diff>
{git diff HEAD~1 HEAD}
</diff>

<affected_files>
{Full content of modified files -- omit if diff > 300 lines}
</affected_files>

<plan_requirements>
{Requirement IDs from plan frontmatter}
</plan_requirements>

<review_rules>
{Phase, plan, task numbers, report path, severity rules}
</review_rules>
```

### Review Modes

| Config Value | Behavior |
|-------------|----------|
| `"auto"` | Review runs, critical findings auto-fixed, retry up to 3 passes |
| `"manual"` | Review runs, critical findings reported to user (not auto-fixed) |
| `"off"` | No review, one-time notice displayed by orchestrator |

## Quality Integration

### TDD Flag Forwarding

The `tdd_enabled` flag is forwarded from `config.quality.tdd` and controls the executor's TDD Protocol section. When `true`, the executor follows RED-GREEN-REFACTOR for each task with stage banners. When `false` or absent, the TDD Protocol is inactive and the executor uses standard single-commit-per-task behavior.

When TDD is active, the one-commit-per-task rule is overridden: each task produces 2-3 commits (RED test, GREEN implementation, optional REFACTOR cleanup).

### CORTEX Flag Forwarding

The `cortex_enabled` flag is forwarded from `config.quality.cortex` and controls the executor's CORTEX Classification section. When `true`, every task gets a one-line classification (Clear/Complicated/Complex/Chaotic) before execution, with challenge blocks on Complicated+ tasks. When `false` or absent, the CORTEX Classification is inactive and the executor proceeds without classification.

### Config Source

Both flags are read by the orchestrator in Step 2 (Load Context and Validate) and embedded in the `<execution_rules>` block for both subagent and teammate prompt structures. The executor reads them from `<execution_rules>` -- it never reads the config file for these flags.
