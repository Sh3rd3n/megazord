# Phase 5: Code Review and Verification - Research

**Researched:** 2026-02-18
**Domain:** Automated code review via Task tool subagents, review-fix loops, phase verification against acceptance criteria, integration into the /mz:go execution pipeline
**Confidence:** HIGH

## Summary

Phase 5 adds two quality gate components to Megazord: (1) a two-stage code review (spec compliance + code quality) that runs automatically after each task execution within the /mz:go pipeline, and (2) the `/mz:verify` skill that validates phase-level deliverables against ROADMAP.md success criteria and PLAN.md task completion criteria. Both components use Task tool subagents -- the same proven spawning pattern from Phase 4.

The technical challenge is primarily architectural, not library-related: Phase 5 requires zero new npm dependencies. The execution pipeline from Phase 4 (executor subagent per plan, orchestrator tracks state) must be modified so that after each task commit, a reviewer subagent inspects the changes before the executor proceeds to the next task. This means the review loop happens *within* the executor's flow, not at the orchestrator level. The executor reads config to determine if review is enabled (`quality.review: "auto"|"manual"|"off"`), and if so, spawns a reviewer subagent via the Task tool after each task commit. The reviewer returns a structured report; if critical findings exist, the executor auto-fixes and re-reviews (up to a configurable retry limit). The `/mz:verify` skill is a standalone orchestrator skill (modeled on GSD's `gsd-verifier.md` and `verify-phase.md`) that reads ROADMAP.md success criteria and PLAN.md must_haves, then performs goal-backward verification against the actual codebase.

The key design constraint from CONTEXT.md is that this phase uses Task tool subagents only -- Agent Teams coordination (where reviewer and executor can communicate directly via SendMessage) is Phase 6. Phase 5 designs the review flow so Phase 6 can upgrade it: the reviewer agent definition, report format, and severity levels are all reusable.

**Primary recommendation:** Create an `agents/mz-reviewer.md` agent definition with two-stage review protocol. Modify the executor agent (`agents/mz-executor.md`) to invoke review after each task when config enables it. Create an `agents/mz-verifier.md` agent definition adapted from GSD's gsd-verifier.md. Build the `/mz:verify` skill as a standalone orchestrator. Add no new TypeScript library code -- the existing plan parsing, state management, and CLI tools are sufficient.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Review feedback & reporting
- Three severity levels: critical (blocks task), warning (recommended fix), info (informational)
- Two separate reports: one for spec compliance, one for code quality -- not merged
- Reports persisted as markdown files in the phase directory (audit trail)
- Spec compliance findings must cite the specific plan task/requirement not satisfied (explicit traceability)

#### Failure handling
- On critical findings: auto-fix and re-review loop
- Retry limit before escalation to user: Claude's discretion (evaluate case by case)
- Warning handling (block or report-only): Claude's discretion based on quantity and type
- Escalation behavior (stop execution or continue other tasks): Claude's discretion based on severity
- Architectural pushback: reviewer can flag structural concerns as warning/info, but these do NOT block -- the approach is already decided, pushback is advisory only

#### Verification approach
- Hybrid mode: automated check first, then user confirmation only on ambiguous or subjective criteria
- Criteria source: both ROADMAP.md success criteria (phase-level) and PLAN.md task completion criteria (granular)
- Behavior when criteria fail: Claude's discretion based on severity
- Output persistence (VERIFICATION.md): Claude's discretion based on result

#### Review integration point
- Review runs after every individual task (not per-wave or per-plan)
- Dedicated reviewer subagent (separate from executor) -- fresh eyes on the code
- When review is disabled in config: brief one-time notice ("review disabled"), then proceed without
- Auto-fix handler (who fixes after failed review): Claude's discretion -- orchestrator manages the flow with Task tool subagents
- Review feedback format (inline vs summary): Claude's discretion

### Claude's Discretion
- Review report format (inline comments, summary, or both)
- Retry limit for auto-fix before escalation
- Warning blocking behavior
- Escalation strategy (stop vs continue)
- Verification output persistence
- Verification fail behavior (block vs override)
- Auto-fix agent selection (new executor vs reviewer-fixes)

