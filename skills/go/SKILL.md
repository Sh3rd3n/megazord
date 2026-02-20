---
name: go
description: Execute the current phase plan (subagent or Agent Teams mode)
disable-model-invocation: false
---

# /mz:go

Execute the current phase plan by orchestrating executor agents. Supports two execution modes: **subagent delegation** (Task tool, fire-and-forget) and **Agent Teams** (TeamCreate, SendMessage, shared TaskList with real-time coordination). Auto-detects the optimal mode per wave based on plan complexity, with `--teams`/`--no-teams` overrides.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/go/executor.md` for execution protocol and spawning patterns.
Reference `@skills/go/teams.md` for Agent Teams execution protocol.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > EXECUTE                           |
+===============================================+
```

## Step 2: Load Context and Validate

Read `.planning/megazord.config.json`. If missing, display error and stop:

```
+===============================================+
|  X Project Not Initialized                    |
+-----------------------------------------------+
|  No megazord.config.json found.               |
|  Run /mz:init to set up your project first.   |
+===============================================+
```

If config exists, continue loading:
- Read `.planning/STATE.md` for current position.
- Read `.planning/ROADMAP.md` for phase details.

Determine review configuration from the config:
- If `config.quality.review === "auto"`: `review_enabled = true`, `review_mode = "auto"`
- If `config.quality.review === "manual"`: `review_enabled = true`, `review_mode = "manual"`
- If `config.quality.review === "off"`: `review_enabled = false`

If review is disabled, display a one-time notice:
```
> Note: Code review is disabled (quality.review: "off"). Tasks will not be reviewed.
```

Determine TDD configuration:
- If `config.quality.tdd === true`: `tdd_enabled = true`
- Otherwise: `tdd_enabled = false`

Determine CORTEX configuration:
- If `config.quality.cortex === true`: `cortex_enabled = true`
- Otherwise: `cortex_enabled = false`

Display activation notices (same pattern as the review disabled notice):
- If TDD is enabled: `> TDD mode active: RED-GREEN-REFACTOR enforced per task`
- If CORTEX is enabled: `> CORTEX classification active: tasks classified before execution`

If CORTEX is enabled (`cortex_enabled = true`):
- Read `{plugin_path}/skills/cortex/SKILL.md` content using the Read tool.
- This content will be embedded in the executor prompt as a `<cortex_protocol>` block.

Parse the user's message (text after `/mz:go`) for arguments:
- `--tasks N,M` -- execute only specific plan numbers (e.g., `--tasks 1,3`)
- `--from N` -- start from plan N, skip earlier plans (e.g., `--from 2`)
- `--dry-run` -- show execution plan without running
- `--teams` -- force Agent Teams mode (requires experimental flag)
- `--no-teams` -- force subagent mode (skip Agent Teams detection)

Determine the plugin path for CLI commands:
1. Read `plugin_path` from the config JSON.
2. If `plugin_path` is not set in config, try `~/.claude/plugins/mz`. Check if `~/.claude/plugins/mz/bin/megazord.mjs` exists.
3. If neither exists, display error and stop:
   > Plugin path not configured. Run `/mz:settings` and set `plugin_path`, or re-run `/mz:init`.

Load the Agent Teams configuration from config:
- `config.agent_teams.enabled`: `"auto"` (default), `"always"`, or `"never"`
- `config.agent_teams.strict_ownership`: `true` or `false` (default: `false`)

Use the resolved plugin path for all `node {plugin_path}/bin/megazord.mjs` commands below:

```bash
node {plugin_path}/bin/megazord.mjs tools plan list --phase-dir {dir}
```

## Step 3: Find Plans

Determine the current phase from STATE.md position. Compute the phase directory path (e.g., `.planning/phases/04-subagent-execution-and-atomic-commits`).

List all plans:
```bash
node {plugin_path}/bin/megazord.mjs tools plan list --phase-dir {phase_dir}
```

If no plans returned, display error and stop:
```
+===============================================+
|  X No Plans Found                             |
+-----------------------------------------------+
|  No plans found for Phase {N}.                |
|  Run /mz:plan to create plans first.          |
+===============================================+
```

Get incomplete plans:
```bash
node {plugin_path}/bin/megazord.mjs tools plan incomplete --phase-dir {phase_dir}
```

If all plans are complete (empty incomplete list), display info and stop:
```
> Phase Status
  Phase {N}: {Name}
  All plans complete. Run /mz:verify to validate.
```

