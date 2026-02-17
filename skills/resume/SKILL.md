---
name: resume
description: Restore context from a previous session and continue work
disable-model-invocation: false
---

# /mz:resume

Restore context from a previous session and display current project state. Shows what was being worked on, restores any stashed files, and suggests the next action -- but does NOT auto-execute.

Reference `@skills/init/design-system.md` for all visual output formatting.

## Step 1: Display Banner

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► RESUME                         ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Context

Read `.planning/STATE.md` for session continuity and current position.

If STATE.md does not exist or `.planning/` directory is missing, display:

```
╔═══════════════════════════════════════════════╗
║  ✗ No Megazord project found                  ║
╠═══════════════════════════════════════════════╣
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

Then exit.

Extract from STATE.md:
- Session continuity: last session date, stopped at, resume file, stash ref, last error
- Current position: phase, plan, status, progress

## Step 3: Restore Stash (if applicable)

Read the stash ref from session continuity.

**If stash ref exists and is not "None":**

Run via Bash to restore stashed files:

```bash
node {plugin_path}/bin/megazord.mjs tools stash resume --stash-ref "{stash_ref}"
```

Where `{plugin_path}` is the absolute path to the Megazord plugin directory (the root of this repository where `package.json` lives).

Parse the JSON result:
- If `success` is true: files were restored. Clear the stash ref in STATE.md by running:
  ```bash
  node {plugin_path}/bin/megazord.mjs tools state update-session --stash-ref "None"
  ```
- If `success` is false and message contains "not found": display note "No pause checkpoint found -- showing last known position" (best-effort recovery)
- If `success` is false and message contains "CONFLICT": display warning with resolution steps:
  ```
  ⚠ Stash conflicts detected. To resolve:
    1. Run `git stash show` to see conflicting files
    2. Resolve conflicts manually
    3. Run `git stash drop` to clean up
  ```

**If no stash ref (None or missing):**

No stash to restore. Continue with context display.

## Step 4: Display Context Summary

Display the session restoration in an action box:

```
╔═══════════════════════════════════════════════════════╗
║  Session Restored                                     ║
╠═══════════════════════════════════════════════════════╣
║  Phase: {phase} of {totalPhases} -- {phaseName}       ║
║  Plan:  {plan} of {totalPlans} -- {status}            ║
║  Stash: {status message}                              ║
║  Last:  {lastSession} -- {stoppedAt}                  ║
╚═══════════════════════════════════════════════════════╝
```

For the Stash line, use:
- `✓ {N} files restored` if stash was successfully popped
- `No modified files stashed` if no stash ref existed
- `⚠ Conflicts -- manual resolution needed` if stash pop had conflicts
- `No pause checkpoint found` if stash ref was invalid/missing

## Step 5: Display Context

Read the resume file path from session continuity. If it points to a PLAN.md file, read it and extract the objective to show what was being worked on.

Display a context section:

```
▸ Context
  {Brief description of what was being worked on, extracted from the resume file or stopped-at field}
```

Read the Accumulated Context > Decisions section from STATE.md. If there are recent decisions, display them:

```
▸ Recent Decisions
  - {decision 1}
  - {decision 2}
```

If no decisions, display `▸ Recent Decisions` with `  (none)`.

## Step 6: Suggest Next Action

Update the status from "Paused" back to "In Progress" via:

```bash
node {plugin_path}/bin/megazord.mjs tools state update-position --status "In Progress"
```

Update the session timestamp:

```bash
node {plugin_path}/bin/megazord.mjs tools state update-session --stopped-at "Resumed from pause"
```

Determine the appropriate next command based on current state (same logic as /mz:status):
- If current phase has no plans: suggest `/mz:plan`
- If mid-execution: suggest `/mz:go`
- If phase complete: suggest `/mz:verify`
- Default: suggest `/mz:go`

Display the Next Up block:

```
═══════════════════════════════════════════════════
▸ Next Up
**{Task description}** -- {brief context}
Would you like to continue with `/mz:{command}`?
═══════════════════════════════════════════════════
```

**IMPORTANT:** Do NOT auto-execute the suggested command. Display the suggestion and wait for the user to invoke it explicitly.
