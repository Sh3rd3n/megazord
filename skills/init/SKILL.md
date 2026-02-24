---
name: init
description: Initialize a Megazord project with configuration and planning structure
disable-model-invocation: false
---

# /mz:init

Initialize a new Megazord project or migrate an existing GSD project. This skill guides you through project setup with presets, model selection, workflow preferences, and deep context gathering.

Reference `@skills/init/design-system.md` for all visual output formatting.
Reference `@skills/shared/interview-language.md` for language detection and session-wide persistence rules.
Reference `@skills/shared/interview-options.md` for option format, ordering, and explanation standards.
Reference `@skills/shared/terminology.md` for official term definitions.

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

## Step 1c: Deep Project Scan

Runs ONCE, immediately after banner display and language detection, BEFORE any questions are asked. This step is SILENT -- no output is shown to the user. Results feed into Steps 2, 7a, and the COME block as pre-filled defaults.

**Scan the project for existing documentation and dependencies:**

- `package.json` -- extract: name, dependencies, devDependencies, scripts, engines, type (ESM vs CJS)
- Config files: `tsconfig.json`, `*.config.{ts,js,json,mjs}`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `requirements.txt`
- Documentation: `README.md`, `CLAUDE.md`, doc folders (`docs/`, `documentation/`)
- CI/CD: `.github/workflows/*`, `Dockerfile`, `docker-compose.yml`
- Existing planning: `.planning/`, `REQUIREMENTS.md`, `TODO.md`
- Source structure: glob for `**/*.{ts,tsx,js,jsx,py,rs,go}` to determine language distribution
- Test patterns: `**/*.test.*`, `**/*.spec.*`
- Git history: `git log --oneline -10`, `git log --format='%an' | sort -u`

**Store scan results internally with source annotations.** Each detected value is tagged with its origin for later use. Examples:

- `{ value: "typescript", source: "tsconfig.json" }`
- `{ value: "vitest", source: "package.json devDependencies" }`
- `{ value: "bun", source: "package.json engines" }`

Scan results flow into:
- **Step 2:** richer detection of project type (greenfield vs brownfield)
- **Step 7a:** auto-detect presentation with source-annotated findings
- **Step 7d (COME block):** pre-filled defaults for every technical choice question

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
Reference `@skills/shared/interview-options.md` for option format and explanation standards.

Use AskUserQuestion:
- header: "Profile" (7 chars)
- question: "Select your quality profile (you can customize individual settings next)"
- options:
  - "Strict (Recommended)" -- description: "Pro: maximum quality, TDD first, automatic reviews. Con: more tokens, longer execution."
  - "Balanced" -- description: "Pro: good quality/speed balance, active reviews. Con: no TDD or CORTEX."
  - "Minimal" -- description: "Pro: maximum speed, zero ceremony. Con: no safety net."

Translate all option labels and descriptions to the detected session language per `@skills/shared/interview-language.md`. The examples above are in English for illustration; adapt to the session language. For example, in Italian: "Strict (Consigliato)" with description "Pro: massima qualità, test prima del codice, review automatiche. Contro: più token, esecuzione più lunga."

This is a personal preference question -- do NOT add "fai tu" / "AI decides" to this step.

Record the selected preset. Its toggle values will be used as defaults for all quality and workflow settings.

## Step 5: Model and Workflow Preferences

Collect model and workflow preferences one at a time.

All selection questions in this step follow the option format from `@skills/shared/interview-options.md`:
- Include pro/contra in each option's description field (translate to session language)
- Order by fitness (recommended first)
- Add "fai tu" / "AI decides" as the last option on technical/opinionated questions (translated to session language)
- Omit "fai tu" on binary operational choices

**5a. Model profile:**
Use AskUserQuestion:
- header: "Model" (5 chars)
- question: "AI model profile for planning agents"
- options:
  - "Quality (Recommended)" -- description: "Pro: best results across all tasks. Con: higher cost, slower."
  - "Balanced" -- description: "Pro: good compromise, Opus where it counts. Con: non-uniform quality."
  - "Budget" -- description: "Pro: very fast, minimum cost. Con: reduced quality on complex tasks."
  - "Fai tu" (translated to session language) -- description: "Claude picks the best profile for your project."

