---
name: review
description: Two-stage code review (spec compliance + code quality)
disable-model-invocation: false
---

# /mz:review

Perform on-demand two-stage code review (spec compliance + code quality) independently of the /mz:go pipeline. Users can trigger this manually at any time, regardless of the `quality.review` config setting. Spawns a reviewer subagent via the Task tool that checks changes against plan specs and code quality standards.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@agents/mz-reviewer.md` for the review agent definition.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > REVIEW                            |
+===============================================+
```

## Step 2: Parse Arguments and Determine Scope

Parse the user's message (text after `/mz:review`) for the review target:

- `/mz:review` (no args) -- review the most recent commit's changes
- `/mz:review --plan {phase}-{plan}` -- review all changes from a specific plan (diff from before plan started to after plan completed)
- `/mz:review --files path/to/file.ts path/to/other.ts` -- review specific files (diff of uncommitted changes, or latest commit affecting those files)
- `/mz:review --last N` -- review the last N commits

Determine the diff to review based on the scope:

**No args (default):**
```bash
git diff HEAD~1 HEAD
```

**--plan {phase}-{plan}:**
Compute diff range from plan's first to last commit. Read the plan's SUMMARY.md for commit hashes:
1. Read SUMMARY.md in the phase directory for the specified plan.
2. Extract the first and last commit hashes from the Task Commits section.
3. Compute: `git diff {first_commit}~1 {last_commit}`

If SUMMARY.md not found, report error: plan has not been executed yet.

**--files {file1} {file2} ...:**
Check for uncommitted changes first:
```bash
git diff HEAD -- {files}
```
If no uncommitted changes, find latest commit affecting those files:
```bash
git log -1 --format=%H -- {files}
```
Then diff: `git diff {hash}~1 {hash} -- {files}`

**--last N:**
```bash
git diff HEAD~{N} HEAD
```

Display the scope:
```
> Review Scope
  Target: {description of what will be reviewed}
  Files: {count} affected
```

## Step 3: Load Context

- Read `.planning/megazord.config.json` (optional -- review works even without config).
- If a plan is specified (--plan), read the PLAN.md for task definitions and requirements context.
- Determine the plugin path:
  1. Read `plugin_path` from the config JSON (if config was loaded).
  2. If `plugin_path` is not set in config, try `~/.claude/plugins/mz`. Check if `~/.claude/plugins/mz/bin/megazord.mjs` exists.
  3. If neither exists, display error and stop:
     > Plugin path not configured. Run `/mz:settings` and set `plugin_path`, or re-run `/mz:init`.
- Read `{plugin_path}/agents/mz-reviewer.md` content using the Read tool.

## Step 4: Prepare Review Context

1. Get the diff based on the scope determined in Step 2.
2. Identify affected files from the diff:
   ```bash
   git diff --name-only {diff_range}
   ```
3. Read each affected file's full content using the Read tool (skip if diff exceeds approximately 300 lines -- diff alone is sufficient for large changes).
4. If plan context available: extract task definitions and requirements from the PLAN.md frontmatter.
5. Determine the report output path:
   - If within a phase context (plan specified or active phase): `{phase_dir}/{padded}-{plan}-REVIEW-manual.md`
   - If no phase context: `.planning/reviews/REVIEW-{timestamp}.md`
   - Ensure the output directory exists before spawning the reviewer.

## Step 5: Spawn Reviewer

Compose the Task prompt and spawn the reviewer subagent:

```
<agent_role>
{content of agents/mz-reviewer.md}
</agent_role>

<task_definition>
{plan task definition if available, or "Manual review -- no plan context"}
</task_definition>

<diff>
{the computed diff}
</diff>

<affected_files>
{full content of affected files, if diff <= 300 lines}
</affected_files>

<plan_requirements>
{requirements from plan if available, or "Manual review -- no plan requirements"}
</plan_requirements>

<review_rules>
- Phase: {phase_number or "N/A"}
- Plan: {plan_number or "N/A"}
- Task: manual
- Phase directory: {phase_dir or ".planning/reviews"}
- Report path: {computed report path}
- Severity levels: critical (blocks), warning (recommended), info (informational)
- Two separate reports: spec compliance + code quality
- Spec findings MUST cite plan task or requirement (if plan context available)
- Architectural concerns are warning/info only, never critical
</review_rules>
```

Spawn via Task tool:
- `subagent_type`: `"general-purpose"`
- `description`: `"Manual code review: {scope description}"`

Wait for completion.

Note: All file contents are read BEFORE spawning the Task subagent and embedded as inline text. @file references do NOT work across Task boundaries.

## Step 6: Display Results

Parse the structured result (look for `## REVIEW COMPLETE`).

Display results in design system format:
```
+===============================================+
|  Review Complete                              |
+-----------------------------------------------+
|  Scope: {description of what was reviewed}    |
|  Status: {passed | issues_found}              |
|  Critical: {N}                                |
|  Warnings: {N}                                |
|  Info: {N}                                    |
+===============================================+
```

If findings exist, display them organized by severity:

**Critical findings first** (with specific fix suggestions):
```
> Critical Findings

1. [{file}:{line}] {title}
   Issue: {description}
   Fix: {suggestion}
```

**Warning findings second:**
```
> Warnings

1. [{file}:{line}] {title}
   Issue: {description}
   Suggestion: {recommendation}
```

**Info findings last:**
```
> Info

1. [{file}:{line}] {title}
   Note: {description}
```

Display Next Up block:

If passed:
```
===============================================
> Next Up
**Code review passed.** No issues found.
===============================================
```

If issues found:
```
===============================================
> Next Up
**Review the findings above.** Fix critical issues before proceeding.
===============================================
```

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| No git history | Step 2 | Error message, suggest making a commit first. Stop. |
| Plan SUMMARY.md not found | Step 2 | Error: plan not executed. Suggest `/mz:go`. Stop. |
| Empty diff | Step 2 | Info message: no changes to review. Stop. |
| Reviewer subagent fails | Step 5 | Save error, display failure details. Stop. |

## Notes

- This skill works independently of `config.quality.review`. Even if review is set to "off" in config, `/mz:review` can still be invoked manually.
- The reviewer agent (`{plugin_path}/agents/mz-reviewer.md`) is the same agent used by the /mz:go execution pipeline. Reports use the same format and severity levels.
- For plan-scoped reviews, the SUMMARY.md commit hashes are used to compute the diff range covering all tasks in that plan.
- The `{plugin_path}` for CLI commands and agent files is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`.
- ALWAYS use bun/bunx for JavaScript/TypeScript operations (never npm/npx).
