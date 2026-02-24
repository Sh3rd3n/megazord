---
name: quick
description: Run a quick task without project ceremony
disable-model-invocation: false
---

# /mz:quick

Execute a one-off task with atomic commit tracking. Skips roadmap and phase planning but respects quality gates from project config. Works with or without an active Megazord project.

Reference `@skills/init/design-system.md` for all visual output formatting.
Reference `@skills/shared/terminology.md` for official term definitions.

## Step 1: Display Banner

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► QUICK                          ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Config

Read `.planning/megazord.config.json`.

**If config exists:** Parse it and note quality settings (TDD, review mode). These will be applied during execution.

**If config does not exist:** That is OK -- quick tasks work without a project. Use defaults:
- TDD: off
- Review: off
- Commit docs: true

## Step 3: Parse Task Description

Look for the task description in the user's message after `/mz:quick`.

**If a description is provided** (e.g., `/mz:quick fix the typo in README.md`):
- Use the text after `/mz:quick` as the task description.

**If no description is provided** (just `/mz:quick` with nothing after):
- Use AskUserQuestion:
  - header: "Quick" (5 chars)
  - question: "What do you want to do?"
  - (freeform text response)

## Step 4: Create Quick Task Directory

Generate a sequential task number and slug:
1. Check `.planning/quick/` directory for existing task directories.
2. Find the highest existing number (from directory names like `001-fix-typo/`), add 1. If none exist, start at 001.
3. Generate a slug from the description: lowercase, replace spaces/special chars with hyphens, max 30 characters.
4. Create the directory: `.planning/quick/{NNN}-{slug}/`

Write a minimal plan file at `.planning/quick/{NNN}-{slug}/{NNN}-PLAN.md`:

```markdown
---
type: quick
task: {NNN}
description: "{task description}"
created: {ISO date}
---

<objective>
{task description}
</objective>

<tasks>
<task type="auto">
  <name>Task 1: {task description}</name>
  <action>{task description}</action>
  <done>{task description} completed and committed.</done>
</task>
</tasks>
```

## Step 5: Execute Inline

This is Phase 3 -- execute the task directly (no subagent delegation).

Read the task description and execute it. This means:
- Understand what the user wants done
- Make the necessary code changes
- Follow standard coding practices

Display progress as you work.

## Step 6: Quality Gates

**If config exists and quality settings are enabled:**

**TDD (if `quality.tdd` is true):**
1. Write a failing test first that validates the expected behavior
2. Run the test to confirm it fails
3. Implement the change
4. Run the test to confirm it passes

**Review (if `quality.review` is "auto"):**
1. After implementation, perform a self-review of all changes
2. Check for: correctness, edge cases, style consistency, potential issues
3. Fix any issues found during review

**If quality gates are off:** Skip directly to commit.

Quick means less ceremony, not less quality. If the user has TDD enabled, quick tasks get TDD too.

## Step 7: Atomic Commit and Tracking

### 7a. Stage and Commit

Stage all files changed by this quick task (NOT `.planning/` files yet -- those come after):

```bash
git add {changed_files}
git commit -m "quick({NNN}): {slug}"
```

Record the commit hash.

### 7b. Write Summary

Write `.planning/quick/{NNN}-{slug}/{NNN}-SUMMARY.md`:

```markdown
---
type: quick
task: {NNN}
completed: {ISO date}
commit: {hash}
---

# Quick Task {NNN}: {description}

{Brief summary of what was done}

## Files Modified
- {file 1}
- {file 2}
```

### 7c. Update STATE.md

Read STATE.md. If a `### Quick Tasks Completed` section exists under `## Accumulated Context`, append to it. If the section does not exist, create it.

Add an entry:
```markdown
- Quick {NNN}: {description} ({commit hash}, {date})
```

Use the Edit tool to add this entry to STATE.md rather than rewriting the whole file.

### 7d. Commit Tracking Files

Stage and commit the quick task tracking files:

```bash
git add .planning/quick/{NNN}-{slug}/
git commit -m "docs(quick-{NNN}): track {slug}"
```

### 7e. Display Confirmation

```
╔═══════════════════════════════════════════════════════╗
║  Quick Task Complete                                  ║
╠═══════════════════════════════════════════════════════╣
║  Task:   {NNN} -- {description}                       ║
║  Commit: {hash}                                       ║
║  Files:  {N} modified                                 ║
╚═══════════════════════════════════════════════════════╝
```

End with the Next Up block suggesting the logical next action:
- If an active project exists: suggest `/mz:status` to see overall progress
- If no active project: suggest `/mz:init` to set up a project

```
═══════════════════════════════════════════════════
▸ Next Up
**{suggestion}** -- {context}
`/mz:{command}`
═══════════════════════════════════════════════════
```