Note: model profile is a technical/opinionated question -- "fai tu" IS appropriate. Translate all labels and descriptions to the session language. The examples above are in English for illustration.

**5b. Execution mode:**
Use AskUserQuestion:
- header: "Mode" (4 chars)
- question: "Execution mode"
- options:
  - "YOLO (Recommended)" -- description: "Pro: smooth execution, no interruptions. Con: less manual control."
  - "Interactive" -- description: "Pro: control over each action. Con: slows workflow, requires constant attention."
  - "Fai tu" (translated to session language) -- description: "Claude picks the mode that fits your project context."

Note: execution mode is an opinionated technical choice -- "fai tu" IS appropriate. Translate all labels and descriptions to the session language.

**5c. Planning depth:**
Use AskUserQuestion:
- header: "Depth" (5 chars)
- question: "Planning depth"
- options:
  - "Comprehensive (Recommended)" -- description: "Pro: deep research, detailed plans, full verification. Con: takes more time."
  - "Standard" -- description: "Pro: good balance between quality and speed. Con: less thorough research."
  - "Quick" -- description: "Pro: fast planning, fast execution. Con: less verification, more risk."
  - "Fai tu" (translated to session language) -- description: "Claude picks the depth that fits your project complexity."

Note: planning depth is an opinionated technical choice -- "fai tu" IS appropriate. Translate all labels and descriptions to the session language.

**5d. Git tracking:**
Use AskUserQuestion:
- header: "Git" (3 chars)
- question: "Git tracking for planning docs"
- options:
  - "Yes (Recommended)" -- description: "Pro: full history, rollback possible. Con: additional commits in the log."
  - "No" -- description: "Pro: cleaner git log. Con: no trace of planning decisions."

Note: Git tracking is a binary operational preference -- do NOT add "fai tu" to this question. Translate labels and descriptions to the session language.

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

Reference `@skills/init/questioning.md` for the full COSA/COME questioning methodology.

### 7a. Auto-detect presentation

The deep scan from Step 1c already collected all available project signals. Now present those findings to the user for validation.

**If Step 1c found existing code or documentation:**

Present detected context in the session language with source annotations:

```
╔═══════════════════════════════════════════════════════╗
║  Auto-Detected Project Context                        ║
╠═══════════════════════════════════════════════════════╣
║  Language:    {detected language}  (source)           ║
║  Runtime:     {detected runtime}   (source)           ║
║  Testing:     {detected framework} (source)           ║
║  Linting:     {detected linter}    (source)           ║
║  Building:    {detected build tool}(source)           ║
╚═══════════════════════════════════════════════════════╝
```

Example in Italian: "Ho rilevato da package.json: progetto TypeScript, runtime Bun, testing Vitest..."

Ask for confirmation/corrections in the session language: "Does this look correct? Anything to add or correct?"

If the project name was not set yet, use the name from `package.json` (source: package.json) as the default and confirm with the user.

**If Step 1c found no existing code (greenfield):** Skip this sub-step. Proceed directly to 7b.

### 7b. COSA Block -- Functional Requirements (WHAT)

Conduct the COSA questioning in the detected session language. This block establishes what the project does BEFORE any technical choices.

**Core COSA areas:**

1. **Project identity:** One-sentence elevator pitch. (Skip if captured from auto-detect.)
2. **Core value:** The single most important thing this project must do well.
3. **Requirements:** Must-have features, nice-to-haves, explicitly out of scope.
4. **Constraints:** Timeline, team size, performance, compliance, budget.

**COSA behavior rules:**

- **Conversational, not interrogative.** No AskUserQuestion selection questions in this block -- freeform dialogue only.
- **Tech mentions during COSA:** When the user mentions a technology (e.g., "I want to use React"), acknowledge it in the session language: "Ottimo, lo segno per dopo" (translated to session language). Record the mention internally as a pre-fill for the COME block. Redirect back to the functional question that was being discussed. Do NOT engage in technical discussion during COSA.
- **Brownfield shortcut:** When Step 1c detected existing code or documentation, shorten COSA. Analyze scan results to deduce functional requirements (from README, code structure, doc folders, test names). Present deduced requirements as a confirmation list in the session language. Frame as "let me confirm what I found" not "let me quiz you." Only ask open-ended COSA questions for items NOT deducible from the scan.

### 7c. Transition Summary

