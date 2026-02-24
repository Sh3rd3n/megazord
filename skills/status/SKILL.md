---
name: status
description: Show project progress, current phase, and next actions
disable-model-invocation: false
---

# /mz:status

Display current project progress, phase completion, and recommended next actions. Supports compact (default) and verbose (`--verbose`) modes.

Reference `@skills/init/design-system.md` for all visual output formatting.
Reference `@skills/shared/presentation-standards.md` for content formatting rules.

## Step 1: Display Banner

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► STATUS                         ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Context

Read `.planning/megazord.config.json`. Extract `plugin_path` from the config. If `plugin_path` is not set, try `~/.claude/plugins/mz`. If neither exists, display a warning but continue (status can still show state data without CLI tools).

If the config file does not exist, display:

```
╔═══════════════════════════════════════════════╗
║  ✗ No Megazord project found                  ║
╠═══════════════════════════════════════════════╣
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

Then exit.

Read `.planning/STATE.md` for current position, accumulated context, and session continuity.

Read `.planning/ROADMAP.md` for phase listing and completion status.

## Step 3: Check Verbose Flag

Check if the user's message contains `--verbose` or `-v`. Store the result as a boolean.

## Step 4: Get Progress Data

Run via Bash to get progress JSON:

```bash
node {plugin_path}/bin/megazord.mjs tools progress
```

Parse the JSON result which contains:
- `overall`: overall progress percentage
- `currentPhase`: `{ completed, total }` plan counts
- `bar`: pre-formatted progress bar string

Also run via Bash to get current position:

```bash
node {plugin_path}/bin/megazord.mjs tools state read-position
```

Parse the JSON result which contains:
- `phase`, `totalPhases`, `phaseName`
- `plan`, `totalPlans`
- `status`

Where `{plugin_path}` is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`.

## Step 5: Compact Mode (Default)

Display the project name and current position using heading-based layout (per presentation-standards.md — no action box for regular summaries):

```
### {project_name}

Phase {phase}/{totalPhases}: {phaseName} — {functional_sentence_from_goal}
Plan {plan}/{totalPlans}: {status}
Power: ████░░░░░░ {percentage}%
```

Where `{functional_sentence_from_goal}` is extracted from the phase's Goal field in ROADMAP.md (max 8-10 words, user-centric). This provides inline phase context per presentation-standards.md Section 4.

Calculate `{percentage}` from the `overall` field in the progress JSON. Render the progress bar using Unicode blocks: `█` for filled, `░` for empty (10 characters total).

### Recent Phases

Display the `Recent` section showing the last 3 phases from ROADMAP.md with status symbols, functional descriptions, and progress bars:

```
▸ Recent
  ✓ Phase 1: {name} — {functional_sentence} ({plan_count}/{plan_count})
  ✓ Phase 2: {name} — {functional_sentence} ({plan_count}/{plan_count})
  ◆ ████░░░░░░ Phase 3: {name} — {functional_sentence} ({completed}/{total})
```

Use these status symbols:
- `✓` for completed phases (all plans have SUMMARY.md files, or marked `[x]` in ROADMAP.md)
- `◆` for the current in-progress phase — prepend a progress bar before the phase label
- `○` for pending/future phases

Extract the functional sentence for each phase from the phase's Goal field in ROADMAP.md. Shorten to max 8-10 words. Use user-centric language (what the phase makes possible, not what it technically implements).

### Config

Read the loaded config and display active toggle states:

```
▸ Config
  Model:       {model_profile} ({resolved default model, e.g., "opus"})
  TDD:         {on | off}
  Review:      {auto | manual | off}
  Brainstorm:  {on | off}
  CORTEX:      {on | off}
  Debug:       {systematic | quick}
  Research:    {on | off}
  Plan check:  {on | off}
  Verifier:    {on | off}
```

