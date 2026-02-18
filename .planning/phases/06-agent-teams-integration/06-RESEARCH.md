# Phase 6: Agent Teams Integration - Research

**Researched:** 2026-02-18
**Domain:** Native Agent Teams coordination (TeamCreate, SendMessage, shared TaskList), git worktree isolation, file ownership enforcement via hooks, delegate mode, hybrid execution (subagents vs Agent Teams), reviewer-implementer feedback loops
**Confidence:** MEDIUM

## Summary

Phase 6 replaces the Task tool subagent execution model (Phase 4-5) with native Agent Teams for coordination-heavy work. The core challenge is threefold: (1) transforming the existing `/mz:go` orchestrator into a team lead that creates a team via TeamCreate, spawns teammates, coordinates via SendMessage, and manages work through a shared TaskList -- all without implementing directly (delegate mode); (2) isolating parallel work in git worktrees so agents cannot step on each other's files; and (3) building a hybrid detection system that routes simple independent tasks to the existing subagent path and coordination-heavy tasks (review loops, inter-dependent parallel work) to Agent Teams.

The Agent Teams API is experimental (shipped February 2026 alongside Opus 4.6) and has known limitations that directly affect implementation. The most critical is the **delegate mode bug** (GitHub issues #23447, #24073, #24307, #25037): when the lead enters delegate mode, all spawned teammates inherit the restricted tool access and lose Read, Write, Edit, Bash, Glob, and Grep -- rendering them unable to do any work. The confirmed workaround is to spawn all teammates BEFORE entering delegate mode. This means the skill must manage spawn-then-restrict ordering carefully. Other limitations include: no session resumption for in-process teammates, task status can lag (teammates sometimes fail to mark tasks completed), shutdown can be slow, one team per session, no nested teams, and the lead is fixed for the team's lifetime.

Git worktree isolation is the standard approach for parallel AI-assisted development. Each teammate gets its own worktree (`git worktree add`) on a unique branch, works in complete isolation, and merges back to the main branch when done. The merge strategy, worktree naming convention, and cleanup policy need careful design to handle conflicts and branch management. File ownership enforcement is achievable through PreToolUse hooks that inspect `tool_input.file_path` on Edit and Write operations, checking against a declared ownership manifest.

**Primary recommendation:** Build the hybrid execution path first (detection logic, `--teams`/`--no-teams` flags, silent fallback). Then implement the Agent Teams path: team lifecycle (create, populate tasks, spawn teammates, coordinate, merge, shutdown, cleanup), worktree management (create per agent, merge back, prune), file ownership enforcement (PreToolUse hooks checking declared file scope), and the reviewer-implementer feedback loop via SendMessage. Reuse existing agent definitions (mz-executor.md, mz-reviewer.md) as the base for teammate agent types. Keep the existing subagent path untouched as the fallback.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Team activation & fallback
- Auto-detect based on plan complexity: independent tasks -> subagents, coordination-heavy tasks (review loops, parallel with dependencies) -> Agent Teams
- Flag override available: `--teams` / `--no-teams` force the mode regardless of auto-detect
- Fallback is silent: if Agent Teams fails (API unavailable, creation error), fall back to subagents with only a log-level notice -- no user prompt

#### Review feedback loops
- Hybrid review model: reviewer fixes minor issues directly (typo, formatting, simple style); structural/logical problems are sent back to the implementer via SendMessage
- Max review rounds: Claude's discretion (Phase 5 uses 3 as baseline)
- Reviewer<->implementer communication is visible to the user in real-time (messages flow through the team lead)
- Escalation strategy after max rounds: Claude's discretion

#### Conflict & merge strategy
- One git worktree per agent -- each parallel teammate works in complete isolation
- File ownership enforcement level: Claude's discretion (hard block vs advisory)
- Merge strategy: Claude's discretion (auto-merge, sequential, or hybrid)
- Worktree cleanup policy: Claude's discretion (immediate vs batch)

#### Delegate mode behavior
- Delegate mode is the ONLY mode for Agent Teams -- the team lead never implements directly, only coordinates via spawn/message/shutdown/task tools
- Dynamic task creation: Claude's discretion (whether lead can create tasks beyond the original plan)
- Progress communication: user sees agent messages in real-time (already visible), team lead communicates only the final result summary
- Team shutdown flow: Claude's discretion

### Claude's Discretion
- Mixed-plan granularity: how to split waves between subagents and Agent Teams when a plan has both simple and complex tasks
- File ownership enforcement level (hard vs soft)
- Merge strategy and worktree cleanup timing
- Max review rounds and escalation behavior
- Dynamic task creation flexibility for team lead
- Team shutdown flow (auto vs confirmation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AGNT-01 | Native Agent Teams integration via TeamCreate, SendMessage, shared TaskList for coordinated parallel work | TeamCreate creates team at `~/.claude/teams/{name}/config.json` with shared task directory at `~/.claude/tasks/{name}/`. TaskCreate/TaskUpdate/TaskList manage work items. SendMessage enables direct peer-to-peer communication. Task tool with `team_name` and `name` parameters spawns teammates. Full API documented in official docs. |
| AGNT-03 | Hybrid approach: Agent Teams for coordination-heavy work, Task tool for fire-and-forget | Auto-detect based on plan metadata: plans with `wave > 1`, review-enabled tasks, or inter-plan dependencies use Agent Teams; independent single-wave plans use existing subagent path. `--teams`/`--no-teams` flags override. Silent fallback on Agent Teams failure. |
| AGNT-04 | Reviewer agent can send code back to specific implementer via SendMessage with actionable feedback | SendMessage `type: "message"` with `recipient` (teammate name) delivers feedback directly. Hybrid review model: reviewer fixes trivial issues itself (typo, formatting), sends structural/logical problems back to implementer. Messages flow through lead for real-time user visibility. |
| AGNT-05 | Git worktree isolation: each parallel teammate gets its own worktree to prevent file conflicts | `git worktree add ~/worktrees/{team}/{agent-name} -b mz/{team}/{agent-name} HEAD` creates isolated workspace per agent. Each agent's cwd is set to its worktree. Merge back via `git merge` or `git rebase` after completion. Cleanup via `git worktree remove` + `git branch -d`. |
| AGNT-06 | Delegate mode: team lead coordinates without implementing, only using spawn/message/shutdown/task tools | Delegate mode (`permissionMode: "delegate"`) restricts lead to coordination tools only. Known bug: teammates inherit restriction. Workaround: spawn all teammates BEFORE the lead conceptually enters delegate behavior. Enforce at skill level via instructions rather than API-level permissionMode. |
| AGNT-07 | File ownership enforcement: each agent/task has declared files it can modify, violations blocked via hooks | PreToolUse hooks on `Edit|Write` matcher inspect `tool_input.file_path` against agent's declared file scope. Exit code 2 blocks unauthorized edits. Ownership manifest derived from plan's `files_modified` frontmatter field. Hook script reads ownership config from team directory. |
| AGNT-08 | Wave execution for large phases: batches of parallel tasks with checkpoints between waves | Existing wave computation (`computeWaves()` in plan.ts) groups plans by wave number. Agent Teams executes each wave as a team: create team, spawn teammates for wave's plans, wait for completion, merge worktrees, checkpoint, proceed to next wave. Between waves: verify, merge, cleanup. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for new CLI helpers (worktree manager, ownership validator) | Already installed, type safety |
| gray-matter | ^4.0.3 | Parse PLAN.md frontmatter for `files_modified` extraction | Already installed, used in plan.ts |
| fs-extra | ^11.0.0 | File system operations (worktree dirs, ownership manifests) | Already installed, used everywhere |
| commander | ^14.0.0 | CLI subcommands for worktree management | Already installed, used in cli/index.ts |
| zod | ^4.3.0 | Validation of team config, ownership manifests | Already installed, used in config.ts and plan.ts |

### Native Claude Code Tools (No Installation)
| Tool | Purpose | Notes |
|------|---------|-------|
| TeamCreate | Create agent team with shared task list | Experimental, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| TaskCreate/TaskUpdate/TaskList/TaskGet | Manage shared work items | Task lifecycle: pending -> in_progress -> completed |
| SendMessage | Direct teammate communication | Types: message, broadcast, shutdown_request, shutdown_response |
| TeamDelete | Clean up team resources | Fails if active teammates exist; shutdown first |
| Task (with team_name) | Spawn teammate into existing team | Accepts `team_name`, `name`, `model` parameters |

### Supporting (New CLI Tools Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| child_process (Node built-in) | N/A | Execute git worktree commands | Worktree create/remove/list/prune operations |

### No Additional Dependencies Needed

Phase 6, like Phase 5, requires zero new npm dependencies. The Agent Teams API is native to Claude Code (tools available in the runtime). Git worktree operations use shell commands via `child_process`. File ownership enforcement uses hooks (shell scripts). The new CLI tools extend the existing megazord.mjs pattern.

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
# Agent Teams requires environment variable:
# CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Architecture Patterns

### Recommended Project Structure (Phase 6 Additions)

```
agents/
├── mz-executor.md              # MODIFY: Add Agent Teams teammate mode
├── mz-reviewer.md              # MODIFY: Add SendMessage feedback protocol
├── mz-researcher.md            # Existing (no changes)
├── mz-planner.md               # Existing (no changes)
└── mz-verifier.md              # Existing (no changes)

skills/
├── go/
│   └── SKILL.md                # MAJOR MODIFY: Add hybrid detection, Agent Teams path,
│   │                           #   worktree lifecycle, delegate mode, merge protocol
│   └── executor.md             # MODIFY: Add team spawning protocol, worktree context
│   └── teams.md                # NEW: Agent Teams execution reference (like executor.md)
├── help/
│   └── SKILL.md                # MODIFY: Update /mz:go description

src/
├── lib/
│   ├── worktree.ts             # NEW: Git worktree lifecycle management
│   ├── ownership.ts            # NEW: File ownership manifest and validation
│   └── config.ts               # MODIFY: Add agent_teams config section
├── cli/
│   └── commands/
│       └── worktree-tools.ts   # NEW: CLI commands for worktree operations

hooks/
└── hooks.json                  # MODIFY: Add PreToolUse file ownership hook
scripts/
└── enforce-ownership.sh        # NEW: PreToolUse hook script for file ownership
```

### Pattern 1: Hybrid Execution Detection

**What:** The `/mz:go` orchestrator determines whether to use subagents (Phase 4 path) or Agent Teams (Phase 6 path) based on plan complexity analysis and user flags.

**When to use:** Every `/mz:go` invocation.

**Detection logic:**

```
1. Check flags: --teams -> force Agent Teams; --no-teams -> force subagents
2. If no flags, auto-detect:
   a. Check Agent Teams availability:
      - Environment variable CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 set?
      - TeamCreate tool available in current session?
      - If NO to either: use subagents (silent)
   b. Analyze plan complexity:
      - Plans with review_enabled AND multiple tasks: Agent Teams (review loops)
      - Plans in same wave with file dependencies: Agent Teams (coordination)
      - Plans that are independent fire-and-forget: subagents
      - Mixed plan: split -- subagents for simple, Agent Teams for complex
3. If Agent Teams selected but creation fails: silent fallback to subagents
```

**Config extension (megazord.config.json):**

```json
{
  "agent_teams": {
    "enabled": "auto",
    "worktree_dir": "~/.megazord/worktrees"
  }
}
```

Values for `enabled`: `"auto"` (default, detect), `"always"`, `"never"`.

### Pattern 2: Agent Teams Lifecycle (Per-Wave)

**What:** For each wave that uses Agent Teams, the orchestrator manages a complete team lifecycle: create, populate tasks, spawn teammates, monitor, merge, cleanup.

**Flow:**

```
Wave N begins (Agent Teams mode)
│
├── 1. Create worktrees (one per plan in wave)
│   └── git worktree add ~/.megazord/worktrees/{team}/{plan-id} -b mz/{team}/{plan-id} HEAD
│
├── 2. TeamCreate({ team_name: "mz-{phase}-wave-{N}", description: "Phase {X} Wave {N}" })
│
├── 3. For each plan in wave: TaskCreate({
│       subject: "Execute Plan {NN}: {objective}",
│       description: "{full plan content with worktree path and ownership rules}",
│       activeForm: "Executing Plan {NN}"
│   })
│
├── 4. For each plan: Task({
│       description: "Execute Plan {NN}",
│       team_name: "mz-{phase}-wave-{N}",
│       name: "exec-{plan-id}",
│       model: "inherit"
│   })
│   (If review enabled: also spawn reviewer teammates)
│
├── 5. Monitor via TaskList polling + automatic message delivery
│   ├── Teammates claim tasks (TaskUpdate owner)
│   ├── Executors work in their worktrees
│   ├── Reviewers review via SendMessage feedback
│   └── Lead receives idle notifications, completion messages
│
├── 6. When all tasks complete:
│   ├── For each worktree: merge back to main branch
│   │   └── git -C {main} merge mz/{team}/{plan-id} --no-ff
│   ├── Verify merge success (no conflicts)
│   └── If conflicts: serialize conflicting merges, resolve
│
├── 7. Shutdown teammates
│   └── SendMessage({ type: "shutdown_request", recipient: "{name}" })
│
├── 8. Cleanup
│   ├── git worktree remove {path}
│   ├── git branch -d mz/{team}/{plan-id}
│   └── TeamDelete()
│
└── 9. Update state (advance plans, record metrics)
    └── Proceed to Wave N+1
```

### Pattern 3: Reviewer-Implementer Feedback Loop via SendMessage

**What:** When Agent Teams is active, the reviewer is a separate teammate that communicates directly with the implementer via SendMessage, rather than the Phase 5 nested-subagent pattern.

**Hybrid review model (user decision):**

```
Reviewer examines implementer's commit
│
├── Minor issues (typo, formatting, simple style):
│   └── Reviewer FIXES directly in its own worktree
│       (reviewer has Read/Write/Edit access to the implementer's worktree)
│       Wait -- reviewers should NOT modify implementer worktrees.
│       Instead: reviewer creates a fix commit in a shared staging area
│       or sends the fix as a patch in the SendMessage content.
│
│   CORRECTED approach:
│   └── Reviewer notes the fix in its review message to the lead
│       Lead applies minor fixes or instructs implementer to apply them
│       This keeps worktree isolation clean
│
├── Structural/logical problems:
│   └── Reviewer sends feedback to implementer via SendMessage:
│       SendMessage({
│           type: "message",
│           recipient: "exec-{plan-id}",
│           content: "Review findings for Task {N}:\n\n## Critical\n1. [file:line] Missing error handling...\n\nPlease fix and re-commit.",
│           summary: "Review: critical findings for Task {N}"
│       })
│       Implementer receives, fixes, re-commits
│       Reviewer re-reviews
│
└── Max rounds exceeded:
    └── Reviewer sends final report to lead
        Lead logs unresolved findings in SUMMARY.md
        Team proceeds
```

**Key difference from Phase 5:** In Phase 5, the executor spawns a reviewer subagent (nested Task tool, depth 2). In Phase 6, the reviewer is a peer teammate. Communication is horizontal (SendMessage) rather than vertical (Task tool return value). This enables real feedback loops rather than one-shot review-and-return.

### Pattern 4: Git Worktree Lifecycle Management

**What:** CLI tooling to create, list, merge, and cleanup git worktrees for Agent Teams.

**Worktree naming convention:**

```
Base directory: ~/.megazord/worktrees/  (or config.agent_teams.worktree_dir)
Per-team:       {base}/{team-name}/
Per-agent:      {base}/{team-name}/{agent-name}/

Branch naming:  mz/{team-name}/{agent-name}
Example:        mz/mz-06-wave-1/exec-06-01
```

**CLI commands (new megazord.mjs subcommands):**

```bash
# Create worktree for an agent
node megazord.mjs tools worktree create --team {team} --agent {name} --base-ref HEAD

# List active worktrees
node megazord.mjs tools worktree list --team {team}

# Merge worktree back to current branch
node megazord.mjs tools worktree merge --team {team} --agent {name} --strategy merge|rebase

# Remove worktree and branch
node megazord.mjs tools worktree remove --team {team} --agent {name}

# Prune all worktrees for a team
node megazord.mjs tools worktree prune --team {team}
```

**Git commands used internally:**

```bash
# Create
git worktree add {path} -b {branch} {base-ref}

# List
git worktree list --porcelain

# Merge (back to main)
git merge {branch} --no-ff -m "merge({phase}-{plan}): merge agent {name} work"

# Remove
git worktree remove {path}
git branch -d {branch}

# Prune (cleanup stale refs)
git worktree prune
```

### Pattern 5: File Ownership Enforcement via PreToolUse Hook

**What:** A PreToolUse hook on Edit|Write operations checks the target file path against the agent's declared ownership scope. Unauthorized edits are blocked.

**Ownership manifest:** Derived from plan frontmatter `files_modified` field (already exists in PlanMetadataSchema). Written to the team directory as `ownership.json`:

```json
{
  "exec-06-01": ["src/lib/worktree.ts", "src/cli/commands/worktree-tools.ts"],
  "exec-06-02": ["skills/go/SKILL.md", "skills/go/teams.md"],
  "reviewer-01": []
}
```

**Hook script (scripts/enforce-ownership.sh):**

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Read agent name from environment or team config
AGENT_NAME="${MZ_AGENT_NAME:-}"
if [ -z "$AGENT_NAME" ]; then
  exit 0  # No agent context, allow (not in team mode)
fi

OWNERSHIP_FILE="${MZ_TEAM_DIR}/ownership.json"
if [ ! -f "$OWNERSHIP_FILE" ]; then
  exit 0  # No ownership manifest, allow
fi

# Check if file is in agent's declared scope
ALLOWED=$(jq -r --arg agent "$AGENT_NAME" --arg file "$FILE_PATH" \
  '.[$agent] // [] | map(select(. == $file or ($file | startswith(.)))) | length' \
  "$OWNERSHIP_FILE")

if [ "$ALLOWED" -eq 0 ]; then
  echo "Blocked: $AGENT_NAME is not authorized to modify $FILE_PATH. Declared scope: $(jq -r --arg agent "$AGENT_NAME" '.[$agent] // [] | join(", ")' "$OWNERSHIP_FILE")" >&2
  exit 2
fi

exit 0
```

**Hook configuration (hooks/hooks.json):**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh"
          }
        ]
      }
    ]
  }
}
```

### Pattern 6: Delegate Mode Implementation (Skill-Level Enforcement)

**What:** Due to the known delegate mode bug (teammates inherit restricted tools), enforce delegate behavior at the SKILL level rather than using API-level `permissionMode: "delegate"`.

**Approach:**

The `/mz:go` skill, when in Agent Teams mode, instructs the lead (itself) to ONLY use coordination tools. The skill's instructions explicitly state:

```
When executing in Agent Teams mode:
- You are the team LEAD. You NEVER implement directly.
- Your tools: TeamCreate, TaskCreate, TaskUpdate, TaskList, SendMessage, TeamDelete
- For any implementation work: spawn a teammate or message an existing one
- If you catch yourself about to use Edit/Write/Bash for implementation: STOP and delegate
```

This is enforced through skill instructions rather than API-level permissionMode to avoid the bug where teammates lose tool access.

**Spawn-first pattern:** The skill spawns ALL teammates before entering the coordination-only mindset. Once teammates are running, the lead switches to pure orchestration.

### Anti-Patterns to Avoid

- **Using API-level delegate mode (permissionMode: "delegate"):** Known bug causes all teammates to lose file system tools. Enforce delegate behavior via skill instructions instead.

- **One team for the entire phase:** A team should correspond to a wave, not an entire phase. Between waves, merge results, checkpoint state, and create a fresh team for the next wave. This prevents stale team state and allows inter-wave verification.

- **Letting reviewers modify implementer worktrees:** Each agent's worktree is its own isolated space. Reviewers send feedback via SendMessage; they do not directly edit implementer files. This preserves isolation and audit trail.

- **Hard-coding Agent Teams detection:** The feature is experimental. Detection should be runtime (check environment variable + tool availability), not compile-time. Silent fallback is mandatory.

- **Skipping worktree merge verification:** After merging a worktree branch back to main, ALWAYS verify the merge succeeded. Conflicts must be detected and handled (serialize conflicting merges or flag for manual resolution).

- **Creating nested teams:** Agent Teams does not support nested teams. Teammates cannot spawn their own teams. Keep the hierarchy flat: one lead, N teammates per team.

- **Broadcasting when messaging would suffice:** Broadcast sends to ALL teammates and costs scale linearly. Use targeted SendMessage for reviewer-implementer communication.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team coordination | Custom inter-process communication | TeamCreate + SendMessage + TaskList | Native Agent Teams handles lifecycle, messaging, task claiming, idle detection |
| Worktree management | Raw git commands scattered across skills | Centralized worktree.ts + CLI commands | Consistent naming, cleanup, error handling; reusable across skills |
| File ownership checking | Per-agent permission lists in skill text | PreToolUse hook + ownership.json manifest | Deterministic enforcement, cannot be bypassed by agent, audit trail |
| Plan complexity analysis | Manual plan inspection | Extend existing `computeWaves()` + `detectWaveConflicts()` | Already has wave grouping and conflict detection; add coordination heuristic |
| Merge strategy | Manual git commands per merge | CLI merge command with strategy parameter | Handles conflicts, no-ff, commit messages consistently |
| Agent Teams availability check | Hardcoded feature flag | Runtime capability detection (try TeamCreate, catch failure) | Feature is experimental; graceful degradation is non-negotiable |

**Key insight:** Phase 6 extends the existing Phase 4/5 architecture rather than replacing it. The subagent path (Task tool) remains the default. Agent Teams is an upgrade path for coordination-heavy work. All new code (worktree.ts, ownership.ts, worktree-tools.ts) is additive. The existing plan.ts, state.ts, config.ts, and agent definitions are modified, not rewritten.

## Common Pitfalls

### Pitfall 1: Delegate Mode Bug Causes Teammate Tool Loss
**What goes wrong:** Using `permissionMode: "delegate"` on the lead causes ALL spawned teammates to lose Read, Write, Edit, Bash, Glob, and Grep tools. Teammates cannot do any implementation work.
**Why it happens:** Agent Teams propagates the lead's permission settings to all teammates at spawn time. Delegate mode restricts tools to coordination-only, and this restriction cascades.
**How to avoid:** Do NOT use API-level delegate mode. Enforce delegate behavior through skill instructions in `/mz:go`. The skill text tells the lead "you are a coordinator only" without actually restricting its API-level tools. This way, teammates inherit full tool access while the lead self-restricts.
**Warning signs:** Teammates reporting "No file system tools available," all spawned agents failing immediately.

### Pitfall 2: Worktree Branch Conflicts on Merge
**What goes wrong:** Two agents modify the same logical area of code (e.g., both add entries to an index file), creating merge conflicts when worktrees are merged back.
**Why it happens:** File ownership enforcement catches exact file matches but may miss semantic conflicts (e.g., two agents adding to the same array in different parts of the file).
**How to avoid:** Use the existing `detectWaveConflicts()` from plan.ts to identify file overlaps BEFORE creating the team. Plans with overlapping `files_modified` should be serialized (not parallelized) even within Agent Teams. The merge step should use `git merge --no-ff` and check exit code; on non-zero, fall back to sequential merge with manual conflict resolution.
**Warning signs:** `git merge` returning non-zero exit code, merge commit with conflict markers.

### Pitfall 3: Team Name Collisions
**What goes wrong:** Running `/mz:go` twice in the same session creates a team with the same name, colliding with the previous team's resources at `~/.claude/teams/{name}/`.
**Why it happens:** One team per session limitation + predictable naming.
**How to avoid:** Include a timestamp or random suffix in the team name: `mz-{phase}-w{wave}-{epoch}`. Before creating, check if the team directory exists and clean up stale teams. Use `TeamDelete` proactively.
**Warning signs:** TeamCreate failure, "team already exists" errors.

### Pitfall 4: Silent Fallback Masking Real Errors
**What goes wrong:** Agent Teams fails for a fixable reason (e.g., environment variable not set), but the silent fallback masks the error. User thinks subagents are running because they chose to, when actually Agent Teams failed silently.
**Why it happens:** The user decision says "fallback is silent: only a log-level notice."
**How to avoid:** While the fallback itself is silent (no user prompt), log the specific failure reason so it's discoverable. Use a structured log format that tools like `/mz:status` can surface: `[TEAMS FALLBACK] Agent Teams unavailable: {reason}. Using subagent mode.` The user sees normal execution; the log reveals what happened.
**Warning signs:** Execution always using subagents even when `--teams` is passed; check logs.

### Pitfall 5: Worktree Cleanup Failure on Error
**What goes wrong:** An agent fails mid-execution, the team is shut down, but worktrees and branches are left behind because cleanup only runs on success path.
**Why it happens:** Cleanup is in the happy path; error path skips it.
**How to avoid:** Worktree cleanup must be in a finally-style block: regardless of success or failure, list all worktrees for the team and remove them. Use `git worktree prune` as a safety net. The CLI `worktree prune --team {name}` command handles bulk cleanup.
**Warning signs:** `git worktree list` showing stale entries, orphaned branches matching `mz/{team}/*` pattern.

### Pitfall 6: Context Window Exhaustion in Long Review Loops
**What goes wrong:** Multiple review rounds consume the reviewer's context window. By round 3, the reviewer has seen the original diff, the first fix, the second fix, and all the messages -- potentially exhausting context.
**Why it happens:** Each review round adds: diff, file contents, review report, SendMessage messages.
**How to avoid:** Cap review rounds (recommend 3 total, matching Phase 5 baseline). On each round, send only the DELTA (what changed since last review), not the full cumulative diff. The reviewer should also compact between rounds if available.
**Warning signs:** Reviewer producing increasingly shallow reviews, missing obvious issues in later rounds, or timing out.

### Pitfall 7: Race Condition in Task Claiming
**What goes wrong:** Two teammates try to claim the same task simultaneously.
**Why it happens:** TaskList shows the task as unclaimed to both before either can update it.
**How to avoid:** Agent Teams uses file locking for task claiming (documented in official docs). The lead should pre-assign tasks via `TaskUpdate({ taskId, owner: "agent-name" })` rather than relying on self-claiming. Pre-assignment is deterministic and avoids races.
**Warning signs:** Duplicate work on the same task, conflicting commits.

## Code Examples

### Agent Teams Creation and Task Population

```typescript
// Example: How the /mz:go skill creates a team for a wave
// (Conceptual -- this is executed by the skill via tools, not compiled code)

// Step 1: Create team
TeamCreate({
  team_name: "mz-06-wave-1",
  description: "Phase 6 Wave 1: worktree management and ownership enforcement"
});

// Step 2: Create tasks from plans
TaskCreate({
  subject: "Execute Plan 06-01: Worktree management library",
  description: `<agent_role>{mz-executor.md content}</agent_role>
<plan>{06-01-PLAN.md content}</plan>
<config>{megazord.config.json}</config>
<execution_rules>
- Worktree path: ~/.megazord/worktrees/mz-06-wave-1/exec-06-01
- Ownership scope: src/lib/worktree.ts, src/cli/commands/worktree-tools.ts
- Agent name: exec-06-01
</execution_rules>`,
  activeForm: "Executing Plan 06-01"
});

// Step 3: Create worktrees
// Via Bash: git worktree add ~/.megazord/worktrees/mz-06-wave-1/exec-06-01 -b mz/mz-06-wave-1/exec-06-01 HEAD

// Step 4: Spawn teammates
// Via Task tool with team_name parameter
// Task({ description: "Execute Plan 06-01", team_name: "mz-06-wave-1", name: "exec-06-01" })
```

### Reviewer-Implementer SendMessage Pattern

```markdown
## Reviewer sends feedback to implementer:

SendMessage({
  type: "message",
  recipient: "exec-06-01",
  content: "## Review: Plan 06-01 Task 2\n\n### Critical Findings\n\n1. **[src/lib/worktree.ts:45] Missing error handling for git worktree add failure**\n   - Issue: If `git worktree add` fails (e.g., branch already exists), the function returns undefined instead of throwing\n   - Fix: Add try/catch and throw descriptive error\n\n### Minor Issues (I will fix directly)\n- Line 12: Typo in JSDoc comment ('worktere' -> 'worktree')\n\nPlease fix the critical finding and re-commit. I'll re-review after.",
  summary: "Review: 1 critical finding for Plan 06-01 Task 2"
})

## Implementer acknowledges and fixes:

SendMessage({
  type: "message",
  recipient: "reviewer-01",
  content: "Fixed the error handling in worktree.ts:45. Added try/catch with descriptive error message. Re-committed as amended commit. Ready for re-review.",
  summary: "Fixed critical finding, ready for re-review"
})
```

### File Ownership Hook (PreToolUse)

```bash
#!/bin/bash
# scripts/enforce-ownership.sh
# Blocks Edit/Write operations outside the agent's declared file scope

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only enforce during Agent Teams mode
AGENT_NAME="${MZ_AGENT_NAME:-}"
TEAM_DIR="${MZ_TEAM_DIR:-}"

if [ -z "$AGENT_NAME" ] || [ -z "$TEAM_DIR" ]; then
  exit 0  # Not in team mode, allow everything
fi

OWNERSHIP_FILE="${TEAM_DIR}/ownership.json"
if [ ! -f "$OWNERSHIP_FILE" ]; then
  exit 0  # No manifest, allow (defensive)
fi

# Normalize file path (remove leading ./ or absolute prefix)
NORM_PATH=$(echo "$FILE_PATH" | sed 's|^.*/Programming/[^/]*/||; s|^\./||')

# Check ownership
ALLOWED=$(jq -r --arg agent "$AGENT_NAME" --arg file "$NORM_PATH" \
  '(.[$agent] // []) as $scope |
   if ($scope | length) == 0 then "1"
   else ($scope | map(select($file | startswith(.))) | length | tostring)
   end' \
  "$OWNERSHIP_FILE")

if [ "$ALLOWED" = "0" ]; then
  echo "OWNERSHIP VIOLATION: Agent '$AGENT_NAME' attempted to modify '$NORM_PATH' which is outside its declared scope." >&2
  echo "Declared files: $(jq -r --arg agent "$AGENT_NAME" '.[$agent] // [] | join(", ")' "$OWNERSHIP_FILE")" >&2
  exit 2
fi

exit 0
```

### Worktree Management Library (src/lib/worktree.ts skeleton)

```typescript
// Source: Designed for Megazord based on git worktree official docs
import { execSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import fse from "fs-extra";

export interface WorktreeInfo {
  path: string;
  branch: string;
  agent: string;
  team: string;
}

const DEFAULT_BASE = join(homedir(), ".megazord", "worktrees");

export function getWorktreeBase(configDir?: string): string {
  // Read from config or use default
  return configDir ?? DEFAULT_BASE;
}

export function createWorktree(
  team: string,
  agent: string,
  baseRef: string = "HEAD",
  baseDir?: string,
): WorktreeInfo {
  const base = getWorktreeBase(baseDir);
  const path = join(base, team, agent);
  const branch = `mz/${team}/${agent}`;

  fse.ensureDirSync(join(base, team));

  execSync(`git worktree add "${path}" -b "${branch}" ${baseRef}`, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  return { path, branch, agent, team };
}

export function removeWorktree(
  team: string,
  agent: string,
  baseDir?: string,
): void {
  const base = getWorktreeBase(baseDir);
  const path = join(base, team, agent);
  const branch = `mz/${team}/${agent}`;

  try {
    execSync(`git worktree remove "${path}" --force`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    // Worktree may already be removed
  }

  try {
    execSync(`git branch -D "${branch}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    // Branch may already be deleted
  }
}