### Deferred Ideas (OUT OF SCOPE)
- Agent Teams review-fix loop with direct inter-agent communication -- Phase 6
- Reviewer-executor real-time feedback via SendMessage -- Phase 6
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | Two-stage code review (spec compliance + code quality) runs automatically when enabled in config | Reviewer agent definition (`agents/mz-reviewer.md`) implements two-stage protocol. Executor agent modified to spawn reviewer after each task when `quality.review === "auto"`. Config schema already has `quality.review: "auto" | "manual" | "off"` (Phase 2). Reports persisted as `{phase_dir}/{padded}-{plan}-REVIEW-{task_num}.md` for audit trail. |
| QUAL-06 | Verification/UAT with `/mz:verify` confirms phase deliverables match acceptance criteria before marking complete | Verifier agent (`agents/mz-verifier.md`) adapted from GSD's goal-backward verification. `/mz:verify` skill reads ROADMAP.md success criteria + PLAN.md must_haves, spawns verifier subagent, generates VERIFICATION.md, and blocks phase transition on failure. Hybrid mode: automated checks first, then user confirmation for ambiguous criteria. |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for any new CLI helpers | Already installed, type safety |
| gray-matter | ^4.0.3 | Parse PLAN.md frontmatter for must_haves extraction | Already installed, used in plan.ts |
| fs-extra | ^11.0.0 | File system operations | Already installed, used everywhere |
| commander | ^14.0.0 | CLI subcommand routing (if new commands needed) | Already installed, used in cli/index.ts |
| zod | ^4.3.0 | Validation of review/verification report structure | Already installed, used in config.ts and plan.ts |

### No Additional Dependencies Needed

Phase 5 requires zero new npm dependencies. The review and verification flows are entirely orchestrated through Markdown skills and Task tool subagent spawning. Review reports are markdown files. Verification logic is grep/file-existence checks executed by the verifier agent. All needed infrastructure exists from Phases 1-4:

- Config schema already has `quality.review: "auto" | "manual" | "off"` (Phase 2, `config.ts` line 15)
- Plan parsing (plan.ts) already extracts frontmatter including `must_haves` and `requirements`
- State management (state.ts) already handles position tracking, session continuity, metrics
- CLI tools already expose all needed operations (plan list, plan incomplete, state advance-plan, etc.)

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (Phase 5 Additions)

```
agents/
├── mz-executor.md              # MODIFY: Add review integration protocol
├── mz-reviewer.md              # NEW: Two-stage code review agent
├── mz-verifier.md              # NEW: Phase verification agent
├── mz-researcher.md            # Existing (no changes)
└── mz-planner.md               # Existing (no changes)

skills/
├── go/
│   └── SKILL.md                # MODIFY: Add review-disabled notice, review config forwarding
│   └── executor.md             # MODIFY: Document review integration point
├── review/
│   └── SKILL.md                # REPLACE: Full /mz:review standalone skill (from stub)
├── verify/
│   └── SKILL.md                # REPLACE: Full /mz:verify orchestrator (from stub)
│   └── verifier.md             # NEW: Supporting file with verification protocol reference
├── help/
│   └── SKILL.md                # MODIFY: Move /mz:review and /mz:verify to Available

commands/
├── review.md                   # NEW: Autocomplete proxy for /mz:review
├── verify.md                   # NEW: Autocomplete proxy for /mz:verify
```

### Pattern 1: Review-Within-Executor (Per-Task Review)

**What:** The review runs *inside* the executor subagent's flow, after each task commit but before proceeding to the next task. The executor spawns a reviewer subagent via the Task tool.

**When to use:** This is the only pattern for per-task review in Phase 5 (Task tool subagents only).

**Why inside the executor:** The user decision locks review to "after every individual task." If the orchestrator managed review, it would only see plan-level completions (the orchestrator waits for the entire plan to finish). To review after each task, the review must happen within the executor's execution loop.

**Flow:**

```
Executor Subagent (spawned by /mz:go orchestrator)
│
├── Task 1: Execute
│   ├── Implement task
│   ├── Verify done criteria
│   ├── Commit atomically
│   └── IF review enabled:
│       ├── Spawn Reviewer Subagent via Task tool
│       │   ├── Stage 1: Spec Compliance Review
│       │   │   └── Check: does the diff satisfy the plan task requirements?
│       │   ├── Stage 2: Code Quality Review
│       │   │   └── Check: code patterns, error handling, maintainability
│       │   └── Return: structured review report
│       ├── Parse review result
│       ├── IF critical findings:
│       │   ├── Auto-fix the issues
│       │   ├── Amend or create fix commit
│       │   ├── Re-spawn reviewer (up to retry limit)
│       │   └── IF still critical after retries: escalate to orchestrator
│       └── IF warnings/info only: log findings, continue
│
├── Task 2: Execute (same flow)
│   └── ...
│
└── Create SUMMARY.md (includes review findings summary)
```

**Critical design decision:** The executor itself handles the auto-fix, NOT a separate fix agent. Rationale:
- The executor has full context of the plan and the current task
- Spawning another subagent for fixes would lose that context
- The executor already has deviation rules for auto-fixing (Rules 1-3)
- Phase 6 can upgrade this: the reviewer sends feedback directly to the executor via SendMessage

### Pattern 2: Two-Stage Review Protocol

**What:** The reviewer agent performs two distinct analysis passes, producing two separate reports.