Compute wave execution order:
```bash
node {plugin_path}/bin/megazord.mjs tools plan waves --phase-dir {phase_dir}
```

Check for file conflicts between plans:
```bash
node {plugin_path}/bin/megazord.mjs tools plan conflicts --phase-dir {phase_dir}
```

Display the execution plan:
```
> Execution Plan
  Phase {N}: {Name}
  Plans: {total} ({incomplete} remaining)
  Waves: {wave_count}

  Wave 1: {plan_list} (parallel/sequential)
  Wave 2: {plan_list}
```

If conflicts are detected, note which plans will be serialized and why.

## Step 4: Apply Execution Filters

If `--tasks N,M` was provided:
- Filter the incomplete plans to only include the specified plan numbers.
- Skip plans not in the list.

If `--from N` was provided:
- Filter to plans with number >= N.
- Verify plans before N have SUMMARY.md files (are completed). If not, warn but continue.

If `--dry-run` was provided:
- Display the execution plan from Step 3 and stop. Do not execute.

If neither flag was provided:
- Execute all incomplete plans (default behavior).

## Step 5: Determine Execution Mode

For each wave, determine whether to use subagents or Agent Teams.

**Detection logic (check in order):**

1. If `--teams` flag provided: mode = `"teams"` (forced)
2. If `--no-teams` flag provided: mode = `"subagents"` (forced)
3. If `config.agent_teams.enabled === "always"`: mode = `"teams"`
4. If `config.agent_teams.enabled === "never"`: mode = `"subagents"`
5. If `config.agent_teams.enabled === "auto"`: auto-detect per wave:
   - For each wave, examine the plans:
     - If review is enabled AND the wave has 2+ plans: mode = `"teams"` (review loops benefit from peer communication)
     - If the wave has plans with inter-plan dependencies (plans in the same wave that depend on each other -- unusual but possible via file overlap): mode = `"teams"`
     - Otherwise: mode = `"subagents"`

Display the chosen mode:
```
> Execution Mode: {Agent Teams | Subagents}
  {Reason: auto-detect / --teams flag / config}
```

**If Agent Teams mode selected, verify availability:**

Check if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment variable is set:
```bash
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
```

If not set or empty: silently fall back to subagents. Display:
```
> Mode: Subagents (Agent Teams not available)
```

## Step 6: Execute Waves

For each wave (waves execute sequentially):

Display: `> Wave {N}`

The execution path depends on the mode determined in Step 5.

---

### Path A: Subagent Execution

This is the existing Task tool delegation path. Used when mode = `"subagents"`.

Determine plan execution order within the wave:
- Parse the conflict analysis from Step 3.
- If no conflicts between plans in this wave: plans can run in parallel (spawn all Task calls).
- If conflicts exist: serialize conflicting plans, parallelize the rest.

For each plan in the wave:

Display: `  * Plan {NN}: {objective from plan file}...`

#### Resolve Models for Agents

Before spawning, determine models for this wave's agents:

1. Read `model_profile` and `model_overrides` from the loaded config.
2. Resolve executor model: check `model_overrides.executor`, fall back to profile mapping (quality->opus, balanced->sonnet, budget->haiku).
3. Update `{plugin_path}/agents/mz-executor.md` frontmatter `model` field to the resolved value.
4. If review is enabled, resolve reviewer model: check `model_overrides.reviewer`, fall back to profile mapping.
5. Update `{plugin_path}/agents/mz-reviewer.md` frontmatter `model` field to the resolved value.

Note: Model resolution is done ONCE per wave (before the first plan spawn), not per-plan.

#### Spawn Executor

1. Read the full PLAN.md content using the Read tool.
2. Read `{plugin_path}/agents/mz-executor.md` content using the Read tool.
3. Read `.planning/megazord.config.json` content using the Read tool.
4. If `review_enabled` is `true`: Read `{plugin_path}/agents/mz-reviewer.md` content using the Read tool.
5. Compose the Task prompt with all content inline, including the CORTEX protocol block if `cortex_enabled` is true (see `@skills/go/executor.md` for prompt structure):

```
<agent_role>
{content of agents/mz-executor.md}
</agent_role>

<plan>
{full content of PLAN.md}
</plan>

<config>
{content of megazord.config.json}
</config>

<reviewer_agent>
{content of agents/mz-reviewer.md -- only included if review_enabled is true}
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

<cortex_protocol>
{Content of skills/cortex/SKILL.md -- only included if cortex_enabled is true}
</cortex_protocol>
```

