# Agent Teams Execution Protocol

Reference file for the /mz:go skill. Covers the Agent Teams execution path: team lifecycle, worktree isolation, communication protocol, merge strategy, and fallback behavior.

For the subagent execution path, see `@skills/go/executor.md`.

## Overview

Agent Teams mode replaces fire-and-forget subagent delegation with coordinated parallel execution. The key differences:

| Aspect | Subagents (Path A) | Agent Teams (Path B) |
|--------|-------------------|---------------------|
| Communication | None (return value only) | SendMessage (peer-to-peer) |
| Isolation | Shared working directory | Per-agent git worktree |
| Review model | Nested subagent (depth 2) | Peer teammate via SendMessage |
| Coordination | Fire-and-forget | Shared TaskList, lead monitors |
| Failure recovery | Save error, stop wave | Lead receives message, can reassign |

## Team Naming Convention

Teams are named per wave:
```
mz-{phase}-w{wave}
```

Examples:
- `mz-06-w1` -- Phase 6, Wave 1
- `mz-03-w2` -- Phase 3, Wave 2

Agent names within the team:
- Executors: `exec-{plan_id}` (e.g., `exec-06-01`)
- Reviewers: `reviewer-{plan_id}` (e.g., `reviewer-06-01`)

## Worktree Setup

Each agent gets its own git worktree, created BEFORE the team:

```bash
node {plugin_path}/bin/megazord.mjs tools worktree create --team {team_name} --agent exec-{plan_id}
```

This creates:
- Worktree directory at `{base}/{team_name}/exec-{plan_id}/`
- Branch `mz/{team_name}/exec-{plan_id}` from HEAD

The base directory comes from `config.agent_teams.worktree_dir` (default: `~/.megazord/worktrees`).

Teammates must `cd` to their worktree path as their first action. All subsequent file operations happen within the worktree.

## Ownership Manifest

Generated from plan frontmatter `files_modified` fields before team creation:

```json
{
  "exec-06-01": ["src/lib/worktree.ts", "src/cli/commands/worktree-tools.ts"],
  "exec-06-02": ["agents/mz-executor.md", "agents/mz-reviewer.md"],
  "reviewer-06-01": [],
  "reviewer-06-02": []
}
```

Agents with empty arrays have unrestricted access (opt-in enforcement). Reviewers always have empty arrays -- they do not modify files directly.

## Agent Context Files

Since environment variables cannot be set for spawned teammates, the orchestrator writes a `.mz-agent-context.json` file in each worktree directory:

```json
{
  "agent_name": "exec-06-01",
  "team_name": "mz-06-w1",
  "team_lead": "mz-lead",
  "owned_files": ["src/lib/worktree.ts", "src/cli/commands/worktree-tools.ts"],
  "strict_ownership": false
}
```

The file ownership enforcement hook (`scripts/enforce-ownership.sh`) reads this file to determine the agent's identity and declared scope.

- `strict_ownership: false` (default): violations produce warnings but allow the operation
- `strict_ownership: true`: violations block the operation (exit code 2)

## Team Creation

After worktrees and context files are ready:

```
TeamCreate({ team_name: "{team_name}", description: "Phase {N} Wave {W}" })
```

One team per wave. Teams are created fresh for each wave and destroyed after the wave completes.

## Task Population

For each plan in the wave, create a shared task:

```
TaskCreate({
  subject: "Execute Plan {NN}: {objective}",
  description: "{full plan content with execution rules and worktree path}",
  activeForm: "Executing Plan {NN}"
})
```

Tasks are pre-assigned to their respective executors via `TaskUpdate({ taskId, owner: "exec-{plan_id}" })` to avoid race conditions in task claiming.

## Model Selection for Teammates

Before spawning teammates, the orchestrator updates agent frontmatter `model` fields based on config `model_profile` and `model_overrides`. This uses the same `resolveAgentModel()` resolution as subagent mode. Model selection is transparent to teammates -- they run on whatever model the orchestrator configured.

## Teammate Spawning

Spawn teammates via the Task tool with the `team_name` parameter. All teammates must be spawned BEFORE the lead enters coordination mode.

**Executor teammate:**
```
Task({
  description: "{executor prompt with agent role, plan, config, execution_rules including execution_mode: teammate}",
  team_name: "{team_name}",
  name: "exec-{plan_id}"
})
```

The executor prompt includes:
- `<agent_role>`: Full content of `agents/mz-executor.md`
- `<plan>`: Full content of the target PLAN.md
- `<config>`: Content of `megazord.config.json`
- `<reviewer_agent>`: Content of `agents/mz-reviewer.md` (if review enabled)
- `<execution_rules>`: Standard rules plus teammate-specific fields:
  - `execution_mode: teammate`
  - `worktree_path: {path}`
  - `owned_files: [...]`
  - `team_lead: mz-lead`
  - `reviewer_name: reviewer-{plan_id}` (if review enabled)
  - `task_id: {id}`

**Reviewer teammate** (if review enabled):
```
Task({
  description: "{reviewer prompt with agent role, review rules including review_mode_type: teammate}",
  team_name: "{team_name}",
  name: "reviewer-{plan_id}"
})
```

The reviewer prompt includes:
- `<agent_role>`: Full content of `agents/mz-reviewer.md`
- `<review_rules>`: Teammate-specific fields:
  - `review_mode_type: teammate`
  - `worktree_paths: {map of agent names to worktree paths}`
  - `team_lead: mz-lead`

