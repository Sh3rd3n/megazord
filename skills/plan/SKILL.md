---
name: plan
description: Plan a phase into executable tasks with dependencies and waves
disable-model-invocation: false
---

# /mz:plan

Plan a phase by orchestrating research and planning agents. Produces PLAN.md files with task breakdown, dependencies, and completion criteria.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/plan/agents.md` for agent definitions and spawning patterns.

## Step 1: Display Banner

Output the stage banner:

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► PLANNING                       ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Project Context

Read `.planning/megazord.config.json`. If missing, display an error box and stop:

```
╔═══════════════════════════════════════════════╗
║  ✗ Project Not Initialized                    ║
╠═══════════════════════════════════════════════╣
║  No megazord.config.json found.               ║
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

If config exists, continue loading:
- Read `.planning/STATE.md` for current position.
- Read `.planning/ROADMAP.md` for phase listing.
- Parse the user's message for arguments:
  - A phase number (e.g., `/mz:plan 3` or `/mz:plan phase 3`)
  - The `--skip-research` flag
  - Phase management subcommands: `add-phase`, `remove-phase`, `insert-phase` (see Step 2b)

Store all loaded content in memory -- it will be embedded in Task prompts later.

### Brownfield Codebase Map Detection

After loading config, check for codebase map integration:

1. Check if `.planning/codebase/SUMMARY.md` exists.
2. **If it exists:** Read the summary content and store it in memory for later embedding in the planner prompt (Step 6).
   ```
   > Codebase Map
     ✓ Loaded codebase summary (.planning/codebase/SUMMARY.md)
   ```
3. **If it does NOT exist** but existing code is detected (check for the presence of any of these in the project root: `package.json`, `src/`, `lib/`, `app/`, `Cargo.toml`, `go.mod`, `requirements.txt`, `pyproject.toml`, or `pom.xml`):
   Display a soft warning:
   ```
   > Brownfield
     ! Existing code detected but no codebase map found.
     Run /mz:map first for better roadmap quality, or continue without.
   ```
   Use AskUserQuestion (header: "Brownfield", 10 chars):
   - "Continue without map"
   - "Run /mz:map first" (display "Run `/mz:map` to analyze the codebase, then re-run `/mz:plan`." and exit)
4. **If no codebase map and no existing code detected:** Skip silently (greenfield project, no map needed).

Determine the plugin path:
1. Read `plugin_path` from the config JSON.
2. If `plugin_path` is not set in config, try `~/.claude/plugins/mz`. Check if `~/.claude/plugins/mz/bin/megazord.mjs` exists.
3. If neither exists, display error and stop:
   > Plugin path not configured. Run `/mz:settings` and set `plugin_path`, or re-run `/mz:init`.

## Step 2b: Phase Management Subcommands

Parse the user's message for phase management subcommands. If a subcommand is detected, handle it directly without spawning researcher/planner agents:

### `/mz:plan add-phase {description}`

Add a new phase to the end of the roadmap.

1. Run:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools roadmap add-phase --description "{description}"
   ```
2. Parse the JSON result.
3. Display success:
   ```
   > Phase Management
     ✓ Phase {N} added: {description}
   ```
4. Exit (do not proceed to regular planning).

### `/mz:plan remove-phase {N}`

Remove an unstarted phase from the roadmap.

1. Validate the phase number is provided.
2. Run:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools roadmap remove-phase --phase {N}
   ```
3. If error (phase is completed or in-progress): display the error message and exit.
4. Display success with renumbering info:
   ```
   > Phase Management
     ✓ Phase {N} removed. Subsequent phases renumbered.
   ```
5. Exit.

### `/mz:plan insert-phase {N} {description}`

Insert a new phase after phase N using decimal numbering.

