---
name: init
description: Initialize a Megazord project with configuration and planning structure
disable-model-invocation: false
---

# /mz:init

Initialize a new Megazord project or migrate an existing GSD project. This skill guides you through project setup with presets, model selection, workflow preferences, and deep context gathering.

Reference `@skills/init/design-system.md` for all visual output formatting.
Reference `@skills/shared/interview-language.md` for language detection and session-wide persistence rules.

## Step 1: Display Banner

Run the banner script to display the colored Megazord logo (Power Rangers palette, auto-adapts to terminal width):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/banner.sh" "1.1.2"
```

Replace `"1.1.0"` with the actual version from the project's `package.json` if available. If `CLAUDE_PLUGIN_ROOT` is not set, use the plugin's install path (`~/.claude/megazord/scripts/banner.sh`).

## Step 1b: Language Detection

Detect the user's language following the rules in `@skills/shared/interview-language.md`.

The user's first natural-language message determines the session language. If the user's first interaction is just the `/mz:init` command with no additional text, wait until they provide a natural-language response (e.g., answering the first question) and detect from that.

Once detected, apply the language to ALL subsequent output in this session:
- All AskUserQuestion `question` text
- All AskUserQuestion option labels and descriptions
- All summary text and confirmation messages
- All error messages and guidance text

Keep in English regardless of detected language:
- Config keys and values in megazord.config.json
- File names and paths (.planning/*, skills/*)
- Section headers in PROJECT.md, STATE.md (these are machine-readable)
- Command names (/mz:*, /gsd:*)
- Technical terms (TDD, CORTEX, YOLO, etc.)

## Step 2: Environment Detection

Check the current project directory for existing planning structure.

**Detection order:**

1. **Already initialized (Megazord):** If `.planning/megazord.config.json` exists, this project is already set up. Display the current config summary in an action box and ask the user:
   - "This project is already initialized. Would you like to re-initialize (overwrite current config) or run `/mz:settings` to modify settings instead?"
   - If user declines re-init, exit gracefully with: "No changes made. Run `/mz:settings` to modify configuration."

2. **GSD project detected:** If `.planning/config.json` exists WITHOUT a `version` field, this is a GSD project. Reference `@skills/init/migration.md` and follow the GSD migration flow:
   - Read the existing GSD config values
   - Show what was detected: mode, depth, workflow settings, etc.
   - Migrate to Megazord format (add version, quality section, rename config file)
   - Preserve existing `PROJECT.md` content
   - Ask user to confirm or adjust the migrated settings
   - After migration confirmation, skip to Step 8 (write files) with migrated values

3. **Unknown .planning/ directory:** If `.planning/` exists but contains neither `megazord.config.json` nor a GSD-format `config.json`, ask the user:
   - Use AskUserQuestion with header "Conflict" (8 chars), question "A .planning/ directory exists but is not recognized. How should we proceed?"
   - Options: "Overwrite" (description: "Remove existing .planning/ and start fresh"), "Merge" (description: "Keep existing files and add Megazord config alongside"), "Abort" (description: "Exit without changes")
   - If Abort: exit gracefully.

4. **Fresh init:** No `.planning/` directory exists. Proceed to Step 3.

## Step 3: Quick Mode Check

Check if the user invoked `/mz:init --quick` or `/mz:init quick` (look for "quick" flag in the conversation context).

**If quick mode:**
- Ask only for the project name using AskUserQuestion:
  - header: "Project" (7 chars)
  - question: "What is this project called?"
  - (freeform text response)
- Apply strict preset defaults for all settings.
- Skip Steps 4-7. Jump directly to Step 8 (write files).
- Create a minimal `PROJECT.md` with just the project name and a note: "Run `/mz:init` without `--quick` for full project context gathering."

**If not quick mode:** Continue to Step 4.

## Step 4: Preset Selection

Reference `@skills/init/presets.md` for the full toggle values of each preset.

Use AskUserQuestion:
- header: "Profile" (7 chars)
- question: "Select your quality profile (you can customize individual settings next)"
- options:
  - "Strict (Recommended)" -- description: "Everything on: TDD, auto review, brainstorming, CORTEX, systematic debug"
  - "Balanced" -- description: "Review + brainstorming on, TDD and CORTEX off"
  - "Minimal" -- description: "Essential base features only"

Translate all option labels and descriptions to the detected session language per `@skills/shared/interview-language.md`. The examples above are in English; adapt to the session language. For example, in Italian: "Strict (Consigliato)" with description "Tutto attivo: TDD, review automatica, brainstorming, CORTEX, debug sistematico".

Record the selected preset. Its toggle values will be used as defaults for all quality and workflow settings.

## Step 5: Model and Workflow Preferences

Collect model and workflow preferences one at a time.

**5a. Model profile:**
Use AskUserQuestion:
- header: "Model" (5 chars)
- question: "AI model profile for planning agents"
- options:
  - "Quality (Recommended)" -- description: "Opus everywhere -- highest quality, higher cost"
  - "Balanced" -- description: "Opus for planning, Sonnet for execution"
  - "Budget" -- description: "Sonnet/Haiku -- fastest, lowest cost"

**5b. Execution mode:**
Use AskUserQuestion:
- header: "Mode" (4 chars)
- question: "Execution mode"
- options:
  - "YOLO (Recommended)" -- description: "Autonomous execution, minimal prompts"
  - "Interactive" -- description: "Confirm before each major action"

**5c. Planning depth:**
Use AskUserQuestion:
- header: "Depth" (5 chars)
- question: "Planning depth"
- options:
  - "Comprehensive (Recommended)" -- description: "Deep research, thorough planning, full verification"
  - "Standard" -- description: "Balanced research and planning"
  - "Quick" -- description: "Minimal planning, fast execution"

**5d. Git tracking:**
Use AskUserQuestion:
- header: "Git" (3 chars)
- question: "Git tracking for planning docs"
- options:
  - "Yes (Recommended)" -- description: "Commit .planning/ changes alongside code"
  - "No" -- description: "Skip planning doc commits"

## Step 6: Quality Customization Gate

Ask the user whether they want to customize individual quality settings or use the selected preset's defaults.

Use AskUserQuestion:
- header: "Customize" (9 chars)
- question: "Would you like to customize individual quality settings, or use the {selected preset} defaults?"
- options:
  - "Use defaults" -- description: "Apply {preset name} profile as-is"
  - "Customize" -- description: "Override individual quality toggles"

**If "Use defaults":** Skip to Step 7.

**If "Customize":** Show AskUserQuestion for each quality toggle. Only present toggles that the selected preset enables/disables -- show the current preset value as context.

- header: "TDD" (3 chars), question: "Test-driven development", options: "On" / "Off"
- header: "Review" (6 chars), question: "Code review mode", options: "Auto" / "Manual" / "Off"
- header: "Brainstorm" (10 chars), question: "Socratic brainstorming before implementation", options: "On" / "Off"
- header: "CORTEX" (6 chars), question: "CORTEX adaptive thinking", options: "On" / "Off"
- header: "Debug" (5 chars), question: "Debugging approach", options: "Systematic" / "Quick"

After all overrides are collected, merge them with the preset values.

## Step 7: Deep Context Gathering

Reference `@skills/init/questioning.md` for the full questioning methodology.

### 7a. Auto-detect (if codebase exists)

Check if the project has existing code by looking for common markers: `package.json`, `src/`, `*.ts`, `*.tsx`, `Cargo.toml`, `go.mod`, `requirements.txt`, `pyproject.toml`, etc.

**If existing code found:**
- Read `package.json` (if present): extract name, dependencies, devDependencies, scripts
- Glob for file patterns: `**/*.{ts,tsx,js,jsx,py,rs,go}` to determine language distribution
- Glob for config files: `*.config.{ts,js,json,mjs}` to detect tooling
- Glob for tests: `**/*.test.*`, `**/*.spec.*` to detect test patterns
- Check git history: `git log --oneline -10` for recent activity and patterns

Present findings to the user:
```
╔═══════════════════════════════════════════════════════╗
║  Auto-Detected Project Context                        ║
╠═══════════════════════════════════════════════════════╣
║  Language:    {detected language}                      ║
║  Runtime:     {detected runtime}                       ║
║  Testing:     {detected test framework}                ║
║  Linting:     {detected linter}                        ║
║  Building:    {detected build tool}                    ║
╚═══════════════════════════════════════════════════════╝
```

Ask: "Does this look correct? Anything to add or correct?"

If the project name was not set yet, use the name from `package.json` as the default and confirm with the user.

### 7b. Deep Questions

Conduct the deep questioning conversation in the detected session language. Questions, follow-ups, summaries, and acknowledgments are all in the user's language. Project data captured from answers (requirements, constraints, decisions) is written in the language the user provides -- do not translate user-provided content.

Gather comprehensive project context through conversational questions. There is no artificial limit on questions -- be thorough. This is where `/mz:init` becomes valuable.

Follow the methodology in `@skills/init/questioning.md`. Core areas to cover:

1. **Project identity:** What is this project? One-sentence elevator pitch. (If not already captured from auto-detect or quick mode.)
2. **Core value:** What is the single most important thing this project must do well?
3. **Requirements:** What must it do? What is explicitly out of scope?
4. **Tech stack:** Technologies, frameworks, libraries (validate auto-detected or gather fresh).
5. **Conventions:** Code style, naming patterns, architectural patterns, commit conventions.
6. **Constraints:** Timeline, team size, performance requirements, compliance, budget.
7. **Key decisions:** Any decisions already made that future development should respect.

Build the `PROJECT.md` content from gathered context using the fixed section structure:
- What This Is
- Core Value
- Requirements (Validated, Active, Out of Scope)
- Context
- Constraints
- Key Decisions

## Step 8: Write Files

Create all project initialization files.

### 8a. Create directory structure
```
.planning/
```
Ensure the `.planning/` directory exists (create if needed).

### 8b. Write megazord.config.json

Write `.planning/megazord.config.json` with all collected settings. Use the config schema from `src/lib/config.ts` as the canonical structure. Format with 2-space indentation.

**Auto-detect the Megazord plugin directory before writing:**
1. Check: does `~/.claude/plugins/mz/bin/megazord.mjs` exist? (run `ls ~/.claude/plugins/mz/bin/megazord.mjs 2>/dev/null`)
   - If found: set `plugin_path` to the expanded absolute path of `~/.claude/plugins/mz` (e.g., `/Users/username/.claude/plugins/mz`)
2. If not found (e.g., plugin loaded via `--plugin-dir`): Ask the user for the plugin directory path using AskUserQuestion:
   - header: "Plugin" (6 chars)
   - question: "Where is the Megazord plugin directory? (e.g., /path/to/Megazord)"
   - options: freeform text response
3. Include `plugin_path` in the config JSON.

```json
{
  "version": 1,
  "project_name": "{collected project name}",
  "plugin_path": "{detected or user-provided plugin path}",
  "mode": "{yolo|interactive}",
  "depth": "{comprehensive|standard|quick}",
  "parallelization": true,
  "commit_docs": {true|false},
  "model_profile": "{quality|balanced|budget}",
  "quality": {
    "tdd": {true|false},
    "review": "{auto|manual|off}",
    "brainstorming": {true|false},
    "cortex": {true|false},
    "debug": "{systematic|quick}"
  },
  "workflow": {
    "research": {true|false},
    "plan_check": {true|false},
    "verifier": {true|false}
  }
}
```

### 8c. Write PROJECT.md

Write `.planning/PROJECT.md` with the gathered context. Use the fixed section structure:

```markdown
# {Project Name}

## What This Is
{One-paragraph description of the project}

## Core Value
{The single most important thing this project must do well}

## Requirements

### Validated
(None yet -- ship to validate)

### Active
{Bullet list of requirements gathered during init}

### Out of Scope
{Bullet list of explicitly excluded items}

## Context
{Technical context, ecosystem, prior art, etc.}

## Constraints
{Stack, timeline, team, performance, compliance constraints}

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
{Decisions captured during init}

---
*Last updated: {date} after initialization*
```

For quick mode, create a minimal version with just the project name and placeholder sections.

### 8d. Write STATE.md

Write `.planning/STATE.md` with initial project state:

```markdown
# Project State

## Project Reference
See: .planning/PROJECT.md (updated {date})
**Core value:** {core value from PROJECT.md}
**Current focus:** Initialized -- ready for planning

## Current Position
Phase: 0 (Initialized)
Plan: None
Status: Ready
Last activity: {date} -- Project initialized with /mz:init

Progress: [░░░░░░░░░░] 0%

## Accumulated Context

### Decisions
None yet.

### Pending Todos
None yet.

### Blockers/Concerns
None.

## Session Continuity
Last session: {date}
Stopped at: Project initialized
Resume file: .planning/PROJECT.md
```

## Step 9: Summary and Next Steps

Display a summary of what was created using an action box from the design system:

```
╔═══════════════════════════════════════════════════════╗
║  Project Initialized                                  ║
╠═══════════════════════════════════════════════════════╣
║  ✓ .planning/megazord.config.json                     ║
║  ✓ .planning/PROJECT.md                               ║
║  ✓ .planning/STATE.md                                 ║
╚═══════════════════════════════════════════════════════╝
```

Show config summary:

```
╔═══════════════════════════════════════════════════════╗
║  Configuration Summary                                ║
╠═══════════════════════════════════════════════════════╣
║  ▸ Profile:   {preset name}                           ║
║  ▸ Model:     {model profile}                         ║
║  ▸ Mode:      {yolo|interactive}                      ║
║  ▸ Depth:     {comprehensive|standard|quick}          ║
║  ▸ Quality                                            ║
║    TDD: {✓/✗}  Review: {auto/manual/off}              ║
║    Brainstorm: {✓/✗}  CORTEX: {✓/✗}                  ║
║    Debug: {systematic/quick}                          ║
╚═══════════════════════════════════════════════════════╝
```

Suggest adding to the project's CLAUDE.md:
```
Tip: Consider adding to your CLAUDE.md:
  "This project uses Megazord. Run /mz:status for current state."
```

End with the next-up block:

```
═══════════════════════════════════════════════════════
▸ Next Up
**Create Your Roadmap** -- plan your project phases and milestones
`/mz:plan`
═══════════════════════════════════════════════════════
```

For greenfield projects (no existing code detected), offer to auto-advance: "Would you like to start roadmap creation now?"