## Delegate Mode

After all teammates are spawned, the lead (this skill) enters coordination-only mode:

**The lead MUST NOT:**
- Use Edit, Write, or Bash for implementation
- Directly modify any source files
- Run tests or builds

**The lead DOES:**
- Monitor task progress via TaskList
- Receive messages from teammates
- Log escalations from reviewers
- Track completion/failure for each plan
- Decide when the wave is done

This is enforced at the skill instruction level, NOT via API-level `permissionMode: "delegate"`. The API-level delegate mode has a known bug (GitHub #23447) that causes all spawned teammates to lose file system tools.

## Communication Protocol

All inter-agent communication uses SendMessage:

### Executor to Reviewer
When a task is complete and ready for review:
```
SendMessage({
  type: "message",
  recipient: "reviewer-{plan_id}",
  content: "Task {N} complete, ready for review. Commit: {hash}",
  summary: "Task {N} ready for review"
})
```

### Reviewer to Executor
Feedback on review findings:
```
SendMessage({
  type: "message",
  recipient: "exec-{plan_id}",
  content: "## Review: Task {N}\n\n### Critical\n1. [file:line] Issue...\n\nPlease fix and re-commit.",
  summary: "Review: {N} critical findings for Task {N}"
})
```

### Reviewer to Lead (Escalation)
After max review rounds (3) with unresolved critical findings:
```
SendMessage({
  type: "message",
  recipient: "mz-lead",
  content: "## Escalation: Task {N}\n\nMax review rounds reached. {N} unresolved findings:\n1. ...",
  summary: "Escalation: unresolved findings for Task {N}"
})
```

### Executor to Lead
Completion or failure notification:
```
SendMessage({
  type: "message",
  recipient: "mz-lead",
  content: "## PLAN COMPLETE\nTasks: {N}, Commits: {hashes}, Duration: {time}",
  summary: "Plan {NN} complete"
})
```

**Use targeted SendMessage, not broadcast.** Broadcast sends to ALL teammates and is expensive. Only use broadcast for wave-level announcements.

## Merge Protocol

After all tasks in the wave are complete, merge worktrees back to the main branch.

**Strategy: Sequential merge, no-ff, in plan order.**

For each completed plan (in order):
```bash
node {plugin_path}/bin/megazord.mjs tools worktree merge --team {team_name} --agent exec-{plan_id} --strategy merge
```

This executes `git merge mz/{team}/{agent} --no-ff` internally.

**Why sequential:** If agent A and agent B modify adjacent code areas (not the same file), sequential merge catches semantic conflicts early. The second merge sees the first's changes.

**On merge conflict:**
1. STOP the wave immediately
2. Leave the conflicting worktree intact for inspection
3. Log conflict details to `{phase_dir}/{plan}-MERGE-CONFLICT.md`
4. Do NOT attempt auto-resolution
5. Display error and suggest manual resolution

**On successful merge:**
- Remove the worktree and branch immediately (do not batch cleanup)
- Proceed to next worktree merge

## Shutdown Flow

After all merges complete (or on failure):

1. Verify all tasks are marked "completed" via TaskList
2. Send `shutdown_request` to each teammate sequentially:
   ```
   SendMessage({ type: "shutdown_request", recipient: "{name}", content: "Wave complete" })
   ```
3. Wait for `shutdown_response` from each (timeout: 60 seconds)
4. If a teammate does not respond within timeout: proceed anyway
5. No user confirmation needed -- this is an internal lifecycle operation

## Cleanup

After shutdown:

```bash
node {plugin_path}/bin/megazord.mjs tools worktree prune --team {team_name}
```

Then:
```
TeamDelete()
```

This removes:
- All remaining worktree directories for the team
- All branches matching `mz/{team_name}/*`
- Team configuration and task files

## Silent Fallback

If ANY step in the Agent Teams path fails before teammates begin work (steps 1-6), the orchestrator catches the error and falls back to subagent execution:

```
[TEAMS FALLBACK] {specific reason}. Using subagent mode for wave {N}.
```

Common fallback triggers:
- `TeamCreate` fails (API unavailable, experimental flag not set)
- Worktree creation fails (git error, disk space)
- Task creation fails
- Teammate spawning fails

The fallback is logged but does NOT prompt the user. Execution continues normally via the subagent path (Path A).

**After teammates begin work:** If a failure occurs mid-execution (e.g., a teammate crashes), the lead handles it within the team:
- Log the failure
- If other teammates can continue: wait for them to finish
- If the wave is blocked: shut down the team, fall back to subagents for the remaining plans

## State Update Protocol

Same as subagent path -- only the orchestrator updates state:

| Responsibility | Owner |
|---------------|-------|
| Execute tasks in worktree | Executor (teammate) |
| Commit tasks in worktree | Executor (teammate) |
| Create SUMMARY.md | Executor (teammate) |
| Review via SendMessage | Reviewer (teammate) |
| Merge worktrees | Orchestrator (lead) |
| Advance plan counter | Orchestrator (lead) |
| Record metrics | Orchestrator (lead) |
| Add decisions | Orchestrator (lead) |
| Update session | Orchestrator (lead) |
| Update ROADMAP.md | Orchestrator (lead) |
| Manage team lifecycle | Orchestrator (lead) |