Map config values to display:
- `model_profile`: Show as "{profile} ({model name})" -- e.g., "quality (opus)", "balanced (sonnet)", "budget (haiku)"
- `quality.tdd`: true -> "on", false -> "off"
- `quality.review`: Show the enum value directly: "auto", "manual", or "off"
- `quality.brainstorming`: true -> "on", false -> "off"
- `quality.cortex`: true -> "on", false -> "off"
- `quality.debug`: Show the enum value directly: "systematic" or "quick"
- `workflow.research`: true -> "on", false -> "off"
- `workflow.plan_check`: true -> "on", false -> "off"
- `workflow.verifier`: true -> "on", false -> "off"

If `model_overrides` has any entries, display them after the Model line:
```
  Overrides:   executor=opus, researcher=haiku
```
Only show the Overrides line if model_overrides is non-empty. Omit entirely if no overrides are set.

### Last Error (if applicable)

Read session continuity from STATE.md. If `Last error` field exists and is not "None", display:

```
▸ Last Error
  {error context from STATE.md}
```

Only show this if the error is from the most recent session. Do not show stale errors.

### Next Up Block

Determine the appropriate next action based on current state:

- If `.planning/` does not exist or no config: suggest `/mz:init`
- If no ROADMAP.md exists: suggest `/mz:plan` (to create roadmap)
- If current phase has no PLAN.md files: suggest `/mz:plan`
- If current phase is mid-execution (plans exist, not all complete): suggest `/mz:go`
- If current phase is complete but not verified: suggest `/mz:verify`
- If all phases are complete: display "All phases complete!"

```
═══════════════════════════════════════════════════
▸ Next Up
**{Task Name}** — Phase {N}: {Name} — {functional_sentence_from_goal}
`/mz:{command}`
═══════════════════════════════════════════════════
```

Extract the functional sentence for the target phase from ROADMAP.md Goal field (max 8-10 words, user-centric).

If NOT verbose, stop here. Do not display verbose sections.

## Step 6: Verbose Mode (--verbose)

If verbose mode was requested, display everything from Step 5 PLUS the following additional sections.

### All Phases

List every phase from ROADMAP.md with status symbol, functional description, plan counts, and duration (from STATE.md Performance Metrics if available) — one line per phase:

```
▸ All Phases
  ✓ Phase 1: {name} — {functional_sentence} ({completed}/{total}) {duration}
  ✓ Phase 2: {name} — {functional_sentence} ({completed}/{total}) {duration}
  ◆ ████░░░░░░ Phase 3: {name} — {functional_sentence} ({completed}/{total})
  ○ Phase 4: {name} — {functional_sentence}
  ○ Phase 5: {name} — {functional_sentence}
```

Duration appears inline for completed phases only (e.g., `~6min`). Future phases show name and functional sentence only — no progress info. The active phase shows a progress bar before the label.

Extract the functional sentence for each phase from the phase's Goal field in ROADMAP.md. Shorten to max 8-10 words, user-centric.

### Config

Same Config section as Step 5 -- display all toggle states in verbose mode as well. This section appears in both compact and verbose output since the user specifically requested config visibility at a glance.

### Current Phase Tasks

If PLAN.md files exist for the current phase, list them with status and functional objectives:

```
▸ Current Phase Tasks
  ✓ Plan 01: {functional_objective} (completed)
  ◆ Plan 02: {functional_objective} (in progress)
  ○ Plan 03: {functional_objective}
```

Where `{functional_objective}` is extracted from each plan's `<objective>` section — user-centric, max 10 words. Use `✓` for plans with a corresponding SUMMARY.md, `◆` for the current plan (next without summary), `○` for remaining plans.

### Performance

Display performance metrics from STATE.md:

```
▸ Performance
  Plans completed: {total}
  Average duration: {avg}min
  Total execution: {total} hours
```

### Decisions

Display recent decisions from STATE.md Accumulated Context section:

```
▸ Decisions
  - {decision 1}
  - {decision 2}
  - {decision 3}
```

Show up to 5 most recent decisions. If more exist, show "... and {N} more in STATE.md".

### Next Up Block

Same as Step 5 -- always end with the Next Up block.