export function mergeWorktree(
  team: string,
  agent: string,
  strategy: "merge" | "rebase" = "merge",
): { success: boolean; conflicts: boolean; message: string } {
  const branch = `mz/${team}/${agent}`;

  try {
    if (strategy === "rebase") {
      execSync(`git rebase ${branch}`, { encoding: "utf-8", stdio: "pipe" });
    } else {
      execSync(
        `git merge ${branch} --no-ff -m "merge(${team}): merge ${agent} work"`,
        { encoding: "utf-8", stdio: "pipe" },
      );
    }
    return { success: true, conflicts: false, message: "Merge successful" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("CONFLICT")) {
      return { success: false, conflicts: true, message: msg };
    }
    return { success: false, conflicts: false, message: msg };
  }
}

export function pruneTeamWorktrees(team: string, baseDir?: string): void {
  const base = getWorktreeBase(baseDir);
  const teamDir = join(base, team);

  if (fse.pathExistsSync(teamDir)) {
    // List all agent directories
    const agents = fse.readdirSync(teamDir);
    for (const agent of agents) {
      removeWorktree(team, agent, baseDir);
    }
    fse.removeSync(teamDir);
  }

  // Prune stale worktree references
  execSync("git worktree prune", { encoding: "utf-8", stdio: "pipe" });
}