**Stage 1: Spec Compliance Review**
- Input: The diff (git diff of the task commit), the plan task definition (`<action>`, `<verify>`, `<done>`), the plan requirements
- Output: Spec compliance report with findings that cite specific plan tasks/requirements
- Focus: Does the implementation match what was specified? Are all `<done>` criteria actually met? Were all files in `<files>` created/modified? Does the commit scope match the task scope?

**Stage 2: Code Quality Review**
- Input: The diff (git diff of the task commit), the full files affected (not just the diff)
- Output: Code quality report with findings on patterns, maintainability, correctness
- Focus: Error handling, input validation, type safety, naming conventions, code organization, duplication, potential bugs, performance issues

**Each finding in each report has:**
```markdown
### Finding {N}: {title}
- **Severity:** critical | warning | info
- **File:** {path}:{line}
- **Issue:** {description}
- **Requirement:** {plan task/requirement ID} (spec compliance only)
- **Suggestion:** {how to fix}
```

### Pattern 3: Reviewer Subagent Prompt Structure

**What:** The reviewer receives a structured prompt with the diff, task context, and review protocol.

**Prompt structure:**

```
<agent_role>
{content of agents/mz-reviewer.md}
</agent_role>

<review_context>
<task_definition>
{the specific <task> block from the PLAN.md that was just executed}
</task_definition>

<diff>
{output of git diff HEAD~1 HEAD -- showing exactly what changed}
</diff>

<affected_files>
{full content of each file modified by the task}
</affected_files>

<plan_requirements>
{requirement IDs and descriptions from the plan frontmatter}
</plan_requirements>
</review_context>

<review_rules>
- Phase: {phase_number}
- Plan: {plan_number}
- Task: {task_number}
- Phase directory: {phase_dir}
- Report path: {phase_dir}/{padded}-{plan}-REVIEW-T{task_num}.md
- Severity levels: critical (blocks), warning (recommended), info (informational)
- Two separate reports: spec compliance + code quality
- Spec findings MUST cite plan task or requirement
- Architectural concerns are warning/info only, never critical (approach is decided)
</review_rules>
```

### Pattern 4: Verification Skill as Orchestrator (/mz:verify)

**What:** The `/mz:verify` skill is a standalone orchestrator (like `/mz:plan` and `/mz:go`) that spawns a verifier subagent to check phase goal achievement.

**Flow:**

```
User invokes /mz:verify [phase_num]
        │
        ▼
┌─── SKILL.MD (Orchestrator) ────────────────────────┐
│  1. Display banner: MEGAZORD > VERIFY               │
│  2. Load config + STATE.md + ROADMAP.md              │
│  3. Determine target phase (arg or current)          │
│  4. Check all plans complete (all have SUMMARY.md)   │
│  5. Spawn verifier subagent via Task tool            │
│  6. Parse verification result                        │
│  7. Handle result:                                   │
│     - passed: update state, display success          │
│     - gaps_found: display gaps, suggest fixes        │
│     - human_needed: present tests to user            │
│  8. Display Next Up                                  │
└────────────────────────────────────────────────────┘
        │
        ▼
┌─── VERIFIER SUBAGENT ──────────────────────────────┐
│  1. Load phase goal from ROADMAP.md                  │
│  2. Establish must-haves:                            │
│     a. ROADMAP.md success criteria (phase-level)     │
│     b. PLAN.md must_haves (per-plan truths,          │
│        artifacts, key_links)                         │
│  3. For each truth: verify against codebase          │
│  4. For each artifact: 3-level check                 │
│     (exists, substantive, wired)                     │
│  5. For each key_link: wiring verification           │
│  6. Check requirements coverage                      │
│  7. Scan for anti-patterns in phase files            │
│  8. Identify human verification needs                │
│  9. Write VERIFICATION.md                            │
│  10. Return structured result                        │
└────────────────────────────────────────────────────┘
```

**Hybrid mode implementation:**
1. Verifier runs automated checks (file existence, grep patterns, build checks)
2. For items marked "? UNCERTAIN" or "needs human": the `/mz:verify` skill presents these to the user inline
3. User confirms or reports issues
4. Skill updates VERIFICATION.md with user responses

### Pattern 5: Review Report Persistence

**What:** Review reports are persisted as markdown files in the phase directory for audit trail.

**Naming convention:**
- `{phase_dir}/{padded}-{plan}-REVIEW-T{task_num}.md` for per-task reviews
  - Example: `.planning/phases/05-code-review-and-verification/05-01-REVIEW-T1.md`
- `{phase_dir}/{padded}-VERIFICATION.md` for phase verification (already established in prior phases)

