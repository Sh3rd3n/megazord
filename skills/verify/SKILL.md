---
name: verify
description: Verify phase deliverables match acceptance criteria
disable-model-invocation: false
---

# /mz:verify

Verify that a phase achieved its GOAL by performing goal-backward verification against ROADMAP.md success criteria and PLAN.md must_haves. Spawns a verifier subagent via the Task tool that checks truths, artifacts (3-level), key links, and requirement coverage against the actual codebase. Produces VERIFICATION.md with results.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/verify/verifier.md` for verification protocol and spawning patterns.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > VERIFY                            |
+===============================================+
```

## Step 2: Load Context and Validate

Read `.planning/megazord.config.json`. If missing, display error and stop:

```
+===============================================+
|  X Project Not Initialized                    |
+-----------------------------------------------+
|  No megazord.config.json found.               |
|  Run /mz:init to set up your project first.   |
+===============================================+
```

If config exists, continue loading:
- Read `.planning/STATE.md` for current position.
- Read `.planning/ROADMAP.md` for phase details and success criteria.

Parse the user's message (text after `/mz:verify`) for arguments:
- `{phase_num}` -- verify a specific phase (optional, defaults to current)
- `--partial` -- verify even if some plans are incomplete (skip completion check)

Determine the plugin path for CLI commands. The Megazord plugin directory is resolved from the skill's location. Use the path to the `bin/megazord.mjs` CLI entry point for all tool commands:

```bash
node {plugin_path}/bin/megazord.mjs tools plan incomplete --phase-dir {phase_dir}
```

## Step 3: Determine Target Phase

- If phase number argument provided: use that phase.
- Otherwise: use current phase from STATE.md.
- Compute the phase directory path (e.g., `.planning/phases/05-code-review-and-verification`).
- Extract phase goal and success criteria from ROADMAP.md.

Display:
```
> Target
  Phase {N}: {Name}
  Goal: {phase goal from ROADMAP.md}
```

## Step 4: Check Plan Completion

```bash
node {plugin_path}/bin/megazord.mjs tools plan incomplete --phase-dir {phase_dir}
```

- If incomplete plans exist AND `--partial` was NOT provided:
  Display warning listing incomplete plans. Ask user whether to proceed with partial verification or wait:
  ```
  > Warning: Incomplete Plans
    The following plans have not been executed:
    - {plan_file_1}
    - {plan_file_2}

    Verification may report false gaps for artifacts in unexecuted plans.
    Proceed with partial verification? (yes/no)
    Or run with --partial to skip this check.
  ```
- If incomplete plans exist AND `--partial` was provided: proceed with a note:
  ```
  > Note: Partial verification (--partial). Skipping completion check.
  ```
- If all plans complete: proceed to verification.

## Step 5: Spawn Verifier

1. Read all PLAN.md files in the phase directory (extract must_haves from frontmatter for each).
2. Read all SUMMARY.md files in the phase directory (extract key accomplishments, files, decisions).
3. Read `agents/mz-verifier.md` content using the Read tool.
4. Extract requirement IDs from the phase's ROADMAP.md entry.
5. Compose the Task prompt:

```
<agent_role>
{content of agents/mz-verifier.md}
</agent_role>

<phase_goal>
{Phase goal from ROADMAP.md}
</phase_goal>

<success_criteria>
{Success criteria list from ROADMAP.md, numbered}
</success_criteria>

<plans>
{For each PLAN.md: filename, must_haves section from frontmatter, requirements field}
</plans>

<summaries>
{For each SUMMARY.md: filename, key accomplishments section, key-files, key-decisions}
</summaries>

<requirements>
{Requirement IDs mapped to this phase with their descriptions from REQUIREMENTS.md}
</requirements>

<verification_rules>
- Phase: {phase_number}
- Phase directory: {phase_dir}
- Report path: {phase_dir}/{padded}-VERIFICATION.md
- Mode: hybrid (automated first, user confirmation for ambiguous)
- Criteria sources: ROADMAP.md success criteria + PLAN.md must_haves
</verification_rules>
```