After the COSA block completes, show a mini-summary of all gathered functional requirements in the session language:

```
--- Functional requirements gathered ---
[bullet list of captured WHAT items: identity, core value, requirements, constraints]
---
Ora parliamo di come costruirlo. (translated to session language)
```

Then transition explicitly to the COME block.

### 7d. COME Block -- Technical Choices (HOW)

Gather technical implementation decisions. This block uses AskUserQuestion with the option standards from `@skills/shared/interview-options.md`.

**Core COME areas:**

1. **Tech stack:** Runtime, database, testing, build tools. Validate auto-detected from Step 1c or gather fresh.
2. **Conventions:** Code style, naming patterns, architectural patterns, commit conventions.
3. **Key decisions:** Locked architectural choices, non-negotiable tech, past failures to avoid.

**COME behavior rules:**

- **Use AskUserQuestion for every selection question** per `@skills/shared/interview-options.md` standards (pro/contra, fai tu placement, modern-first ordering).
- **Pre-fill from Step 1c:** When deep scan detected existing dependencies, present them as the default/first option with source annotation. Example description: "Pro: already in use (detected from package.json), zero migration cost. {other pros}. Con: {drawbacks}." (Translate source annotation to session language.)
- **Tech mentions noted during COSA:** When the user mentioned a technology during the COSA block, pre-fill it as the default/first option when that topic comes up in COME.
- **User answer always wins:** When auto-detected values conflict with explicit user answers, accept the user's choice. May note the discrepancy: "Noto che package.json usa X, ma hai scelto Y -- procedo con Y." (translated to session language)
- **Skip already-answered questions:** Questions answered during Step 7a validation do not need to be asked again.

Build the `PROJECT.md` content from gathered context using the fixed section structure:
- What This Is
- Core Value
- Requirements (Validated, Active, Out of Scope)
- Context
- Constraints
- Key Decisions

### 7e. Completeness Validation

After both COSA (7b) and COME (7d) blocks complete, run a single completeness check before writing any files. This step verifies that all mandatory PROJECT.md sections have sufficient content. It does NOT re-ask questions already answered -- it only identifies sections that are empty or placeholder-only.

**Mandatory sections (gap definition):**

A gap is any of the following sections that would be written WITHOUT meaningful content:

1. **What This Is** -- captured from COSA Vision/Purpose
2. **Core Value** -- captured from COSA Vision/Purpose
3. **Requirements -- Active** -- captured from COSA Requirements Elicitation
4. **Context** -- captured from COME Tech Stack
5. **Constraints** -- captured from COSA Constraints + COME Tech Stack
6. **Key Decisions** -- captured from COME Key Decisions

An empty section or a section with only placeholder text ("TBD", "None yet") counts as a gap.

**If gaps are found:**

Present them in the session language using this format:

```
--- Verifica completezza ---
Ho trovato {N} sezione/i senza contenuto sufficiente:

1. [Section name] -- [brief description of what is missing]
2. [Section name] -- [brief description of what is missing]

Posso farti qualche domanda mirata per colmare questi gap, oppure possiamo procedere segnandoli come TBD.
```

(Translate entirely to the detected session language. The example above is Italian for illustration.)

**Gap resolution flow:**

- Ask targeted questions ONE AT A TIME -- never all at once.
- Each question is specific to the missing section:
  - For "Core Value": "Per la sezione 'Core Value', qual e la cosa piu importante che questo progetto deve fare bene?"
  - For "Context": "Qual e il contesto tecnico principale -- su quale stack o ecosistema si basa il progetto?"
  - (Translate each question to the detected session language.)
- After each answer, acknowledge it and move to the next gap.
- The user can respond "skip" or equivalent at any point -- mark that section as "TBD" and continue.

**Skip entire completeness check:**

If the user wants to skip the check entirely, mark ALL gap sections as "TBD" in the PROJECT.md draft and add this note:

```
> Some sections marked TBD -- run `/mz:init` to fill them in later or update PROJECT.md manually.
```

Planning proceeds with the reduced context available. The planner will work with what is there.

**No gaps found:**

If all mandatory sections have content, display a brief confirmation in the session language:

"Tutte le sezioni del PROJECT.md sono complete." (translated to session language)

Then proceed directly to Step 8 without any additional interaction.

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
