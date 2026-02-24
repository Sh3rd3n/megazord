---
name: lifecycle
description: Complete milestone lifecycle -- audit, archive, deferred items, and next version preparation
disable-model-invocation: false
---

# /mz:lifecycle

Orchestrate the full milestone lifecycle: audit verification status, archive the current milestone, collect deferred items, and prepare the next version. Uses existing CLI tools (`milestone audit`, `milestone archive`, `milestone create`, `roadmap list`, `roadmap add-phase`) as the execution backbone while providing a guided interactive experience.

**Note:** This skill handles the entire end-of-milestone flow in a single entry point. When audit finds gaps, it proposes gap-closure phases and exits. When audit passes, it proceeds through archive, deferred item collection, and next-version preparation.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/shared/presentation-standards.md` for content formatting rules.
Reference `@skills/shared/terminology.md` for official term definitions.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > LIFECYCLE                         |
+===============================================+
```

## Step 2: Load Context and Validate

Read `.planning/megazord.config.json`. If missing, display error and stop:

```
## Error

Project not initialized — no megazord.config.json found.

`/mz:init`
```

If config exists, continue loading:
- Read `.planning/STATE.md` for current position.
- Read `.planning/ROADMAP.md` for phase details.
- Read `.planning/MILESTONE.md` if it exists (for version detection and phase scope).

Determine the plugin path for CLI commands:
1. Read `plugin_path` from the config JSON.
2. If `plugin_path` is not set in config, try `~/.claude/plugins/mz`. Check if `~/.claude/plugins/mz/bin/megazord.mjs` exists.
3. If neither exists, display error and stop:

```
## Error

Plugin path not configured.

`/mz:settings` to set plugin_path, or `/mz:init` to re-initialize.
```

Parse the user's message (text after `/mz:lifecycle`) for arguments:
- `--skip-audit` -- bypass the audit step entirely (for informal projects)
- `{version}` -- specify the milestone version to archive (optional; auto-detected from MILESTONE.md if present)

Use the resolved `{plugin_path}` for all `node {plugin_path}/bin/megazord.mjs` commands below.

## Step 3: Milestone Status Summary

**LOCKED decision: Always show a milestone status summary before proceeding with any destructive action.**

1. Run `node {plugin_path}/bin/megazord.mjs tools roadmap list` to get all phases.
2. Run `node {plugin_path}/bin/megazord.mjs tools progress` for overall progress.
3. Display a summary box:

```
+===============================================+
|  Milestone Status                             |
+-----------------------------------------------+
|  Version: {version}                           |
|  Total phases: {N}                            |
|  Completed: {M}/{N}                           |
|  Progress: {percentage}%                      |
|                                               |
|  ✓ Phase 1: {Name} — {functional_sentence}   |
|  ✓ Phase 2: {Name} — {functional_sentence}   |
|  ◆ Phase 3: {Name} — {functional_sentence}   |
|  ○ Phase 4: {Name} — {functional_sentence}   |
+===============================================+
```

Use status symbols (✓ complete, ◆ in progress, ○ pending) instead of [done] tags. Extract functional sentences from the phase Goal in ROADMAP.md — one line per phase, never a bare phase number.

4. If no version argument was provided:
   - Check `.planning/MILESTONE.md` for a `version:` field in frontmatter. If found, use it.
   - If no MILESTONE.md or no version field, prompt the user: "What version is this milestone? (e.g., v1.0):"

5. If no completed phases found, display error and stop:

```
## Error

No completed phases found. Complete at least one phase first.

`/mz:go` to execute the current phase.
```

## Step 4: Audit (or Skip)

**If `--skip-audit` was provided:**
Display note and jump to Step 6:
```
> Note: Skipping audit (--skip-audit).
```

**If `--skip-audit` was NOT provided:**

1. Check for existing `MILESTONE-AUDIT.md` in `.planning/`:
   - If found, read it and check the date in the file.
   - If the audit is recent (same day), offer to reuse:
     ```
     > Existing audit from {date} found. Reuse? (yes/re-run)
     ```
   - If user chooses "reuse" and audit passed, proceed to Step 6.
   - If user chooses "reuse" and audit has gaps, proceed to Step 5.

2. If no existing audit or user wants re-run:
   - Determine phase scope: Read MILESTONE.md for `phases:` field. If not available, use all completed phases from ROADMAP.md.
   - Run:
     ```bash
     node {plugin_path}/bin/megazord.mjs tools milestone audit --phases "{comma-separated phase numbers}"
     ```
   - Parse the JSON result.
   - Write the audit results to `.planning/MILESTONE-AUDIT.md` with version, date, status, and per-phase details.

## Step 5: Handle Audit Result

### If `all_passed` is true

Display passed box and proceed to Step 6:

```
+===============================================+
|  Milestone Audit: PASSED                      |
+-----------------------------------------------+
|  Phases verified: {N}/{N}                     |
|  All verification gates passed.               |
+===============================================+
```

### If gaps found

Display gaps clearly with a per-phase status table:

```
+===============================================+
|  Milestone Audit: GAPS FOUND                  |
+-----------------------------------------------+
|  Phases verified: {passed}/{total}            |
|                                               |
|  Failed:                                      |
|  - Phase {N}: {Name} — {reason}              |
|  - Phase {M}: {Name} — No VERIFICATION.md    |
+===============================================+
```

Then propose gap-closure phases:

1. Group gaps by nature (missing verification, failed verification, etc.).
2. For each gap group, propose a new phase:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools roadmap add-phase --description "{gap description}"
   ```
3. Display:
   ```
   > Gap-Closure Proposal
     {N} gap-closure phase(s) proposed to address these gaps.
     After completing them, re-run `/mz:lifecycle` to re-audit.

     Proposed phases:
     - Phase {X}: {description}
     - Phase {Y}: {description}

     Add these phases? (yes/no)
   ```
4. If user confirms:
   - Add phases via CLI tool.
   - Display next steps:
     ```
     ## Next Up

     **Plan gap-closure Phase {X}: {description}** — address audit gaps
     `/mz:plan {X}`

     <sub>`/clear` — start fresh context for the next step</sub>
     ```
5. **EXIT** -- Do NOT proceed to archive when gaps exist.

## Step 6: Confirm Archive

Show what will be archived:

```
+===============================================+
|  Archive Confirmation                         |
+-----------------------------------------------+
|  The following will be archived:              |
|                                               |
|  ROADMAP.md    -> milestones/{ver}-ROADMAP.md |
|  REQUIREMENTS  -> milestones/{ver}-REQUIRE... |
|  phases/       -> milestones/{ver}-phases/    |
|  STATE.md      -> milestones/{ver}-STATE.md   |
|  Git tag: milestone/{version}                 |
+===============================================+
```

Check for duplicate archive: If `milestones/{version}-ROADMAP.md` already exists, display warning:
```
> Warning: Milestone {version} appears already archived.
  Proceeding will overwrite the existing archive.
  Continue? (yes/abort)
```

If no duplicate (or user confirms override):
```
Proceed with archive? (yes/no)
```

## Step 7: Execute Archive

1. Run the archive via CLI:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools milestone archive --version "{version}"
   ```
   Parse the JSON result to confirm archived files.

2. Additionally archive STATE.md manually (since `archiveMilestone()` does not archive STATE.md):
   - Read `.planning/STATE.md`
   - Write contents to `.planning/milestones/{version}-STATE.md`

3. Update MILESTONE.md status from "active" to "archived":
   - Read `.planning/MILESTONE.md`
   - Replace `status: active` with `status: archived`
   - Write back

4. Display archive confirmation:
   ```
   > Archive Complete
     {N} files archived to .planning/milestones/
     Git tag: milestone/{version}
   ```

## Step 8: Collect Deferred Items

**LOCKED decision: Collect deferred items from CONTEXT.md files; user selects which to carry forward.**

1. Scan all `.planning/phases/*/NN-CONTEXT.md` files (glob pattern: `.planning/phases/*/*-CONTEXT.md`).
2. For each file:
   - Read the file content.
   - Extract text between `<deferred>` and `</deferred>` tags.
   - Parse bullet points (lines starting with `- `).
   - Skip entries that are just "None", contain only "None", or match "None -- discussion stayed within phase scope".
3. Strip phase references from items -- present clean action items, not "Phase 6 (Agent Teams Integration)" prefixes.
4. If no deferred items found after filtering:
   ```
   > No deferred items found across phase contexts.
   ```
   Skip to Step 9.
5. If deferred items found, present numbered list:
   ```
   > Deferred Items from {version}

     1. Git worktree isolation for parallel agents
     2. Reviewer feedback loops during execution
     3. Auto-advance to next phase after completion
     4. Agent Teams review-fix loop with direct inter-agent communication
     5. Reviewer-executor real-time feedback via SendMessage
     6. Full clean code audit of entire codebase

     Select which deferred items to carry forward as requirements
     for the next milestone (comma-separated numbers, 'all', or 'none'):
   ```
6. Collect user selection. Parse response:
   - `all` -- carry forward everything
   - `none` -- carry forward nothing
   - `1,3,5` -- carry forward selected items

## Step 9: Prepare Next Version

**LOCKED decisions: Semver bump suggestion with user confirmation; config inherited as-is.**