**Report structure (review):**
```markdown
---
phase: {phase-slug}
plan: {plan_number}
task: {task_number}
reviewed: {ISO timestamp}
status: passed | issues_found
spec_findings: {count}
quality_findings: {count}
critical: {count}
warnings: {count}
info: {count}
---

# Review: Phase {X} Plan {Y} Task {Z}

## Spec Compliance

### Finding 1: {title}
- **Severity:** {level}
- **Requirement:** {plan task/requirement}
- **Issue:** {description}
- **Suggestion:** {fix}

{...or "No spec compliance issues found."}

## Code Quality

### Finding 1: {title}
- **Severity:** {level}
- **File:** {path}:{line}
- **Issue:** {description}
- **Suggestion:** {fix}

{...or "No code quality issues found."}

## Summary

| Metric | Count |
|--------|-------|
| Spec findings | {N} |
| Quality findings | {N} |
| Critical | {N} |
| Warnings | {N} |
| Info | {N} |

**Status:** {passed | issues_found}
```

### Anti-Patterns to Avoid

- **Running review at the orchestrator level:** The user decided review runs after every individual task. The orchestrator only sees plan-level completions. Review MUST be inside the executor's loop.

- **Merging spec compliance and code quality reports:** User decision: two separate reports. This enables independent severity handling (e.g., spec critical but quality clean = fix spec issues only).

- **Blocking on architectural pushback:** User decision: architectural concerns are advisory only (warning/info), never critical. The approach is already decided at planning time.

- **Having the reviewer auto-fix code:** The reviewer REVIEWS. The executor FIXES. Mixing these roles loses the "fresh eyes" benefit. The reviewer identifies issues; the executor resolves them.

- **Spawning a new subagent for each fix attempt:** The executor already handles deviations (Rules 1-3). Review findings that need fixing are treated as deviation Rule 1 (auto-fix bugs) or Rule 2 (auto-add missing). No new subagent needed for fixes.

- **Infinite review loops:** Must have a retry limit. After N attempts, escalate rather than loop forever.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diff generation | Custom file comparison | `git diff HEAD~1 HEAD` | Git already provides the diff; executor commits atomically |
| Frontmatter parsing | Regex on PLAN.md | `gray-matter` via existing `plan.ts` | Already installed, handles all edge cases |
| Config reading | Direct JSON parse | Existing `loadConfig()` from `config.ts` | Validates schema, handles missing config |
| State updates | Manual STATE.md editing | Existing CLI tools (advance-plan, record-metric) | Established, tested, section-safe |
| Must-haves extraction | Custom PLAN.md parsing | Existing `parsePlan()` returns full frontmatter | PlanMetadataSchema can be extended for must_haves |
| Phase directory resolution | Hardcoded paths | Existing readPosition() + phase directory pattern | Consistent with /mz:go and /mz:plan |
| Progress tracking | Custom progress logic | Existing calculateProgress() + progressBar() | Already implemented in state.ts |

**Key insight:** Phase 5 is primarily an agent definition and skill creation phase, not a library phase. The infrastructure from Phases 1-4 already provides everything needed. The new work is: (1) defining the reviewer agent, (2) modifying the executor agent to call the reviewer, (3) defining the verifier agent, (4) building the /mz:verify skill, and (5) building/replacing the /mz:review skill.

## Common Pitfalls

### Pitfall 1: Context Exhaustion in Nested Subagent Spawning
**What goes wrong:** The executor subagent spawns a reviewer subagent. Both are Task tool subagents with their own context windows. The reviewer receives the diff, full files, task definition, and review protocol -- potentially exhausting its context.
**Why it happens:** Review of large diffs with full file context can consume significant tokens.
**How to avoid:** The reviewer receives only: (1) the diff (compact), (2) the specific task `<action>`/`<done>` block (not the full plan), (3) the affected files (only the files modified, not all context files). The reviewer does NOT need ROADMAP.md, STATE.md, or other project context -- it only needs the diff and the spec it's checking against. Keep the reviewer prompt focused and minimal.
**Warning signs:** Reviewer producing shallow reviews, ignoring later findings, or failing to complete.

### Pitfall 2: Review-Fix Infinite Loop
**What goes wrong:** The reviewer finds a critical issue, the executor fixes it, the fix introduces a new issue, the reviewer finds that, the executor fixes it, creating a new issue, and so on.
**Why it happens:** No retry limit, or the auto-fix creates regressions.
**How to avoid:** Set a retry limit (recommended: 2 re-reviews per task, so max 3 total reviews per task). After the limit, the executor logs remaining findings in SUMMARY.md and continues. Critical findings that persist after retries are escalated to the orchestrator, which can surface them to the user.
**Warning signs:** Task taking unusually long, multiple commits for the same task, growing review reports.