export function listTeamWorktrees(team: string): WorktreeInfo[] {
  const output = execSync("git worktree list --porcelain", {
    encoding: "utf-8",
  });
  const prefix = `mz/${team}/`;
  const results: WorktreeInfo[] = [];

  const entries = output.split("\n\n");
  for (const entry of entries) {
    const branchMatch = entry.match(/branch refs\/heads\/(mz\/[^\n]+)/);
    const pathMatch = entry.match(/worktree ([^\n]+)/);
    if (branchMatch && pathMatch && branchMatch[1].startsWith(prefix)) {
      const branch = branchMatch[1];
      const agent = branch.replace(prefix, "");
      results.push({ path: pathMatch[1], branch, agent, team });
    }
  }

  return results;
}
```

## Discretion Recommendations

### 1. Mixed-Plan Granularity (Subagents vs Agent Teams)
**Recommendation: Per-wave decision, not per-plan.**

When a wave contains both simple and complex plans, the entire wave should use ONE mode:
- If ANY plan in the wave requires coordination (review loops, file dependencies with other plans in the wave): the entire wave uses Agent Teams
- If ALL plans in the wave are independent: the entire wave uses subagents

Rationale: Mixing modes within a single wave would require running both subagents and a team simultaneously, adding complexity with minimal benefit. The wave is the natural granularity boundary.

### 2. File Ownership Enforcement Level
**Recommendation: Advisory (soft) for Phase 6 v1, with hard block as opt-in.**

Default: The PreToolUse hook LOGS the violation and adds a warning to Claude's context but does NOT block (exit 0 with systemMessage instead of exit 2). The agent sees "WARNING: You are modifying a file outside your declared scope" and can choose to proceed.

Opt-in hard block: Config flag `agent_teams.strict_ownership: true` switches to exit 2 (hard block).

Rationale: Hard blocking in v1 risks false positives (plans don't always perfectly declare every file they touch -- deviation rules allow additional files). Advisory mode catches genuine mistakes while allowing necessary deviations. Users who want strict enforcement can opt in.

### 3. Merge Strategy and Worktree Cleanup Timing
**Recommendation: Sequential merge with immediate cleanup.**

- **Merge strategy:** Sequential merge (`git merge --no-ff`), one worktree at a time, in plan order within the wave. Not parallel merge. Each merge commit creates an explicit record.
- **Why sequential:** If worktree A and B both touch adjacent code areas (not the same file, so no ownership violation), sequential merge catches semantic conflicts early. The second merge sees the first's changes.
- **Cleanup timing:** Immediately after successful merge, remove the worktree and branch. Do not batch cleanup to end of phase.
- **Why immediate:** Prevents worktree accumulation, frees disk space, and keeps `git worktree list` clean. Stale worktrees from failed runs are the #1 cleanup headache in CI environments.
- **On merge failure:** Do NOT remove the worktree. Leave it for manual inspection. Log the conflict details. Stop the wave.

### 4. Max Review Rounds and Escalation
**Recommendation: 3 total rounds (matching Phase 5), escalate to lead with summary.**

- Round 1: Initial review after implementer commits
- Round 2: Re-review after implementer fixes critical findings
- Round 3: Final re-review. If critical issues persist, escalate.
- Escalation: Reviewer sends final summary to lead via SendMessage. Lead logs findings in SUMMARY.md under "Unresolved Review Findings". Team proceeds to next task.

Phase 6 improvement over Phase 5: In Phase 5, escalation means "log and continue silently." In Phase 6, escalation goes through SendMessage, so the lead has full visibility and can make a coordinated decision (e.g., pause the team, reassign the task, or accept the risk).

### 5. Dynamic Task Creation Flexibility
**Recommendation: Lead CAN create additional tasks, but only for discovered work.**

The lead should primarily execute the pre-planned tasks from PLAN.md files. However, if during execution, a teammate reports:
- A prerequisite that was not anticipated (e.g., "I need X configured before I can implement Y")
- A split that makes sense (e.g., "This task is actually two independent pieces")
- An urgent fix discovered during review

...then the lead can create new tasks via TaskCreate. These dynamic tasks must be logged in the wave's SUMMARY.md under "Dynamic Tasks Created" with rationale.

Constraint: Dynamic tasks should be small and immediate. If a major new work item is discovered, the lead should log it as a "Deferred Issue" (matching Phase 4 executor deviation rules) rather than creating a large new task.

### 6. Team Shutdown Flow
**Recommendation: Graceful sequential shutdown, auto (no confirmation).**

After all tasks in a wave complete:
1. Lead verifies all tasks are marked "completed" via TaskList
2. Lead sends `shutdown_request` to each teammate sequentially (not broadcast -- broadcast is expensive)
3. Wait for each `shutdown_response` (approve expected)
4. If a teammate rejects shutdown: check if they have in-progress work. If yes, wait. If no, re-send shutdown.
5. After all teammates shut down: run TeamDelete
6. No user confirmation needed -- this is an internal lifecycle operation

Timeout: If a teammate doesn't respond to shutdown within 60 seconds, proceed with TeamDelete anyway (documented limitation: "shutdown can be slow").

## State of the Art

| Old Approach (Phase 4-5) | Current Approach (Phase 6) | When Changed | Impact |
|--------------------------|---------------------------|--------------|--------|
| Task tool subagents (fire-and-forget) | Agent Teams with shared TaskList + SendMessage | Phase 6 | Real inter-agent communication, review feedback loops, coordinated parallel work |
| Nested subagent review (executor -> reviewer, depth 2) | Peer teammate review via SendMessage | Phase 6 | Horizontal communication, multiple review rounds without nesting depth issues |
| Single git working directory for all agents | Git worktree per agent | Phase 6 | Complete file isolation, no conflicts during parallel execution |
| No file ownership enforcement | PreToolUse hook with ownership manifest | Phase 6 | Deterministic enforcement of declared file scope |
| Orchestrator does everything | Delegate-mode lead coordinates only | Phase 6 | Clean separation of orchestration and implementation |
| Plans always use subagents | Hybrid detection: subagents for simple, Agent Teams for complex | Phase 6 | Right tool for the right job, graceful fallback |

**Experimental/unstable:**
- Agent Teams API: experimental, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. May change.
- Delegate mode: has known bug (#23447). Workaround implemented at skill level.
- TeammateIdle/TaskCompleted hooks: exit code only (no JSON decision control). Limited compared to PreToolUse.

## Open Questions

1. **Agent Teams Tool Availability in Plugin Context**
   - What we know: Agent Teams tools (TeamCreate, SendMessage, etc.) are available when the env var is set. Megazord runs as a plugin.
   - What's unclear: Whether a plugin's skill can invoke TeamCreate/SendMessage/etc. directly, or whether these are only available in the main session. The `/mz:go` skill runs in the main session context, so this should work, but needs verification.
   - Recommendation: Test in Phase 6 Plan 01. If tools are not available from skill context, the skill can instruct the main agent to use them (the skill's instructions become the main agent's behavior). LOW confidence on this edge case.

2. **Worktree Working Directory for Teammates**
   - What we know: Each teammate gets its own worktree directory. Teammates need to execute code within their worktree (not the main repo).
   - What's unclear: Whether spawned teammates can have their working directory set to the worktree path, or whether they start in the main repo directory. The Task tool documentation does not mention a `cwd` parameter.
   - Recommendation: Include explicit `cd {worktree_path}` as the first instruction in each teammate's task description. The teammate's first action should be to `cd` to its worktree. Verify that all subsequent Bash commands execute in the worktree context.

3. **Concurrent Merges and Main Branch State**
   - What we know: Sequential merge is recommended. But between the merge of agent A and agent B, the main branch state changes.
   - What's unclear: Whether agent B's worktree branch (created from HEAD before agent A's merge) will conflict with post-merge-A main.
   - Recommendation: After merging agent A, rebase agent B's branch onto the updated main before merging B. This ensures B's changes are applied on top of A's. The worktree merge CLI command should support this: `merge --rebase-onto-current`.

4. **Hook Environment Variables for Teammates**
   - What we know: File ownership enforcement relies on `MZ_AGENT_NAME` and `MZ_TEAM_DIR` environment variables being set in the teammate's environment.
   - What's unclear: How to set environment variables for spawned teammates. The Task tool does not have an `env` parameter. SessionStart hooks could set them, but teammates start fresh sessions.
   - Recommendation: Write the ownership context to a file in the worktree directory (e.g., `.mz-agent-context.json`) that the hook script reads instead of relying on environment variables. The teammate's first action writes this file. The hook reads it from `$CLAUDE_PROJECT_DIR/.mz-agent-context.json`.

## Sources

### Primary (HIGH confidence)
- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams) -- Official docs on TeamCreate, SendMessage, TaskList, lifecycle, best practices, limitations
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- Official docs on Task tool, subagent types, built-in agents, tool restrictions, permissionMode
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Full hook event schemas, PreToolUse input format (tool_input.file_path), exit codes, TeammateIdle, TaskCompleted
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide) -- Practical examples including file protection via PreToolUse
- Existing Megazord codebase (verified on disk):
  - `src/lib/plan.ts` -- PlanMetadataSchema with `files_modified`, `computeWaves()`, `detectWaveConflicts()`
  - `src/lib/config.ts` -- Config schema, presets, loadConfig/saveConfig
  - `src/lib/state.ts` -- State management, advancePlan, recordMetric
  - `agents/mz-executor.md` -- Executor agent with commit protocol, deviation rules, review integration
  - `agents/mz-reviewer.md` -- Reviewer agent with two-stage review, severity levels, return format
  - `skills/go/SKILL.md` -- Current orchestrator with wave execution, Task tool spawning
  - `skills/go/executor.md` -- Execution protocol reference
  - `hooks/hooks.json` -- Current (empty) hooks configuration
  - Phase 5 RESEARCH.md -- Established patterns for review-within-executor, nesting depth

### Secondary (MEDIUM confidence)
- [Agent Teams Bug: Delegate Mode Cascades to Teammates](https://github.com/anthropics/claude-code/issues/25037) -- Confirmed bug, closed as duplicate of #23447. Workaround: spawn teammates before entering delegate mode, or enforce at skill level.
- [From Tasks to Swarms: Agent Teams in Claude Code](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/) -- Detailed walkthrough of seven Agent Teams primitives, task lifecycle, QA swarm example
- [Superpowers Issue #469: Agent Teams for Parallel Execution](https://github.com/obra/superpowers/issues/469) -- Comparable framework's architecture for Agent Teams integration (detection, fallback, phased implementation)
- [Git Worktrees for Parallel AI Development](https://www.d4b.dev/blog/2026-02-08-git-worktrees-for-parallel-ai-assisted-development) -- Practical git worktree commands, naming conventions, cleanup procedures
- [Git Worktree Official Documentation](https://git-scm.com/docs/git-worktree) -- Authoritative reference for git worktree commands

### Tertiary (LOW confidence)
- Agent Teams tool availability from plugin skill context -- untested assumption that skills can invoke TeamCreate/SendMessage directly
- Teammate working directory control -- whether Task tool supports setting cwd for spawned teammates
- Hook environment variable propagation to teammates -- untested whether MZ_AGENT_NAME reaches teammate hooks
- Concurrent merge rebase strategy -- theoretical recommendation, needs empirical validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies, all verified in existing codebase
- Architecture (hybrid detection): HIGH -- Extends existing wave computation and conflict detection with straightforward flag handling
- Architecture (Agent Teams lifecycle): MEDIUM -- Based on official docs and community examples, but Agent Teams API is experimental (12 days old) with known bugs
- Architecture (worktree management): HIGH -- git worktree is stable, well-documented, widely used for AI-assisted parallel development
- Architecture (file ownership): MEDIUM -- PreToolUse hook mechanism is well-documented, but ownership enforcement via file manifest is custom design that needs empirical validation
- Architecture (delegate mode): MEDIUM -- Official API has known bug; skill-level enforcement is a workaround, not the intended approach
- Architecture (review feedback loop): MEDIUM -- SendMessage communication pattern is documented, but multi-round review loop between teammates is untested
- Agent Teams availability: LOW -- Experimental feature, may change. Silent fallback is the safety net.
- Teammate cwd control: LOW -- Unverified whether teammates can be directed to work in worktree directories

**Research date:** 2026-02-18
**Valid until:** 2026-03-04 (14 days -- fast-moving domain, experimental API may change)

---
*Phase 6 research for: Agent Teams Integration*
*Researched: 2026-02-18*