1. Suggest next version:
   - Parse current version string.
   - Suggest semver major bump by default (e.g., `v1.0` -> `v2.0`).
   - Display:
     ```
     > Next Version
       Current: {version}
       Suggested: {suggestion}

       Next milestone version? (suggested: {suggestion}, or type a version):
     ```

2. Ask for milestone name:
   ```
   Milestone name? (e.g., 'Second Release'):
   ```

3. Confirm version and name with the user before proceeding.

## Step 10: Reset State Files

1. **Create fresh ROADMAP.md:**
   ```markdown
   # Roadmap: {project_name}

   ## Overview

   {project_name} - {next_version}

   ## Phases

   (No phases planned yet. Run `/mz:plan` to create a roadmap.)

   ## Progress

   | Phase | Plans Complete | Status | Completed |
   |-------|----------------|--------|-----------|
   ```

2. **Create fresh STATE.md:**
   ```markdown
   # Project State

   ## Project Reference

   See: .planning/PROJECT.md

   **Core value:** {from archived STATE.md}
   **Current focus:** {next_version} - Ready for planning

   ## Current Position

   Phase: 0 of 0
   Plan: 0 of 0
   Status: Ready for planning
   Last activity: {today} -- Milestone {old_version} archived, starting {next_version}

   Progress: [                    ] 0%

   ## Performance Metrics

   (New milestone -- no metrics yet)

   ## Accumulated Context

   ### Decisions

   (None yet)

   ### Pending Todos

   (None yet)

   ### Blockers/Concerns

   (None)

   ## Session Continuity

   Last session: {today}
   Stopped at: Milestone {next_version} initialized
   Resume file: None
   Stash ref: None
   Last error: None
   ```

3. **Create fresh REQUIREMENTS.md** with selected deferred items as initial requirements:
   ```markdown
   # Requirements: {project_name} {next_version}

   ## Requirements

   | ID | Description | Priority | Status |
   |----|-------------|----------|--------|
   {For each selected deferred item: | NEW-{NN} | {item text} | Medium | Pending |}

   (Requirements will be refined during `/mz:plan` roadmap creation.)
   ```
   If no deferred items were selected, the table has no rows (just the header).

4. **Create new MILESTONE.md** via CLI:
   ```bash
   node {plugin_path}/bin/megazord.mjs tools milestone create --version "{next_version}" --name "{name}" --phases ""
   ```
   Note: phases is empty because the new milestone has no planned phases yet. `/mz:plan` will populate them.

## Step 11: Display Completion

```
+===============================================+
|  Milestone {old_version} Archived             |
+===============================================+
|  Archived: {N} files to milestones/           |
|  Git tag: milestone/{old_version}             |
|  Deferred items carried: {M} of {total}       |
|  Next milestone: {next_version} - {name}      |
+===============================================+
```

```
## Next Up

**Ready for {next_version}: {name}.** Create the roadmap and start planning.
`/mz:plan`

<sub>`/clear` — start fresh context for the next step</sub>
```

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| Config missing | Step 2 | Error box, suggest `/mz:init`. Stop. |
| ROADMAP.md missing | Step 2 | Error box, suggest `/mz:plan`. Stop. |
| No completed phases | Step 3 | Error: "No completed phases found. Complete at least one phase before running lifecycle." Stop. |
| Archive already exists | Step 6 | Warning: "Milestone {version} appears already archived." Ask to proceed or abort. |
| Archive CLI fails | Step 7 | Display error, suggest manual recovery. Stop. |
| No CONTEXT.md files found | Step 8 | Skip deferred items: "No deferred items found." |
| Milestone create fails | Step 10 | Display error with CLI output. State files already reset; suggest manual MILESTONE.md creation. |

## Notes

- All CLI commands use the resolved `{plugin_path}` pattern (from config or fallback `~/.claude/plugins/mz`).
- ALWAYS use bun/bunx for JavaScript/TypeScript operations (never npm/npx).
- The skill does NOT auto-invoke `/mz:plan` after completion -- it suggests it as the next step (matches the verify pattern).
- Configuration (`megazord.config.json`) is inherited as-is per user decision -- no config review prompt on new milestone.
- The skill orchestrates existing CLI tools (`milestone audit`, `milestone archive`, `milestone create`, `roadmap list`, `roadmap add-phase`). It does NOT reimplement their logic.
- `archiveMilestone()` copies files (does not move). Originals remain for gap-closure context. The state reset (Step 10) replaces them with fresh skeletons.
- `archiveMilestone()` does not archive STATE.md. The skill handles this manually in Step 7.
- `archiveMilestone()` does not update MILESTONE.md status. The skill handles this in Step 7.
- Gap-closure iteration has no limit. The user runs `/mz:lifecycle` repeatedly until audit passes.
- Deferred items are extracted from `<deferred>` tags in CONTEXT.md files. Phase references are stripped for clean presentation.