### Pitfall 3: Task Tool Nesting Depth
**What goes wrong:** The orchestrator spawns an executor (depth 1), which spawns a reviewer (depth 2). If the reviewer needs to spawn another agent (e.g., for specialized analysis), that's depth 3. Claude Code may have limits on nesting depth.
**Why it happens:** Each Task tool call creates a new subagent session. Deeply nested spawns may hit platform limits or suffer from compounding context overhead.
**How to avoid:** Keep nesting to exactly 2 levels: orchestrator -> executor -> reviewer. The reviewer does NOT spawn further subagents. All review logic is self-contained within the reviewer agent. If additional analysis is needed, the reviewer performs it directly using its available tools (Read, Grep, Glob, Bash).
**Warning signs:** Task tool calls failing or timing out, "maximum depth" errors.

### Pitfall 4: Review Disabled But Executor Still Expects It
**What goes wrong:** User sets `quality.review: "off"` in config, but the executor agent definition still contains review logic that references the reviewer agent, causing confusion or errors.
**Why it happens:** The executor agent definition is static text embedded in the Task prompt. If it always includes review instructions, there's a mismatch when review is disabled.
**How to avoid:** The executor receives the review configuration as part of `<execution_rules>`. The executor agent definition has a conditional section: "IF review is enabled in `<execution_rules>`, perform review after each task. IF review is disabled, skip review entirely." The orchestrator sets the review flag in `<execution_rules>` based on config. Additionally, the orchestrator displays a one-time notice when review is disabled (user decision).
**Warning signs:** Executor trying to spawn reviewer when review is off, or skipping review when it should be on.

### Pitfall 5: Verification Happening Before All Plans Complete
**What goes wrong:** User runs `/mz:verify` while some plans are still incomplete. The verifier finds "missing" artifacts that are simply part of later plans.
**Why it happens:** No pre-check for plan completion status.
**How to avoid:** Step 4 of `/mz:verify` MUST check that all plans in the phase have SUMMARY.md files. Use the existing `getIncompletePlans()` from plan.ts. If incomplete plans exist, display a warning and ask the user whether to proceed (partial verification) or wait. This is a soft check, not a hard block -- the user may want to verify partial work.
**Warning signs:** Verification report showing "MISSING" artifacts that are planned but not yet executed.

### Pitfall 6: Executor Commit Flow Disrupted by Review
**What goes wrong:** The executor commits task 1, the reviewer finds critical issues, the executor fixes them. Now there are two commits for task 1 -- violating the "one commit per task" rule.
**Why it happens:** The original commit is already made before review runs.
**How to avoid:** Two approaches:
1. **Amend approach:** After the fix, `git add` the changed files and `git commit --amend --no-edit` to fold the fix into the original task commit. This preserves the one-commit-per-task rule.
2. **Fix commit approach:** Create a separate fix commit: `fix({phase}-{plan}): address review findings for task {N}`. This is cleaner for audit trail but means 2 commits per reviewed task.
**Recommendation:** Use the amend approach for critical auto-fixes (keeps commit history clean) and the fix commit approach for cases where the fix is substantial enough to warrant its own commit (documented deviation). The executor agent definition should specify this protocol.
**Warning signs:** Multiple commits for a single task with no deviation documentation.

## Code Examples

### Reviewer Agent Definition Structure (agents/mz-reviewer.md)

```markdown
# Megazord Code Reviewer

You are a code reviewer for Megazord. Your job is to review a single task's
changes through two lenses: spec compliance and code quality.

## Your Objective

Perform a two-stage review of a task commit. Produce two separate reports
with findings classified as critical, warning, or info.

## Input

You receive:
- <task_definition>: The plan task being reviewed (<action>, <verify>, <done>)
- <diff>: The git diff of the task commit
- <affected_files>: Full content of modified files
- <plan_requirements>: Requirement IDs from the plan
- <review_rules>: Phase/plan/task numbers, report path, severity rules

## Stage 1: Spec Compliance Review

Check whether the implementation satisfies the plan task specification:

1. Does the diff implement everything described in <action>?
2. Are all files listed in <files> created/modified?
3. Do the changes satisfy <done> criteria?
4. If requirements are listed, does the implementation address them?

For each finding, cite the specific plan task or requirement.

## Stage 2: Code Quality Review

Check code quality of the changes:

1. Error handling: Are errors caught and handled appropriately?
2. Input validation: Are inputs validated before use?
3. Type safety: Are types used correctly (no any, proper nullability)?
4. Naming: Are names descriptive and consistent?
5. Patterns: Does the code follow established project patterns?
6. Duplication: Is there unnecessary duplication?
7. Edge cases: Are edge cases handled?
8. Security: Any obvious security issues?

## Severity Levels

- **critical**: Blocks task completion. Must be fixed before proceeding.
  Examples: missing required functionality, broken imports, security vulnerability,
  data loss risk, spec requirement not implemented.
- **warning**: Recommended fix. Should be addressed but doesn't block.
  Examples: missing error handling, inconsistent naming, potential bug,
  missing edge case handling, architectural concern.
- **info**: Informational. Good to know, no action required.
  Examples: style suggestion, alternative approach, documentation note,
  minor optimization opportunity.

## Architectural Pushback

You CAN flag structural concerns as warning or info. You CANNOT flag them as
critical. The architectural approach was already decided at planning time.
Your pushback is advisory only.

## Return Format

Return this exact structure:

## REVIEW COMPLETE

**Task:** {phase}-{plan} Task {N}
**Status:** passed | issues_found
**Critical:** {count}
**Warnings:** {count}
**Info:** {count}

### Spec Compliance
{findings or "No issues found."}

### Code Quality
{findings or "No issues found."}
```