1. Parse the after-phase number and description from the user's message.
2. Run:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools roadmap insert-phase --after {N} --description "{description}"
   ```
3. Parse the JSON result for the assigned phase number (decimal, e.g., 6.1).
4. Display success:
   ```
   > Phase Management
     ✓ Phase {result_number} inserted after Phase {N}: {description}
   ```
5. Exit.

**If no subcommand is detected:** Proceed to Step 3 (normal planning flow).

## Step 3: Determine Target Phase

**If a phase number was provided in the user's message:** Use that phase number. Find its details in ROADMAP.md.

**If no phase number provided:** Detect the next unplanned phase. Scan ROADMAP.md for the first phase that:
1. Is not marked complete (`- [x]`)
2. Has no PLAN.md files in its phase directory under `.planning/phases/`

To check for PLAN.md files, use Glob: `.planning/phases/{padded}-*/*-*-PLAN.md` where `{padded}` is the zero-padded phase number (e.g., `03`).

**If no ROADMAP.md exists:** This is a new project that needs a roadmap. Handle this:

1. Use AskUserQuestion:
   - header: "Roadmap" (7 chars)
   - question: "No roadmap found. Would you like to create one?"
   - options: "Yes, create roadmap" / "No, use /mz:quick instead"

2. If "Yes, create roadmap":
   - Ask the user to describe their project vision and goals
   - Based on their description, create a ROADMAP.md in `.planning/` following the established format (see existing ROADMAP.md for structure reference)
   - Break the vision into 4-8 phases with clear goals, dependencies, and requirements
   - Write the ROADMAP.md file
   - After creation, proceed to plan the first phase

3. If "No, use /mz:quick instead":
   - Display: "For quick tasks without project structure, use `/mz:quick`"
   - Exit

**If all phases are planned:** Display: "All phases in the roadmap are planned. Run `/mz:go` to execute."

Display the target phase:
```
▸ Target
  Phase {N}: {Phase Name}
```

### Verification Gate Enforcement

After determining the target phase and BEFORE any research or planning, check the verification gate for the previous phase:

1. **If the target phase number is > 1:** Check the previous phase's verification status:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools roadmap check-gate --phase {N-1}
   ```
2. Parse the JSON result.
3. **If verification is not passed** (no VERIFICATION.md or status is not "passed" or "human_needed"):
   Display a strong warning (advisory, not blocking -- the user has final authority):
   ```
   > Verification Gate
     ! Phase {N-1} has not passed verification.
     Run /mz:verify {N-1} before planning Phase {N}.
   ```
   Use AskUserQuestion (header: "Gate", 4 chars):
   - "Continue anyway" (proceed with planning)
   - "Run /mz:verify first" (display "Run `/mz:verify {N-1}` to verify the previous phase first." and exit)
4. **If verification passed** (status is "passed" or "human_needed"):
   Display confirmation:
   ```
   > Verification Gate
     ✓ Phase {N-1} verified
   ```
5. **If the target phase is 1:** Skip the verification gate (no previous phase to check).

**Important:** Phase transitions remain manual. The gate is a warning, not a hard block. The user always decides whether to proceed.

## Step 4: Soft Check for CONTEXT.md

Check if `{phase_dir}/{padded}-CONTEXT.md` exists (e.g., `.planning/phases/03-core-skills-and-state-management/03-CONTEXT.md`).

**If CONTEXT.md exists:** Read it and store content for later embedding. Display:
```
▸ Context
  ✓ Found {padded}-CONTEXT.md
```

**If CONTEXT.md is missing:** Display a warning (not an error):
```
▸ Context
  ⚠ No context found for Phase {N}. Run /mz:discuss first for better results, or continue without.
```

Use AskUserQuestion:
- header: "Context" (7 chars)
- question: "Continue planning without context?"
- options: "Continue" / "Run /mz:discuss first"

If "Run /mz:discuss first": Display "Run `/mz:discuss {N}` to gather context for this phase." and exit.
If "Continue": Proceed without CONTEXT.md content.

**Important:** This is a soft check -- warn but do not block. The user decides.

## Step 5: Research Phase (conditional)

Determine whether to run research:

1. **Check config:** Read `workflow.research` from megazord.config.json. If false, skip research.
2. **Check flag:** If `--skip-research` was in the user's arguments, skip research.
3. **Check existing:** If `{phase_dir}/{padded}-RESEARCH.md` already exists, skip research and use the existing file.

**If research should run:**

Display:
```
▸ Research
  ◆ Researching Phase {N}...
```

Spawn the researcher agent:

1. Read `{plugin_path}/agents/mz-researcher.md` file content into memory.
2. Read all context files into memory: STATE.md, ROADMAP.md, CONTEXT.md (if exists).
3. Extract the relevant phase section from ROADMAP.md -- the `### Phase {N}: {Name}` section, not the entire roadmap. Include the phase goal, dependencies, requirements, and success criteria.
4. Spawn researcher via Task tool:
   - `subagent_type`: "general-purpose"
   - `description`: "Research Phase {N}: {Name}"
   - `prompt`: Compose the prompt with all content inline (see agents.md for the exact pattern):
     - Agent definition text from mz-researcher.md
     - Project state from STATE.md
     - Phase section from ROADMAP.md
     - Context decisions from CONTEXT.md (if available)
     - Output path: `{phase_dir}/{padded}-RESEARCH.md`

5. Wait for completion. After the researcher finishes, read the produced RESEARCH.md.

Display:
```
▸ Research
  ✓ Research complete: {padded}-RESEARCH.md
```

**If research was skipped (flag):**
```
▸ Research
  ○ Skipped (--skip-research)
```

**If research already exists:**
```
▸ Research
  ✓ Using existing {padded}-RESEARCH.md
```

Read the existing or newly created RESEARCH.md content into memory for the planner.

## Step 6: Create Plans

Gather all context for the planner:
- STATE.md content
- ROADMAP.md phase section (not the entire file -- extract the relevant `### Phase {N}` section including goal, requirements, success criteria)
- RESEARCH.md content (from step 5)
- CONTEXT.md content (if exists, from step 4)
- megazord.config.json content (for depth, mode, quality settings)
- Previous phase SUMMARY.md files (if relevant, for established patterns)
- Codebase summary (if loaded in Step 2 brownfield detection)

Display:
```
▸ Planning
  ◆ Creating plans for Phase {N}...
```

Read `{plugin_path}/agents/mz-planner.md` file content into memory.

Spawn the planner via Task tool:
- `subagent_type`: "general-purpose"
- `description`: "Plan Phase {N}: {Name}"
- `prompt`: Compose the prompt with all content inline (see agents.md for the exact pattern):
  - Agent definition text from mz-planner.md
  - Project state from STATE.md
  - Phase section from ROADMAP.md
  - Research findings from RESEARCH.md
  - Context decisions from CONTEXT.md (if available)
  - Config content from megazord.config.json
  - Requirement IDs that must be covered (from the phase's requirements list in ROADMAP.md)
  - Depth setting from config
  - Codebase context (if loaded from brownfield detection in Step 2), embedded as:
    ```
    <codebase_context>
    {content of .planning/codebase/SUMMARY.md}
    </codebase_context>
    ```
    This gives the planner awareness of existing architecture, tech stack, conventions, and concerns when creating brownfield roadmaps.
  - Output directory: `{phase_dir}/`

Wait for completion. The planner writes PLAN.md files directly to the phase directory.

Verify plans were created by listing files matching `{phase_dir}/{padded}-*-PLAN.md` using Glob.

If no plans were created, display an error:
```
╔═══════════════════════════════════════════════╗
║  ✗ Planning Failed                            ║
╠═══════════════════════════════════════════════╣
║  No PLAN.md files were created.               ║
║  Check the phase requirements and try again.  ║
╚═══════════════════════════════════════════════╝
```

Display:
```
▸ Planning
  ✓ Created {N} plan(s)
```

## Step 7: Update State

After plans are created:

1. Count the created PLAN.md files.
2. Update STATE.md position via Bash:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools state update-position --phase {N} --total-phases {M} --phase-name "{Name}" --plan 0 --total-plans {plan_count} --status "Planned" --last-activity "{date} -- Phase {N} planned ({plan_count} plans)"
   ```
   Where `{plugin_path}` is resolved by reading the plugin.json location (the Megazord plugin directory).

3. Update ROADMAP.md: In the phase's `Plans:` section, replace placeholder entries with actual plan filenames and brief objectives. Read each PLAN.md file's `<objective>` section to extract the brief objective text.

   For example, replace:
   ```
   Plans:
   - [ ] 03-01: TBD
   ```
   With:
   ```
   Plans:
   - [ ] 03-01-PLAN.md -- State management library and CLI tooling
   - [ ] 03-02-PLAN.md -- /mz:plan skill with agent definitions
   ```

4. Update SESSION continuity in STATE.md via Bash:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools state update-session --last-session "{date}" --stopped-at "Phase {N} planned" --resume-file "{phase_dir}/{padded}-01-PLAN.md"
   ```

## Step 8: Present Results

Display a plan summary using the design system action box:

```
╔═══════════════════════════════════════════════╗
║  Phase {N} Planned                            ║
╠═══════════════════════════════════════════════╣
║  Plans: {count}                               ║
║                                               ║
║  01: {brief objective from plan 01}           ║
║  02: {brief objective from plan 02}           ║
║  ...                                          ║
║                                               ║
║  Wave 1: {plans in wave 1}                    ║
║  Wave 2: {plans in wave 2} (if applicable)    ║
╚═══════════════════════════════════════════════╝
```

End with the Next Up block:

```
═══════════════════════════════════════════════════
▸ Next Up
**Execute Phase {N}** -- start with plan 01
`/mz:go`
═══════════════════════════════════════════════════
```

## Error Handling

- **Config missing:** Step 2 catches this and suggests `/mz:init`. Exit.
- **ROADMAP missing:** Step 3 handles roadmap creation or suggests `/mz:quick`. Exit.
- **CONTEXT missing:** Step 4 warns but continues (soft check per user decision).
- **Research fails:** If the researcher Task fails, display the error and ask if the user wants to continue without research or retry.
- **Planning fails:** If no PLAN.md files are produced, display error and exit.
- **State update fails:** Log warning but don't block -- plans are already written.

## Notes

- All file contents are read BEFORE spawning Task subagents and embedded as inline text. @file references do NOT work across Task boundaries.
- The plan skill is the conductor; agents are the musicians. The skill handles flow, error cases, and state updates. Agents do the domain work.
- Keep subagent prompts focused: only include context relevant to the agent's task. Don't dump the entire project state into the researcher prompt if only the phase section is needed.
- The `{plugin_path}` for CLI commands and agent files is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`.
