---
name: settings
description: View and modify Megazord project configuration
disable-model-invocation: false
---

# /mz:settings

View current Megazord configuration and modify individual settings. Changes take effect on the next skill invocation.

Reference `@skills/init/design-system.md` for all visual output formatting.

## Step 1: Load and Display

Display the stage banner:

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► SETTINGS                       ║
╚═══════════════════════════════════════════════╝
```

Read `.planning/megazord.config.json`. If the file does not exist, display:

```
╔═══════════════════════════════════════════════╗
║  ✗ No Megazord config found                   ║
╠═══════════════════════════════════════════════╣
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

Then exit. Do not proceed further.

If the config file exists, parse it and display the current settings:

```
╔═══════════════════════════════════════════════════════╗
║  Current Settings                                     ║
╠═══════════════════════════════════════════════════════╣
║  ▸ Project                                            ║
║    Name:            {project_name}                    ║
║    Mode:            {yolo|interactive}                 ║
║    Depth:           {comprehensive|standard|quick}     ║
║    Parallelization: {✓/✗}                             ║
║    Commit docs:     {✓/✗}                             ║
║                                                       ║
║  ▸ Model                                              ║
║    Profile:         {quality|balanced|budget}          ║
║                                                       ║
║  ▸ Quality                                            ║
║    TDD:             {✓/✗}                             ║
║    Review:          {auto|manual|off}                  ║
║    Brainstorming:   {✓/✗}                             ║
║    CORTEX:          {✓/✗}                             ║
║    Debug:           {systematic|quick}                 ║
║                                                       ║
║  ▸ Workflow                                           ║
║    Research:        {✓/✗}                             ║
║    Plan check:      {✓/✗}                             ║
║    Verifier:        {✓/✗}                             ║
╚═══════════════════════════════════════════════════════╝
```

Use `✓` for `true` values and `✗` for `false` values. Display enum values as-is (e.g., "auto", "systematic").

## Step 2: Modification

Ask the user what they would like to change.

Use AskUserQuestion:
- header: "Setting" (7 chars)
- question: "What would you like to change?"
- options:
  - "Quality" -- description: "TDD, review, brainstorming, CORTEX, debug mode"
  - "Workflow" -- description: "Research, plan check, verifier agents"
  - "Model" -- description: "AI model profile (quality/balanced/budget)"
  - "Execution" -- description: "Mode, depth, parallelization, commit docs"
  - "Done" -- description: "No changes -- exit"

**If "Done":** Display "Settings unchanged." and exit.

### Quality Settings

If the user selects "Quality", present each toggle:

- header: "TDD" (3 chars), question: "Test-driven development (currently: {current value})", options: "On" / "Off"
- header: "Review" (6 chars), question: "Code review mode (currently: {current value})", options: "Auto" / "Manual" / "Off"
- header: "Brainstorm" (10 chars), question: "Socratic brainstorming (currently: {current value})", options: "On" / "Off"
- header: "CORTEX" (6 chars), question: "CORTEX adaptive thinking (currently: {current value})", options: "On" / "Off"
- header: "Debug" (5 chars), question: "Debugging approach (currently: {current value})", options: "Systematic" / "Quick"

### Workflow Settings

If the user selects "Workflow", present each toggle:

- header: "Research" (8 chars), question: "Research agent before planning (currently: {current value})", options: "On" / "Off"
- header: "Plan Check" (10 chars), question: "Plan verification agent (currently: {current value})", options: "On" / "Off"
- header: "Verifier" (8 chars), question: "Post-phase verifier agent (currently: {current value})", options: "On" / "Off"

### Model Profile

If the user selects "Model", present:

- header: "Model" (5 chars), question: "AI model profile (currently: {current value})", options:
  - "Quality" -- description: "Opus everywhere -- highest quality, higher cost"
  - "Balanced" -- description: "Opus for planning, Sonnet for execution"
  - "Budget" -- description: "Sonnet/Haiku -- fastest, lowest cost"

### Execution Settings

If the user selects "Execution", present each setting:

- header: "Mode" (4 chars), question: "Execution mode (currently: {current value})", options: "YOLO" / "Interactive"
- header: "Depth" (5 chars), question: "Planning depth (currently: {current value})", options: "Comprehensive" / "Standard" / "Quick"
- header: "Parallel" (8 chars), question: "Parallel plan execution (currently: {current value})", options: "On" / "Off"
- header: "Git" (3 chars), question: "Commit planning docs (currently: {current value})", options: "Yes" / "No"

### Write Updated Config

After collecting changes, write the updated config back to `.planning/megazord.config.json` with 2-space indentation.

## Step 3: Confirmation

Show what changed:

```
╔═══════════════════════════════════════════════╗
║  Settings Updated                             ║
╠═══════════════════════════════════════════════╣
║  {setting}: {old value} → {new value}         ║
║  {setting}: {old value} → {new value}         ║
╚═══════════════════════════════════════════════╝
```

If no values actually changed (user selected same values), display: "No changes detected. Settings remain the same."

Note: "Changes take effect on the next skill invocation."

Ask if the user wants to change anything else. If yes, return to Step 2. If no, exit with the next-up block:

```
═══════════════════════════════════════════════════
▸ Next Up
**Check Project Status** -- see current progress and next actions
`/mz:status`
═══════════════════════════════════════════════════
```