Note: The `<reviewer_agent>` section is only included when `review_enabled` is `true`. When review is disabled, omit this section entirely to save context budget. The `<cortex_protocol>` section is only included when `cortex_enabled` is `true`.

6. Spawn the executor via the Task tool:
   - `subagent_type`: `"mz-executor"`
   - `description`: `"Execute Plan {phase}-{plan}: {brief objective}"`
   - If spawning with `subagent_type='mz-executor'` fails, fall back to `subagent_type='general-purpose'` with the agent definition embedded inline in `<agent_role>` tags.

7. Wait for completion.

8. Parse the structured result. Look for `## PLAN COMPLETE` in the response to extract:
   - Task count
   - Commit hashes and messages
   - SUMMARY.md path
   - Duration

9. Display result:
```
  > Plan {NN}: {duration}, {N} tasks, {commit_count} commits
```

#### After All Plans in Wave Complete (Subagent Path)

For each completed plan in this wave, update state via CLI tools:

**Advance plan counter:**
```bash
node {plugin_path}/bin/megazord.mjs tools state advance-plan
```

**Record execution metric:**
```bash
node {plugin_path}/bin/megazord.mjs tools state record-metric --phase {phase} --plan {plan} --duration {duration} --tasks {count} --files {count}
```

**Add decisions** (extract key decisions from the plan's SUMMARY.md):
```bash
node {plugin_path}/bin/megazord.mjs tools state add-decision --phase {phase} --decision "{decision text}"
```

**Update session continuity:**
```bash
node {plugin_path}/bin/megazord.mjs tools state update-session --last-session {date} --stopped-at "Completed {phase}-{plan}" --resume-file "{next_plan_path or phase_dir}"
```

#### Failure Handling (Subagent Path)

If a plan FAILS in this wave (executor returns without `## PLAN COMPLETE`):

1. Display failure:
```
  X Plan {NN}: FAILED -- {error description}
```

2. Save the error output:
   Write the error output to `{phase_dir}/{padded}-{plan}-ERROR.md` using the Write tool.

3. Update session with error:
```bash
node {plugin_path}/bin/megazord.mjs tools state update-session --last-error "Plan {NN} failed: {brief error}"
```

4. Wait for other plans in the wave to finish (they may still succeed).

5. STOP after this wave. Do NOT start the next wave.

6. Display:
```
Execution stopped after wave {N} due to failure.
Run /mz:go to resume from the first incomplete plan.
```

---

### Path B: Agent Teams Execution

This is the Agent Teams coordination path. Used when mode = `"teams"`. Reference `@skills/go/teams.md` for the full protocol.

For each wave in Agent Teams mode:

#### 1. Create Worktrees

For each plan in the wave, create an isolated worktree:
```bash
node {plugin_path}/bin/megazord.mjs tools worktree create --team {team_name} --agent exec-{plan_id}
```

Team name format: `mz-{phase}-w{wave}` (e.g., `mz-06-w1`).

#### 2. Generate Ownership Manifest

Read each plan's `files_modified` frontmatter. Build the ownership manifest mapping each agent name to its declared files. Write to a temporary file that the hook can read:

```json
{
  "exec-06-01": ["src/lib/worktree.ts", "src/cli/commands/worktree-tools.ts"],
  "exec-06-02": ["agents/mz-executor.md", "agents/mz-reviewer.md"]
}
```

#### 3. Write Agent Context Files

For each worktree, write `.mz-agent-context.json` inside the worktree directory:
```json
{
  "agent_name": "exec-{plan_id}",
  "team_name": "{team_name}",
  "team_lead": "mz-lead",
  "owned_files": ["file1.ts", "file2.ts"],
  "strict_ownership": false
}
```

The `strict_ownership` field reflects `config.agent_teams.strict_ownership`. This file is read by the ownership enforcement hook (since environment variables cannot be set for teammates).

#### 4. Create Team

```
TeamCreate({ team_name: "{team_name}", description: "Phase {N} Wave {W}" })
```

#### 5. Create Tasks

For each plan in the wave, create a task:
```
TaskCreate({
  subject: "Execute Plan {NN}: {objective}",
  description: "{full plan content with execution rules}",
  activeForm: "Executing Plan {NN}"
})
```

#### 6. Resolve Models for Teammates

Before spawning, determine models for this wave's agents:

1. Resolve executor model and update `{plugin_path}/agents/mz-executor.md` frontmatter `model` field based on config profile/overrides.
2. If review is enabled, resolve reviewer model and update `{plugin_path}/agents/mz-reviewer.md` frontmatter `model` field.

#### 7. Spawn Teammates

For each plan, spawn an executor teammate. If review is enabled, also spawn a reviewer teammate.

1. Read agent definitions (`{plugin_path}/agents/mz-executor.md`, `{plugin_path}/agents/mz-reviewer.md`) and embed inline.
2. Spawn executor teammate via Task tool with `subagent_type="mz-executor"` and `team_name` parameter. If named subagent spawning does not work for teammates, use `"general-purpose"` with inline embedding as fallback.

```
Task({
  description: "<agent_role>{mz-executor.md content}</agent_role>
<plan>{PLAN.md content}</plan>
<config>{megazord.config.json}</config>
<reviewer_agent>{mz-reviewer.md content -- if review enabled}</reviewer_agent>
<execution_rules>
- execution_mode: teammate
- Phase: {phase_number}
- Plan: {plan_number}
- Phase directory: {phase_dir}
- worktree_path: {worktree_path}
- owned_files: {file list from plan frontmatter}
- team_lead: mz-lead
- reviewer_name: reviewer-{plan_id} (if review enabled)
- task_id: {task_id from TaskCreate}
- Commit format: {type}({phase}-{plan}): {description}
- Do NOT add Co-Authored-By lines to commits
- Stage files individually (never git add . or git add -A)
- One commit per task, no exceptions
- Create SUMMARY.md at {phase_dir}/{padded}-{plan}-SUMMARY.md
- Do NOT update STATE.md or ROADMAP.md
- Use bun/bunx for all JS/TS operations (never npm/npx)
- Review enabled: {true|false}
- Review mode: {auto|manual}
- TDD enabled: {true|false}
- CORTEX enabled: {true|false}
</execution_rules>

<cortex_protocol>
{Content of skills/cortex/SKILL.md -- only included if cortex_enabled is true}
</cortex_protocol>",
  team_name: "{team_name}",
  name: "exec-{plan_id}"
})
```

3. If review is enabled, spawn reviewer teammate with `subagent_type="mz-reviewer"`. If named subagent spawning does not work for teammates, use `"general-purpose"` with inline embedding as fallback:

```
Task({
  description: "<agent_role>{mz-reviewer.md content}</agent_role>
<review_rules>
- review_mode_type: teammate
- worktree_paths: {map of agent names to worktree paths}
- team_lead: mz-lead
- Phase: {phase_number}
- Plan scope: {plan numbers in this wave}
</review_rules>",
  team_name: "{team_name}",
  name: "reviewer-{plan_id}"
})
```

**IMPORTANT:** Spawn ALL teammates before entering coordination mode. Do NOT use API-level `permissionMode: "delegate"` -- this causes a known bug where teammates lose file system tools. Enforce delegate behavior through instructions only.

#### 8. Coordinate (Delegate Mode)

After spawning, the lead enters coordination-only mode:
- **You are the team LEAD. You NEVER implement directly.**
- Your tools: TeamCreate, TaskCreate, TaskUpdate, TaskList, SendMessage, TeamDelete
- Do NOT use Edit, Write, or Bash for implementation work.
- Monitor via TaskList for task completion.
- Messages from teammates arrive automatically.
- If a reviewer escalates (max rounds reached), log the escalation.
- If an executor reports failure, save error output.
- Wait until all tasks in the wave are completed or failed.

#### 9. Merge Worktrees

After all tasks complete, merge worktrees sequentially in plan order:

For each completed plan:
```bash
node {plugin_path}/bin/megazord.mjs tools worktree merge --team {team_name} --agent exec-{plan_id} --strategy merge
```

If merge fails (conflicts): stop the wave, leave worktree for inspection, log the conflict.

#### 10. Shutdown Teammates

For each teammate:
```
SendMessage({ type: "shutdown_request", recipient: "{name}", content: "Wave complete" })
```
Wait for responses (timeout 60s, proceed anyway if no response).

#### 11. Cleanup

```bash
node {plugin_path}/bin/megazord.mjs tools worktree prune --team {team_name}
```

Then `TeamDelete()` to remove team resources.

#### 12. Update State

Same as subagent path: advance plan counter, record metrics, add decisions, update session for each completed plan in the wave.

#### 13. Silent Fallback

If ANY of steps 1-7 fail (TeamCreate fails, worktree creation fails, API error), catch the error and fall back to subagent execution (Path A) for this wave:

```
[TEAMS FALLBACK] {reason}. Using subagent mode for wave {N}.
```

This is logged but does not prompt the user. Execution continues normally via the subagent path.

---

## Step 7: Update Roadmap

After all waves complete (or after stopping due to failure):

- Read each completed plan's SUMMARY.md to verify it exists.
- In ROADMAP.md, update the plan checkboxes for completed plans:
  - Change `- [ ]` to `- [x]` for plans that now have SUMMARY.md files.
- Update the Progress table row for this phase with the current plan completion count.

## Step 8: Check for Unresolved Review Findings

After all waves complete, check each completed plan's SUMMARY.md for "Unresolved Review Findings". If any plan mentions unresolved review findings, display a warning:

```
> Warning: Some tasks have unresolved review findings.
  Run /mz:review for manual review, or check the SUMMARY.md files for details.
```

## Step 9: Post-Execution Summary

Display summary using the design system action box:

```
+===============================================+
|  Execution Complete                           |
+-----------------------------------------------+
|  Phase {N}: {Name}                            |
|  Mode: {Subagents | Agent Teams | Mixed}      |
|  Plans: {completed}/{total}                   |
|  Commits: {total_commits}                     |
|  Duration: {total_time}                       |
|                                               |
|  Wave 1 [Subagents]: Plan 01 ({time})         |
|  Wave 2 [Agent Teams]: Plan 02 ({time}),      |
|         Plan 03 ({time})                       |
+===============================================+
```

Display the Next Up block. Determine verifier suggestion based on config:

- If all plans complete AND `config.workflow.verifier` is true:
```
===============================================
> Next Up
**Verify Phase {N}** -- validate deliverables
`/mz:verify`
===============================================
```

- If all plans complete AND `config.workflow.verifier` is false:
```
===============================================
> Next Up
**Phase {N} execution complete.** Verifier is disabled in config.
Run `/mz:plan` to advance to next phase, or `/mz:verify` to verify manually.
===============================================
```

**IMPORTANT:** The `/mz:verify` skill itself is NEVER gated. It always works when manually invoked. Only the automated suggestion in /mz:go changes based on config.

- If some plans remain (failure case):
```
===============================================
> Next Up
**Resume Execution** -- fix failure and continue
`/mz:go`
===============================================
```

- If all phases complete:
```
===============================================
> Next Up
**Project Complete** -- all phases delivered
===============================================
```

## Error Handling Summary

| Error | Step | Action |
|-------|------|--------|
| Config missing | Step 2 | Error box, suggest `/mz:init`. Stop. |
| No plans found | Step 3 | Error box, suggest `/mz:plan`. Stop. |
| All plans complete | Step 3 | Info message, suggest `/mz:verify`. Stop. |
| Plan execution fails | Step 6 | Save error, stop after wave, suggest `/mz:go`. |
| State update fails | Step 6 | Log warning, do not block (plans already committed). |
| Agent Teams unavailable | Step 5 | Silent fallback to subagents. |
| TeamCreate fails | Step 6B | Silent fallback to subagents for this wave. |
| Worktree merge conflict | Step 6B | Stop wave, leave worktree for inspection. |

## Notes

- All file contents are read BEFORE spawning Task subagents/teammates and embedded as inline text. @file references do NOT work across Task boundaries.
- The executor agent (`{plugin_path}/agents/mz-executor.md`) enforces per-task atomic commits with conventional commit format.
- Wave computation and conflict detection are performed by CLI tools, not computed in this skill.
- The `{plugin_path}` for CLI commands and agent files is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`.
- Only the orchestrator (this skill) updates STATE.md and ROADMAP.md. Executors never touch state files.
- ALWAYS use bun/bunx for JavaScript/TypeScript operations (never npm/npx).
- When CORTEX is enabled, the orchestrator reads `{plugin_path}/skills/cortex/SKILL.md` and embeds it as `<cortex_protocol>` in the executor prompt. This keeps the authoritative CORTEX content in one file while ensuring the executor receives it inline (required by the Task boundary constraint).

### Usage Examples

```
/mz:go                Execute all incomplete plans (auto-detect mode)
/mz:go --dry-run      Preview execution plan without running
/mz:go --from 2       Start from plan 2, skip earlier plans
/mz:go --tasks 1,3    Execute only specific plans
/mz:go --teams        Force Agent Teams mode (requires experimental flag)
/mz:go --no-teams     Force subagent mode (skip Agent Teams)
```
