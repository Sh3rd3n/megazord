---
name: go
description: Execute the current phase plan with subagent delegation
disable-model-invocation: false
---

# /mz:go

Execute the current phase plan by orchestrating executor subagents. Reads plans via CLI tools, computes wave order, spawns one executor per plan via the Task tool, tracks progress, handles failures, and updates project state.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/go/executor.md` for execution protocol and spawning patterns.

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

Parse the user's message (text after `/mz:go`) for arguments:
- `--tasks N,M` -- execute only specific plan numbers (e.g., `--tasks 1,3`)
- `--from N` -- start from plan N, skip earlier plans (e.g., `--from 2`)
- `--dry-run` -- show execution plan without running

Determine the plugin path for CLI commands. The Megazord plugin directory is resolved from the skill's location. Use the path to the `bin/megazord.mjs` CLI entry point for all tool commands:

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

## Step 5: Execute Waves

For each wave (waves execute sequentially):

Display: `> Wave {N}`

Determine plan execution order within the wave:
- Parse the conflict analysis from Step 3.
- If no conflicts between plans in this wave: plans can run in parallel (spawn all Task calls).
- If conflicts exist: serialize conflicting plans, parallelize the rest.

For each plan in the wave:

Display: `  * Plan {NN}: {objective from plan file}...`

### Spawn Executor

1. Read the full PLAN.md content using the Read tool.
2. Read `agents/mz-executor.md` content using the Read tool.
3. Read `.planning/megazord.config.json` content using the Read tool.
4. If `review_enabled` is `true`: Read `agents/mz-reviewer.md` content using the Read tool.
5. Compose the Task prompt with all content inline (see `@skills/go/executor.md` for prompt structure):

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
</execution_rules>
```

Note: The `<reviewer_agent>` section is only included when `review_enabled` is `true`. When review is disabled, omit this section entirely to save context budget.

6. Spawn the executor via the Task tool:
   - `subagent_type`: `"general-purpose"`
   - `description`: `"Execute Plan {phase}-{plan}: {brief objective}"`

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

### After All Plans in Wave Complete

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

### Failure Handling

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

## Step 6: Update Roadmap

After all waves complete (or after stopping due to failure):

- Read each completed plan's SUMMARY.md to verify it exists.
- In ROADMAP.md, update the plan checkboxes for completed plans:
  - Change `- [ ]` to `- [x]` for plans that now have SUMMARY.md files.
- Update the Progress table row for this phase with the current plan completion count.

## Step 7: Check for Unresolved Review Findings

After all waves complete, check each completed plan's SUMMARY.md for "Unresolved Review Findings". If any plan mentions unresolved review findings, display a warning:

```
> Warning: Some tasks have unresolved review findings.
  Run /mz:review for manual review, or check the SUMMARY.md files for details.
```

## Step 8: Post-Execution Summary

Display summary using the design system action box:

```
+===============================================+
|  Execution Complete                           |
+-----------------------------------------------+
|  Phase {N}: {Name}                            |
|  Plans: {completed}/{total}                   |
|  Commits: {total_commits}                     |
|  Duration: {total_time}                       |
|                                               |
|  Wave 1: Plan 01 ({time}), Plan 02 ({time})  |
|  Wave 2: Plan 03 ({time})                     |
+===============================================+
```

Display the Next Up block:

- If all plans complete:
```
===============================================
> Next Up
**Verify Phase {N}** -- validate deliverables
`/mz:verify`
===============================================
```

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
| Plan execution fails | Step 5 | Save error, stop after wave, suggest `/mz:go`. |
| State update fails | Step 5 | Log warning, do not block (plans already committed). |

## Notes

- All file contents are read BEFORE spawning Task subagents and embedded as inline text. @file references do NOT work across Task boundaries.
- The executor agent (agents/mz-executor.md) enforces per-task atomic commits with conventional commit format.
- Wave computation and conflict detection are performed by CLI tools, not computed in this skill.
- The `{plugin_path}` for CLI commands is the Megazord plugin directory. Resolve it from the skill's installation location or use a known path.
- Only the orchestrator (this skill) updates STATE.md and ROADMAP.md. Executors never touch state files.
- ALWAYS use bun/bunx for JavaScript/TypeScript operations (never npm/npx).
