---
name: pause
description: Save session context for handoff to a future session
disable-model-invocation: false
---

# /mz:pause

Save current session context including progress, decisions, and modified files for seamless handoff to a future Claude Code session.

Reference `@skills/init/design-system.md` for all visual output formatting.

## Step 1: Display Banner

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► PAUSE                          ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Context

Read `.planning/STATE.md` for current position and session continuity.

If STATE.md does not exist or `.planning/` directory is missing, display:

```
╔═══════════════════════════════════════════════╗
║  ✗ No Megazord project found                  ║
╠═══════════════════════════════════════════════╣
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

Then exit.

Read the current position data to build the pause description. Extract:
- Current phase number and name
- Current plan number
- Current status

## Step 3: Stash Modified Files

Build a description string: `"Phase {N}, Plan {M}, {status}"`

Run via Bash to stash any modified files:

```bash
node {plugin_path}/bin/megazord.mjs tools stash pause --description "Phase {N}, Plan {M}, {status}"
```

Where `{plugin_path}` is the absolute path to the Megazord plugin directory (the root of this repository where `package.json` lives).

Parse the JSON result which contains:
- `success`: boolean
- `stashRef`: string or null (the git stash reference if files were stashed)
- `message`: human-readable message

If `success` is false, display a warning but continue with the pause (stash failure should not block state updates).

## Step 4: Update STATE.md

Run via Bash to update session continuity:

```bash
node {plugin_path}/bin/megazord.mjs tools state update-session --stopped-at "Phase {N}, Plan {M}, {status}" --stash-ref "{ref_or_None}" --last-error "None"
```

Also update the status to "Paused" via:

```bash
node {plugin_path}/bin/megazord.mjs tools state update-position --status "Paused"
```

## Step 5: Display Confirmation

Display the pause confirmation in an action box:

```
╔═══════════════════════════════════════════════════════╗
║  Session Paused                                       ║
╠═══════════════════════════════════════════════════════╣
║  Phase: {phase} of {totalPhases} -- {phaseName}       ║
║  Plan:  {plan} of {totalPlans} -- {status}            ║
║  Stash: {stashRef} ({N} modified files)               ║
║  State: .planning/STATE.md updated                    ║
╚═══════════════════════════════════════════════════════╝
```

If no files were stashed, show `Stash: No modified files` instead.

End with:

```
To resume: `/mz:resume`
```