### Executor Review Integration (modification to agents/mz-executor.md)

```markdown
## Review Protocol (added section)

After each task commit, check the review configuration in <execution_rules>.

### If review is enabled (review_enabled: true):

1. Get the diff of the task commit:
   ```bash
   DIFF=$(git diff HEAD~1 HEAD)
   ```

2. Get the list of affected files from the task's <files> section.

3. Read each affected file's full content.

4. Spawn reviewer via Task tool:
   - subagent_type: "general-purpose"
   - description: "Review Phase {phase}-{plan} Task {N}"
   - Compose prompt with: agent_role (mz-reviewer.md content), task_definition,
     diff, affected_files, plan_requirements, review_rules

5. Parse the structured result (look for "## REVIEW COMPLETE").

6. Handle findings:
   - **No critical findings:** Log review summary, continue to next task.
   - **Critical findings (attempt 1-2):**
     a. Fix each critical issue following Deviation Rule 1 (auto-fix)
     b. Stage fixed files: git add {files}
     c. Amend the commit: git commit --amend --no-edit
     d. Re-spawn reviewer for the amended diff
   - **Critical findings (attempt 3+):**
     a. Log remaining critical findings in deferred section
     b. Continue to next task (escalation to orchestrator)

7. Persist review report:
   Write to {phase_dir}/{padded}-{plan}-REVIEW-T{task_num}.md

### If review is disabled (review_enabled: false):

Skip review entirely. Do not spawn reviewer.
The orchestrator displays a one-time notice to the user.

### Review retry limit

Maximum 2 re-reviews per task (3 total review passes including initial).
After limit: log remaining findings, continue.
```

### /mz:verify Skill Prompt for Verifier Subagent

```markdown
<agent_role>
{content of agents/mz-verifier.md}
</agent_role>

<verification_context>
<phase_goal>
{Phase goal from ROADMAP.md}
</phase_goal>

<success_criteria>
{Success criteria list from ROADMAP.md}
</success_criteria>

<plans>
{For each PLAN.md: filename, must_haves section from frontmatter, requirements}
</plans>

<summaries>
{For each SUMMARY.md: filename, key accomplishments, key files, key decisions}
</summaries>

<requirements>
{Requirement IDs mapped to this phase from REQUIREMENTS.md}
</requirements>
</verification_context>

<verification_rules>
- Phase: {phase_number}
- Phase directory: {phase_dir}
- Report path: {phase_dir}/{padded}-VERIFICATION.md
- Mode: hybrid (automated first, then user confirmation for ambiguous)
- Criteria sources: ROADMAP.md success criteria + PLAN.md must_haves
</verification_rules>
```

## Discretion Recommendations

### 1. Review Report Format
**Recommendation: Summary format with file:line references.**

Each finding includes file path and line number but is presented as a structured summary, not inline code comments. Rationale:
- Summary format is easier for the executor to parse programmatically
- File:line references give enough specificity for the executor to locate issues
- Inline comments would require a different output format (patch-style) that's harder to process in the Task tool context
- Phase 6 can upgrade to inline feedback via SendMessage between reviewer and executor

### 2. Retry Limit for Auto-Fix Before Escalation
**Recommendation: 2 re-reviews per task (3 total passes).**

- Pass 1: Initial review
- Pass 2: Re-review after first fix (if critical findings)
- Pass 3: Final re-review after second fix (if still critical)
- After pass 3: Log remaining findings, continue to next task, flag in SUMMARY.md

Rationale: 3 total passes is enough for most auto-fixable issues. If an issue persists after 2 fix attempts, it likely requires human judgment or architectural changes (which are advisory-only per user decision). The retry limit prevents infinite loops and excessive token consumption.

### 3. Warning Blocking Behavior
**Recommendation: Report-only by default, block on high warning count.**

- 0-3 warnings: Report only, continue execution
- 4+ warnings in a single task: Log a notice that accumulated warnings are high, but still continue
- Warnings are never blocking by themselves -- only critical findings block