6. Spawn via Task tool:
   - `subagent_type`: `"general-purpose"`
   - `description`: `"Verify Phase {phase_number}: {phase name}"`

7. Wait for completion.

8. Parse the structured result (look for `## VERIFICATION COMPLETE`).

Note: All file contents are read BEFORE spawning the Task subagent and embedded as inline text. @file references do NOT work across Task boundaries. This is the same pattern used by /mz:go for executor spawning (see skills/go/executor.md).

## Step 6: Handle Result

Parse the verification status from the structured result:

### Status: passed

All truths verified, all artifacts exist and are wired, all requirements covered.

Display success:
```
+===============================================+
|  Phase {N} Verification: PASSED              |
+===============================================+
|  Truths: {N}/{N} passed                      |
|  Artifacts: {N}/{N} verified                 |
|  Key Links: {N}/{N} wired                    |
|  Requirements: {N}/{N} covered               |
+===============================================+
```

Suggest advancing to next phase.

### Status: gaps_found

Some truths failed, artifacts missing, or requirements uncovered.

Display gaps clearly with details from VERIFICATION.md:
```
+===============================================+
|  Phase {N} Verification: GAPS FOUND          |
+===============================================+
|  Truths: {passed}/{total} ({failed} failed)  |
|  Artifacts: {passed}/{total}                 |
|  Key Links: {wired}/{total}                  |
|  Requirements: {covered}/{total}             |
+===============================================+
```

Then display each gap:
```
> Gaps

1. [FAILED] {truth/artifact/link description}
   Evidence: {what was checked}
   Expected: {what should exist}
```

Suggest running `/mz:go` to address gaps or re-planning.
Do NOT auto-advance the phase.

### Status: human_needed

Some items need user confirmation.

Display the automated results (passed/failed items) first. Then present each UNCERTAIN item to the user one at a time:

```
> Human Verification Needed

1. {uncertain truth/artifact description}
   Evidence checked: {what was verified}
   Question: Does this satisfy the criteria? (yes/no/partial)
```

Collect user responses. Update the overall status based on responses:
- All "yes": upgrade to passed (or gaps_found if other items failed)
- Any "no": mark as failed, overall status becomes gaps_found
- Any "partial": mark as warning, note in report

Re-write VERIFICATION.md with user confirmations included.

## Step 7: Post-Verification Summary

Display Next Up block:

If passed:
```
===============================================
> Next Up
**Phase {N} verified.** Ready for Phase {N+1}.
`/mz:plan`
===============================================
```

If gaps_found:
```
===============================================
> Next Up
**Address gaps first.** Fix issues, then re-verify.
`/mz:go`
===============================================
```

If human_needed (after user confirms all): Update and proceed as passed or gaps_found based on user responses.

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| Config missing | Step 2 | Error box, suggest `/mz:init`. Stop. |
| ROADMAP.md missing | Step 2 | Error box, suggest `/mz:plan`. Stop. |
| Phase not found in ROADMAP | Step 3 | Error message with valid phase numbers. Stop. |
| No plans in phase | Step 4 | Error message, suggest `/mz:plan`. Stop. |
| Verifier subagent fails | Step 5 | Save error, display failure details. Stop. |

## Notes

- All file contents are read BEFORE spawning Task subagents and embedded as inline text. @file references do NOT work across Task boundaries.
- The verifier agent (agents/mz-verifier.md) performs all verification logic. This skill orchestrates: load context, check completion, spawn verifier, handle result.
- Only the orchestrator (this skill) presents UNCERTAIN items to the user in hybrid mode. The verifier identifies them; this skill manages the user interaction.
- The verifier does NOT update STATE.md or ROADMAP.md. State updates happen at the orchestrator level (e.g., /mz:go after phase completion).
- ALWAYS use bun/bunx for JavaScript/TypeScript operations (never npm/npx).
- The `{plugin_path}` for CLI commands is the Megazord plugin directory. Resolve it from the skill's installation location or use a known path.