Rationale: Warnings are "recommended fixes," not blockers. Blocking on warnings would slow execution significantly. The review report persists as an audit trail, so warnings are not lost. The user can address warnings in a subsequent pass.

### 4. Escalation Strategy
**Recommendation: Continue other tasks, stop at plan boundary.**

When critical findings persist after retry limit:
1. Log the findings in the executor's SUMMARY.md under "Unresolved Review Findings"
2. Continue to the next task in the current plan (the findings may be task-specific)
3. At plan completion, the orchestrator checks if any unresolved critical findings exist
4. If yes: display a warning in the post-execution summary and suggest `/mz:review` for manual review

Rationale: Stopping execution immediately on unresolved findings is too aggressive for Phase 5 (which is the first iteration of review). The task-level findings may not affect other tasks. The plan boundary is a natural checkpoint. Phase 6 can tighten this with direct inter-agent communication for immediate escalation.

### 5. Verification Output Persistence
**Recommendation: Always persist VERIFICATION.md.**

Regardless of pass/fail status, always write VERIFICATION.md to the phase directory. Rationale:
- Passed verifications serve as audit trail and evidence
- Failed verifications contain structured gap data for re-planning
- Existing phases (01-04) already have VERIFICATION.md files (established pattern)
- The frontmatter status field (passed/gaps_found/human_needed) makes the result machine-readable

### 6. Verification Fail Behavior
**Recommendation: Soft block with user override.**

When verification fails:
1. Display gaps clearly in the verification output
2. Ask the user: "Continue to next phase despite gaps?" (using AskUserQuestion if available, or plain prompt)
3. If user says yes: update STATE.md to mark phase as "Complete (with gaps)", advance to next phase
4. If user says no: suggest running `/mz:go --gaps` (or re-running specific plans) to address gaps

Rationale: Hard blocking would prevent any forward progress. Some gaps may be acceptable (e.g., human verification items that user confirms manually). The "Complete (with gaps)" status preserves audit trail.

### 7. Auto-Fix Agent Selection
**Recommendation: Executor fixes, not a new agent.**

When the reviewer finds critical issues, the executor (which spawned the reviewer) applies the fixes itself. Do NOT spawn a new subagent for fixes. Rationale:
- The executor has full plan context and task context
- The executor already has deviation rules (Rules 1-3) for handling unexpected issues
- Spawning a new agent would lose context and add another level of nesting (depth 3)
- The fix is usually small (missing error handling, wrong import, etc.) -- the executor can handle it directly
- Phase 6 will upgrade this: the reviewer can send feedback directly to the executor via SendMessage

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD: No automated code review | Megazord: Two-stage review integrated into execution | Phase 5 | Quality gate before task completion |
| GSD: gsd-verifier.md agent with gsd-tools.cjs | Megazord: mz-verifier.md with megazord tools | Phase 5 | Unified CLI, no external gsd-tools dependency |
| GSD: verify-phase.md as workflow + verify-work.md as separate UAT | Megazord: /mz:verify as single skill handling both automated + hybrid | Phase 5 | Simpler -- one command, hybrid mode |
| GSD: UAT with checkpoint boxes and severity inference | Megazord: Automated first, user confirmation only for ambiguous | Phase 5 | Less user interaction for clear pass/fail |
| GSD: Verification runs after all execution complete | Megazord: Task-level review during execution + phase-level verification after | Phase 5 | Earlier feedback, fewer wasted cycles |

**Deprecated/outdated:**
- GSD's separate `verify-phase.md` and `verify-work.md` workflows: Megazord unifies these into a single `/mz:verify` skill with hybrid mode.
- GSD's `gsd-tools.cjs verify artifacts` and `verify key-links` commands: Megazord's verifier agent uses direct file checks (Grep, Glob, Read, Bash) rather than dedicated CLI verification commands. This is simpler -- the verifier has full tool access and doesn't need specialized commands.

## Open Questions

1. **Task Tool Nesting Depth Limit**
   - What we know: The orchestrator spawns an executor (depth 1), and the executor spawns a reviewer (depth 2). Phase 4 proved depth 1 works. No Phase has tested depth 2 yet.
   - What's unclear: Whether Claude Code allows Task tool subagents to spawn their own Task tool subagents. The documentation doesn't explicitly state a nesting limit.
   - Recommendation: Implement the nested approach (executor spawns reviewer). If nesting fails at runtime, fall back to orchestrator-managed review: the orchestrator spawns the reviewer between plan executions (losing per-task granularity but still providing review). Document this fallback in the review protocol. The first execution of Phase 5 plans will validate whether nesting works.

2. **Git Diff Size for Large Tasks**
   - What we know: The reviewer receives `git diff HEAD~1 HEAD` as part of its prompt. Most tasks in Megazord produce moderate diffs (50-200 lines).
   - What's unclear: If a task produces a very large diff (500+ lines), whether the reviewer's context window can handle it alongside the review protocol and affected files.
   - Recommendation: If the diff exceeds a threshold (roughly 300 lines), the reviewer should focus on the diff only (skip embedding full affected files). The diff alone is usually sufficient for both spec compliance and quality review. Set a soft limit in the reviewer agent definition.

3. **Manual Review Mode (quality.review: "manual")**
   - What we know: The config schema has three values: "auto", "manual", "off". Phase 5 CONTEXT.md focuses on "auto" and "off".
   - What's unclear: What exactly "manual" means in the Phase 5 context. Options: (a) review runs but doesn't auto-fix -- shows report to user, (b) user triggers review explicitly via /mz:review, (c) review runs and user must approve before proceeding.
   - Recommendation: For Phase 5, treat "manual" as: review runs automatically (like "auto"), but critical findings are reported to the user instead of auto-fixed. The executor pauses and displays the review findings, waiting for user acknowledgment. This is the middle ground between "auto" (fully autonomous) and "off" (no review). The `/mz:review` standalone skill handles on-demand review regardless of config setting.

## Sources

### Primary (HIGH confidence)
- Existing Megazord codebase (verified on disk):
  - `src/lib/config.ts` -- Config schema with `quality.review: "auto" | "manual" | "off"` (line 15)
  - `src/lib/plan.ts` -- Plan parsing with PlanMetadataSchema, listPlanFiles, computeWaves, isPlanComplete, getIncompletePlans
  - `src/lib/state.ts` -- State management: readPosition, updatePosition, advancePlan, recordMetric, addDecision, calculateProgress
  - `agents/mz-executor.md` -- Executor agent with commit protocol, deviation rules, summary creation
  - `skills/go/SKILL.md` -- 7-step orchestrator with wave execution, Task tool spawning pattern
  - `skills/go/executor.md` -- Execution protocol: spawning, state ownership, failure handling
  - `skills/verify/SKILL.md` -- Current stub (disable-model-invocation: true)
  - `skills/review/SKILL.md` -- Current stub (disable-model-invocation: true)
  - All Phase 4 PLAN.md and SUMMARY.md files -- Plan format, must_haves structure
  - `.planning/phases/04-subagent-execution-and-atomic-commits/04-VERIFICATION.md` -- Established verification report format
  - `.planning/phases/04-subagent-execution-and-atomic-commits/04-UAT.md` -- Established UAT format
  - `skills/help/SKILL.md` -- Current skill listing (9 available, 5 coming soon)

- GSD reference implementations (verified on disk):
  - `~/.claude/agents/gsd-verifier.md` -- Goal-backward verification agent with 10-step process, 3-level artifact checking
  - `~/.claude/get-shit-done/workflows/verify-phase.md` -- Phase verification workflow with must-haves, truths, artifacts, key links, requirements
  - `~/.claude/get-shit-done/workflows/verify-work.md` -- UAT workflow with conversational testing, severity inference, gap diagnosis

### Secondary (MEDIUM confidence)
- Phase 4 RESEARCH.md -- Architecture patterns, established conventions, Task tool spawning behavior
- Phase 5 CONTEXT.md -- User decisions on review and verification approach

### Tertiary (LOW confidence)
- Task tool nesting depth -- Whether depth-2 subagent spawning (executor -> reviewer) works is unverified. Implementation should include a fallback strategy.
- Git diff size limits -- Exact threshold where diff size causes reviewer context issues is untested. The 300-line soft limit is an estimate.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies, all verified in existing codebase
- Architecture (review integration): HIGH -- Follows established Task tool spawning pattern from Phase 4, extends executor agent with conditional review step
- Architecture (reviewer agent): HIGH -- Two-stage review is well-defined by user decisions, agent definition follows established mz-executor.md pattern
- Architecture (verifier agent): HIGH -- Directly adapted from GSD's proven gsd-verifier.md, which has been used across all 4 completed phases
- Architecture (verify skill): HIGH -- Follows established /mz:plan and /mz:go orchestrator pattern
- Review-fix loop: MEDIUM -- Auto-fix within executor is theoretically sound (uses existing deviation rules), but the nested Task tool spawning (executor -> reviewer) is unverified at runtime
- Verification hybrid mode: MEDIUM -- Automated checks are straightforward, but the "user confirmation for ambiguous" UX needs empirical validation
- Task tool nesting: LOW -- Depth-2 nesting has never been tested in this project. Fallback strategy documented.

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days -- stable domain, no fast-moving dependencies)

---
*Phase 5 research for: Code Review and Verification*
*Researched: 2026-02-18*
