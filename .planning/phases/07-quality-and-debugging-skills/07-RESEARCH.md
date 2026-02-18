# Phase 7: Quality and Debugging Skills - Research

**Researched:** 2026-02-18
**Domain:** TDD enforcement (RED-GREEN-REFACTOR), Socratic brainstorming (/mz:discuss), systematic debugging (/mz:debug), CORTEX adaptive task classification (Clear/Complicated/Complex/Chaotic), anti-sycophancy enforcement
**Confidence:** HIGH

## Summary

Phase 7 adds structured thinking tools to Megazord: TDD enforcement with hard-block violations, Socratic brainstorming via `/mz:discuss`, systematic four-phase debugging via `/mz:debug`, and CORTEX adaptive task classification that scales approach depth to problem complexity. These are primarily skill definition and behavioral enforcement features -- no new npm dependencies are needed. The existing config schema already contains all quality toggles (`quality.tdd`, `quality.brainstorming`, `quality.cortex`, `quality.debug`), and the init/settings skills already present them to users. Phase 7 activates the behaviors these toggles control.

The core technical challenge is enforcement at the right integration points. TDD enforcement must intercept the executor's workflow to prevent implementation before failing tests -- this requires modifying the executor agent definition (`agents/mz-executor.md`) to add a TDD protocol section. CORTEX classification must happen before task execution within the executor flow. The `/mz:discuss` and `/mz:debug` skills are standalone orchestrator skills (similar to `/mz:review` and `/mz:verify`) that can be invoked manually. Anti-sycophancy and pushback are behavioral rules embedded in the executor and skill definitions, enforced through instructions rather than hooks.

The predecessor CORTEX methodology (from the GSD/Superpowers era) has been found at `/Users/sh3rd3n/Desktop/Megazord/dev/CORTEX.md` and provides the proven classification structure: Clear/Complicated/Complex/Chaotic domains with challenge blocks (FAIL/ASSUME/COUNTER/VERDICT), a pushback mandate, anti-sycophancy rules, and a verification gate. Phase 7 adapts this into Megazord's skill-based architecture while honoring the user's decisions on intensity scaling, auto-exemptions, and discretion areas.

**Primary recommendation:** Create the `/mz:discuss` skill SKILL.md and the `/mz:debug` skill SKILL.md (replacing stubs). Modify `agents/mz-executor.md` to add TDD protocol (RED-GREEN-REFACTOR with stage banners) and CORTEX classification protocol (classify before execute, challenge blocks on Complicated+). Add anti-sycophancy and pushback behavioral rules to the executor and skill definitions. Optionally add a `PreToolUse` hook on `Edit|Write` for TDD enforcement (block implementation writes before a failing test exists) -- but the primary enforcement mechanism is instruction-level in the executor agent, with hooks as a backstop. No new TypeScript library code needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### TDD Enforcement
- Hard block on violations: if implementation is written before a failing test, execution stops and reverts
- Auto-exempt non-code tasks: config changes, docs, CI, and pure refactors with existing passing tests skip TDD automatically
- Stage banners during execution: RED (writing failing test), GREEN (making it pass), REFACTOR (cleaning up)
- Violation recovery: Claude's discretion -- auto-fix for minor violations, escalate for structural ones

#### Brainstorming Style (/mz:discuss)
- Socratic dialogue: Claude asks probing questions to pull out ideas, challenges assumptions, builds iteratively on user answers
- Minimum 5 alternative approaches explored before converging on a direction
- Output goes to CONTEXT.md (same format as /gsd:discuss-phase)
- Works standalone too: can be used for free-form brainstorming outside phase context (output to temporary file)

#### CORTEX Classification Triggers
- Classifies every task before execution -- no exceptions
- Classification is automatic by Claude -- user sees the result but doesn't choose
- Depth scales with level:
  - Clear: execute directly
  - Complicated: analyze first + challenge blocks
  - Complex: brainstorm + spike + challenge blocks, proceed autonomously
  - Chaotic: stop and ask user before proceeding
- Challenge blocks on Complicated+: Claude must challenge its own plan before executing ("Why not X instead?")

#### Pushback / Anti-sycophancy
- Intensity proportional to CORTEX level: Clear accepts, Complicated notes concerns, Complex/Chaotic actively challenges
- Tone: direct and technical -- "This approach has a problem: [evidence]. Alternative: [proposal]." No sugarcoating.
- After user insists: Claude can push back twice with different evidence. After second rejection, accepts and proceeds.
- Self-challenge: Claude's discretion on when to challenge its own plans vs when it's unnecessary overhead

### Claude's Discretion
- /mz:discuss trigger timing (manual vs auto on certain conditions)
- Self-challenge frequency (when to challenge own plans)
- TDD violation recovery severity assessment (auto-fix vs escalate threshold)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-02 | TDD workflow (RED-GREEN-REFACTOR) enforced when enabled: tests must fail before implementation, pass after, then refactor | TDD protocol added to `agents/mz-executor.md` with stage banners, auto-exempt detection for non-code tasks, violation detection and recovery. Config toggle `quality.tdd` already exists (Phase 2). Executor reads config to determine TDD mode. |
| QUAL-03 | Socratic brainstorming explores 3+ alternative approaches before settling on a design with /mz:discuss | `/mz:discuss` skill SKILL.md (replacing stub) implements Socratic dialogue with min 5 alternatives per CONTEXT.md decision. Output persisted to CONTEXT.md or temporary file for standalone use. |
| QUAL-04 | Systematic debugging follows 4-phase methodology (reproduce, isolate, root-cause, fix) with /mz:debug | `/mz:debug` skill SKILL.md (replacing stub) implements four-phase methodology with observable state transitions (phase banners). Each phase has explicit entry/exit criteria. |
| CRTX-01 | Task classification (Clear/Complicated/Complex/Chaotic) determines approach depth before any non-trivial task | CORTEX classification protocol added to executor agent. Every task classified before execution. Lightweight output: one-line classification with level and signal. |
| CRTX-02 | Challenge blocks (FAIL/ASSUME/COUNTER/VERDICT) mandatory before implementation on Complicated+ tasks | Challenge block format adapted from predecessor CORTEX.md. Required for Complicated and Complex. Chaotic stops and asks user first. FAIL lists 3 specific failure modes, ASSUME flags unverified assumptions, COUNTER attacks the approach, VERDICT decides proceed/modify/reject. |
| CRTX-03 | Pushback mandate active: framework challenges unsound architecture, unnecessary complexity, sub-optimal choices | Pushback rules embedded in executor agent definition and skill definitions. Intensity scales with CORTEX level. Evidence-based: "This causes X because Y", not "I think this might be bad." |
| CRTX-04 | Anti-sycophancy enforced: no performative agreement, only evidence-based evaluation | Anti-sycophancy rules embedded in executor agent and all skill definitions. Banned phrases: "Great idea!", "You're absolutely right!" Required phrases: "That works because [reason]", "I'd suggest [alternative] because [evidence]." |
| CRTX-05 | Verification gate before completion claims: identify proof, run it, read output, verify, then claim done | Verification gate protocol (IDENTIFY-RUN-READ-VERIFY-CLAIM) already enforced by executor's Self-Check section. Phase 7 makes it explicit as a CORTEX guardrail and strengthens the wording. Banned: "should work", "probably fine", "seems correct." |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for any new CLI helpers (if needed) | Already installed, type safety |
| gray-matter | ^4.0.3 | Parse PLAN.md frontmatter for TDD exemption detection | Already installed, used in plan.ts |
| fs-extra | ^11.0.0 | File system operations | Already installed, used everywhere |
| zod | ^4.3.0 | Config validation (quality.tdd, quality.cortex) | Already installed, used in config.ts |

### No Additional Dependencies Needed

Phase 7 requires zero new npm dependencies. All features are implemented through:
1. Skill SKILL.md files (Markdown instructions for Claude)
2. Agent definition modifications (Markdown behavioral rules)
3. Optionally: hook scripts (Bash, reading JSON from stdin)

The config schema (`src/lib/config.ts`) already defines all quality toggles:
- `quality.tdd: boolean` (line 14)
- `quality.brainstorming: boolean` (line 17)
- `quality.cortex: boolean` (line 18)
- `quality.debug: "systematic" | "quick"` (line 19)

The /mz:init preset profiles already configure these values. The /mz:settings skill already presents them for modification. Phase 7 activates the behavior these toggles control.

**Installation:**
```bash
# Nothing to install -- all dependencies present from Phase 1
```

## Architecture Patterns

### Recommended Project Structure (Phase 7 Additions)

```
skills/
├── discuss/
│   └── SKILL.md                # REPLACE: Full /mz:discuss Socratic brainstorming (from stub)
├── debug/
│   └── SKILL.md                # REPLACE: Full /mz:debug systematic debugging (from stub)
├── help/
│   └── SKILL.md                # MODIFY: Move /mz:debug and /mz:discuss to Available
├── go/
│   └── SKILL.md                # MODIFY: Add CORTEX/TDD config forwarding to execution rules

agents/
├── mz-executor.md              # MODIFY: Add TDD protocol, CORTEX classification,
│                                #   anti-sycophancy, pushback mandate, verification gate
└── (others unchanged)

hooks/
├── hooks.json                  # MODIFY: Optionally add TDD enforcement hook (PreToolUse)
├── (enforce-ownership.sh)      # Existing, unchanged

scripts/
├── enforce-tdd.sh              # NEW (optional): TDD stage enforcement via PreToolUse hook
```

### Pattern 1: TDD Protocol Within Executor (RED-GREEN-REFACTOR)

**What:** When TDD is enabled (`quality.tdd: true`), the executor follows a strict RED-GREEN-REFACTOR cycle for each task. Implementation code cannot be written before a failing test exists.

**When to use:** Every code-producing task when TDD is enabled. Auto-exempt: config changes, docs, CI, pure refactors with existing passing tests.

**Flow:**

```
For each task in the plan (when quality.tdd is true):

1. CLASSIFY TASK TYPE
   - Is this a code-producing task? (creates/modifies .ts, .tsx, .js, .jsx, .py, etc.)
   - Is this exempt? (config, docs, CI, refactor-only with existing tests)
   - If exempt: skip TDD, execute normally

2. RED STAGE (write failing test)
   Display: "RED: Writing failing test for {task description}"
   - Write test(s) that validate the expected behavior
   - Run test suite: confirm test FAILS
   - If test passes: WARNING -- test doesn't validate new behavior
   - Commit test: test({phase}-{plan}): RED -- {test description}

3. GREEN STAGE (make it pass)
   Display: "GREEN: Implementing to make test pass"
   - Write minimum implementation to make test pass
   - Run test suite: confirm test PASSES
   - If test fails: debug and fix (stay in GREEN until pass)
   - Commit implementation: feat({phase}-{plan}): GREEN -- {implementation description}

4. REFACTOR STAGE (clean up)
   Display: "REFACTOR: Cleaning up implementation"
   - Refactor code while keeping tests passing
   - Run test suite: confirm ALL tests still PASS
   - If any test breaks: fix before proceeding
   - Amend commit or create: refactor({phase}-{plan}): REFACTOR -- {cleanup description}
```

**Auto-exemption detection:**

```
Task is TDD-exempt if ALL of these are true:
- No files in <files> section match code patterns (*.ts, *.tsx, *.js, *.jsx, *.py, etc.)
  OR
- All files are in config/docs paths (.md, .json, .yaml, .yml, .toml, .env, .sh)
  OR
- Task type is "refactor" AND existing test coverage already exists for affected files
```

**Violation detection and recovery (Claude's discretion):**

```
MINOR violation (auto-fix):
- Implementation slightly ahead of test (wrote 1-2 lines of impl before test)
- Fix: revert impl, write test first, then re-implement
- Log as deviation

STRUCTURAL violation (escalate):
- Entire implementation written without any tests
- Architecture chosen that makes TDD impractical
- Fix: stop, display warning, ask user to proceed or revert
```

### Pattern 2: CORTEX Classification Within Executor

**What:** Before executing each task, the executor classifies it using the CORTEX framework (Clear/Complicated/Complex/Chaotic). Classification determines approach depth and whether challenge blocks are required.

**When to use:** Every task, when `quality.cortex: true`. Classification is automatic -- user sees result but doesn't choose.

**Classification output (lightweight):**

```
CORTEX: {level} -- {one-line signal}
```

Examples:
```
CORTEX: Clear -- Standard file creation, best practice exists
CORTEX: Complicated -- Multiple integration approaches, needs analysis
CORTEX: Complex -- High uncertainty, emergent architecture decisions
CORTEX: Chaotic -- Blocked by external failures, stabilize first
```

**Post-classification behavior:**

| Level | Classification Output | Challenge Block | Brainstorming | User Interaction | Pushback Intensity |
|-------|----------------------|----------------|---------------|-----------------|-------------------|
| Clear | One line | None | None | None | Accepts |
| Complicated | One line | Required (FAIL/ASSUME/COUNTER/VERDICT) | None | None | Notes concerns |
| Complex | One line | Required + deeper analysis | Mini-brainstorm (explore alternatives) | None (proceed autonomously) | Actively challenges |
| Chaotic | One line | Not applicable | Not applicable | STOP -- ask user before proceeding | Actively challenges |

### Pattern 3: Challenge Block Format

**What:** For Complicated+ tasks, the executor must output a challenge block BEFORE writing any code.

**Structure:**

```
<challenge>
FAIL: [3 specific ways this approach fails]
ASSUME: [assumptions being made -- flag which are unverified]
COUNTER: [strongest argument against this approach]
VERDICT: proceed | modify | reject
</challenge>
```

**Rules (from predecessor CORTEX.md):**
- FAIL must list exactly 3 failure modes -- specific, not vague
- ASSUME must distinguish verified from unverified assumptions
- COUNTER must be a genuine attack, not a softball
- If VERDICT is **modify**: state changes needed, then implement modified version
- If VERDICT is **reject**: explain why, propose alternative
- If VERDICT is **proceed**: challenge was honest, approach is sound

### Pattern 4: /mz:discuss Socratic Brainstorming Skill

**What:** A standalone skill that facilitates Socratic brainstorming, exploring 5+ alternatives before converging.

**Flow:**

```
User invokes /mz:discuss [topic]
        |
        v
1. DISPLAY BANNER: MEGAZORD > DISCUSS
2. DETERMINE CONTEXT:
   - Phase context? (within active phase) -> output to CONTEXT.md
   - Standalone? (no phase) -> output to temporary file
3. SEED QUESTION: Ask the user a probing question about the topic
4. ITERATIVE DIALOGUE:
   - Listen to user's answer
   - Challenge assumptions: "What if X wasn't true?"
   - Explore alternatives: "Have you considered Y?"
   - Build on ideas: "Building on that, what about Z?"
   - Track explored approaches (minimum 5)
5. CONVERGENCE:
   - Summarize all explored approaches
   - Present trade-offs for each
   - Ask user to pick a direction (or combine)
6. OUTPUT:
   - Write CONTEXT.md with decisions/discretion/deferred format
   - Or write temporary brainstorm file
```

**Tone:** Thinking partner, not interviewer. Probing questions, genuine curiosity, builds iteratively.

### Pattern 5: /mz:debug Systematic Debugging Skill

**What:** A skill that guides systematic four-phase debugging with observable state transitions.

**Flow:**

```
User invokes /mz:debug [issue description]
        |
        v
1. DISPLAY BANNER: MEGAZORD > DEBUG
2. PHASE 1 -- REPRODUCE
   Display: "REPRODUCE: Establishing reliable reproduction"
   - Confirm the issue exists (run failing test/command)
   - Establish reproduction steps
   - Define expected vs actual behavior
   - Entry: issue reported
   - Exit: issue reliably reproduced with clear steps

3. PHASE 2 -- ISOLATE
   Display: "ISOLATE: Narrowing down the failing component"
   - Binary search through components
   - Eliminate variables (inputs, dependencies, state)
   - Identify the minimal reproduction case
   - Entry: issue reproducible
   - Exit: failing component identified

4. PHASE 3 -- ROOT CAUSE
   Display: "ROOT CAUSE: Identifying why it fails"
   - Trace execution through the failing component
   - Identify the exact line/condition causing the issue
   - Understand WHY it fails (not just WHERE)
   - Entry: failing component known
   - Exit: root cause identified and explained

5. PHASE 4 -- FIX
   Display: "FIX: Implementing and verifying the fix"
   - Implement the minimal fix
   - Run reproduction steps: confirm issue is resolved
   - Run full test suite: confirm no regressions
   - Entry: root cause understood
   - Exit: fix verified, no regressions
```

### Pattern 6: Anti-Sycophancy Enforcement

**What:** Behavioral rules embedded in agent definitions and skills that prevent performative agreement.

**Rules:**

```
BANNED responses:
- "Great idea!", "You're absolutely right!", "That's a great approach!"
- "Sure, I'll do that!" (without evaluation)
- Any agreement without evidence

REQUIRED responses:
- "That works because [reason]" (agreement WITH evidence)
- "I'd suggest [alternative] because [evidence]" (constructive disagreement)
- "I have concerns about this approach: [specific issue]" (direct pushback)

PUSHBACK PROTOCOL:
1. First pushback: Present concern with evidence and alternative
2. If user insists: Push back again with DIFFERENT evidence
3. If user insists again: Accept and proceed (max 2 pushbacks)
4. Log the disagreement as a decision in SUMMARY.md
```

### Anti-Patterns to Avoid

- **TDD enforcement via hooks alone:** Hooks can block individual Edit/Write calls but lack the context to know whether a failing test exists. The primary enforcement must be instruction-level in the executor agent definition. Hooks are a backstop, not the primary mechanism.

- **Verbose CORTEX classification:** User decision: classification should be lightweight -- "a line or two showing the level, not a verbose analysis." Do not output a paragraph explaining the classification. One line.

- **Interview-style brainstorming:** User decision: brainstorming must feel like a thinking partner conversation, not an interview or questionnaire. Do not present numbered option lists. Ask probing questions, build iteratively.

- **Sugar-coated pushback:** User decision: tone is direct and technical. Never "I think this might be bad." Always "This causes X because Y." Evidence-based, no hedging.

- **CORTEX on trivial tasks:** Do not classify tasks that are clearly trivial (rename variable, fix typo, update version number). The classification itself says "Clear" which is fine, but the overhead of even outputting "CORTEX: Clear" on truly trivial operations should be avoided when it adds no value. Use judgment.

- **TDD on non-code tasks:** User decision: auto-exempt config changes, docs, CI, and pure refactors with existing passing tests. Do not force RED-GREEN-REFACTOR on a task that only modifies markdown files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config reading for quality flags | Direct JSON parsing | Existing `loadConfig()` from `config.ts` | Validates schema, handles defaults |
| Test runner detection | Custom test framework detection | `package.json` scripts analysis + common patterns | Most projects have `test` script; fall back to `bun test` |
| TDD stage tracking | Complex state machine in TypeScript | Instruction-based tracking in executor agent | The executor is a Claude agent -- it tracks state via its own context, not external state files |
| Challenge block validation | Parser for challenge block format | Pattern-matching in the agent's instructions | The agent produces and validates its own challenge blocks |
| Brainstorming output format | Custom format | Same CONTEXT.md format as /gsd:discuss-phase | Consistent with existing phase context gathering |
| Debug phase transitions | State machine library | Sequential skill flow with phase banners | Linear flow (1->2->3->4), no complex state management needed |

**Key insight:** Phase 7 is almost entirely a skill-definition and agent-modification phase. The behaviors are enforced through Claude's instruction-following capability, not through TypeScript code. The only potential new code is an optional TDD enforcement hook script.

## Common Pitfalls

### Pitfall 1: TDD Enforcement Granularity
**What goes wrong:** The TDD protocol tries to enforce RED-GREEN-REFACTOR at too fine a granularity (e.g., per-function) or too coarse a granularity (e.g., per-plan). The user expects per-task enforcement.
**Why it happens:** The plan breaks work into tasks, but each task may involve multiple functions. TDD enforcement per-function would require dozens of micro-commits. TDD enforcement per-plan misses the whole point.
**How to avoid:** Enforce TDD per TASK, not per function or per plan. Each task in the PLAN.md gets one RED-GREEN-REFACTOR cycle. The RED phase writes test(s) for the entire task's expected behavior. The GREEN phase implements everything to make those tests pass. The REFACTOR phase cleans up. This may mean 2-3 commits per task instead of 1 (test commit + impl commit + optional refactor commit), which is a deviation from the "one commit per task" rule. Document this as an expected TDD override.
**Warning signs:** Tasks taking extremely long because of per-function TDD cycles, or tasks producing a single giant commit that includes both tests and implementation.

### Pitfall 2: CORTEX Classification Overhead
**What goes wrong:** The executor spends significant tokens on CORTEX classification for every task, including trivial ones. Classification of a "create config file" task produces a paragraph of analysis.
**Why it happens:** The instruction says "classifies every task before execution -- no exceptions."
**How to avoid:** The instruction is honored (classify every task), but the output is kept minimal per user decision ("a line or two"). For Clear tasks, the classification is: `CORTEX: Clear -- {brief signal}`. No challenge block, no analysis, no brainstorming. The overhead is ~10 tokens per Clear task. For Complicated+ tasks, the overhead is justified by the challenge block.
**Warning signs:** Classification output exceeding 2 lines for Clear tasks.

### Pitfall 3: Brainstorming Convergence Failure
**What goes wrong:** The /mz:discuss session explores 5+ alternatives but never converges. The user gets analysis paralysis from too many options.
**Why it happens:** Socratic dialogue is open-ended. Without convergence pressure, the session can expand indefinitely.
**How to avoid:** After exploring the minimum 5 alternatives, explicitly enter a convergence phase: summarize all options, present trade-offs, and ask the user to pick a direction. If the user can't choose, suggest a default based on the evidence gathered. Set a soft limit of 10-15 exchanges before forcing convergence.
**Warning signs:** Brainstorming sessions exceeding 20 exchanges without a direction.

### Pitfall 4: TDD Commit Count Mismatch
**What goes wrong:** The executor's existing protocol requires "one commit per task, no exceptions." TDD requires at least 2 commits per task (RED: test, GREEN: implementation). These rules conflict.
**Why it happens:** Phase 4 established the one-commit-per-task rule before TDD was implemented.
**How to avoid:** When TDD is enabled, the commit protocol changes: RED gets its own commit (`test({phase}-{plan}): RED -- {description}`), GREEN gets its own commit (`feat({phase}-{plan}): GREEN -- {description}`), and REFACTOR optionally amends the GREEN commit or creates a third. Document this as a known TDD override of the one-commit rule. The review protocol (if enabled) runs after the GREEN commit, not after each micro-commit.
**Warning signs:** Executor trying to squash RED+GREEN into one commit and losing the TDD audit trail.

### Pitfall 5: Pushback Escalation Loop
**What goes wrong:** The anti-sycophancy rules cause Claude to push back on user decisions during execution, but the user made the decision at planning time. The executor challenges decisions that were already locked.
**Why it happens:** Pushback rules don't distinguish between "user is making a new decision" and "user made this decision in the plan."
**How to avoid:** Pushback applies to NEW decisions and design choices, not to plan-specified implementations. If the plan says "use approach X," the executor implements X. The executor challenges its OWN choices and NEW architecture it introduces, not the plan's pre-existing decisions. Pushback at planning time is the responsibility of `/mz:discuss` and `/mz:plan`, not the executor.
**Warning signs:** Executor refusing to implement plan tasks because it disagrees with the approach.

### Pitfall 6: Debug Skill Scope Creep
**What goes wrong:** The /mz:debug skill tries to handle all types of debugging -- performance, memory leaks, race conditions, build failures -- with the same four-phase methodology.
**Why it happens:** The four-phase methodology (reproduce, isolate, root-cause, fix) is general enough to apply broadly, but the specific techniques differ dramatically.
**How to avoid:** Keep the four phases universal but allow the techniques within each phase to vary. The skill should detect the type of issue (runtime error, build failure, test failure, performance) and adjust its approach accordingly. The phases are always the same; the tools used within each phase adapt.
**Warning signs:** Debug skill applying "reproduce" phase to a build error (which is inherently reproducible) or "isolate" phase to an error with an obvious stack trace.

## Code Examples

### Executor TDD Protocol Section (addition to agents/mz-executor.md)

```markdown
## TDD Protocol

When `quality.tdd` is `true` in `<execution_rules>`, follow RED-GREEN-REFACTOR for each task.

### Task Type Detection

Before starting TDD, check if the task is exempt:
- Files in `<files>` section are ALL non-code: .md, .json, .yaml, .yml, .toml, .env, .sh, .css
  -> EXEMPT: execute normally without TDD
- Task type in frontmatter is "refactor" AND existing tests cover the affected code
  -> EXEMPT: execute normally without TDD
- Otherwise: TDD REQUIRED

Display exemption:
```
TDD: Exempt (config/docs only)
```

### RED Stage

Display: "RED: Writing failing test for {task name}"

1. Analyze the task's <action> and <done> criteria
2. Write test(s) that validate the EXPECTED behavior
3. Run the test suite:
   ```bash
   bun test
   ```
4. Confirm the new test(s) FAIL (expected behavior not implemented yet)
5. If test PASSES: this test doesn't validate new behavior. Revise test.
6. Stage and commit test files only:
   ```bash
   git add {test_files}
   git commit -m "$(cat <<'EOF'
   test({phase}-{plan}): RED -- {test description}
   EOF
   )"
   ```

### GREEN Stage

Display: "GREEN: Making test pass for {task name}"

1. Write the MINIMUM implementation to make the failing test pass
2. Run the test suite:
   ```bash
   bun test
   ```
3. If test still FAILS: debug and fix. Stay in GREEN until pass.
4. Stage and commit implementation files:
   ```bash
   git add {impl_files}
   git commit -m "$(cat <<'EOF'
   feat({phase}-{plan}): GREEN -- {implementation description}
   EOF
   )"
   ```

### REFACTOR Stage

Display: "REFACTOR: Cleaning up {task name}"

1. Review the implementation for cleanup opportunities
2. Refactor while keeping ALL tests passing
3. Run the test suite after each change:
   ```bash
   bun test
   ```
4. If refactoring is minimal: amend the GREEN commit
   ```bash
   git add {refactored_files}
   git commit --amend --no-edit
   ```
5. If refactoring is substantial: create a separate commit
   ```bash
   git add {refactored_files}
   git commit -m "$(cat <<'EOF'
   refactor({phase}-{plan}): REFACTOR -- {cleanup description}
   EOF
   )"
   ```

### TDD + Review Integration

When both TDD and review are enabled:
- Review runs after the GREEN commit (not after RED)
- If review finds critical issues: fix and amend GREEN commit
- The RED commit is never amended (test spec is stable)

### Violation Detection

If you detect that implementation was written before a failing test:
- MINOR (1-2 lines ahead): Revert the implementation lines, write test first, re-implement
- STRUCTURAL (entire impl without tests): STOP. Display warning. Ask whether to revert or proceed.
```

### Executor CORTEX Classification Section (addition to agents/mz-executor.md)

```markdown
## CORTEX Classification

When `quality.cortex` is `true` in `<execution_rules>`, classify each task before execution.

### Classification (before every task)

Assess the task against these signals:

| Domain | Signals |
|--------|---------|
| Clear | Obvious solution, best practice exists, low risk |
| Complicated | Multiple valid approaches, needs analysis, medium risk |
| Complex | High uncertainty, emergent design, large scope, many unknowns |
| Chaotic | Nothing works, external failures, crisis state |

Output exactly one line:
```
CORTEX: {level} -- {brief signal}
```

### Post-Classification Protocol

**Clear:** Execute directly. No challenge block needed.

**Complicated:**
1. Output challenge block (see below)
2. If VERDICT is proceed: execute the task
3. If VERDICT is modify: state modifications, then execute modified approach
4. If VERDICT is reject: log rejection, propose alternative, wait for plan

**Complex:**
1. Output challenge block
2. Mini-brainstorm: explore 2-3 alternative approaches (brief, inline)
3. Select approach based on evidence
4. Proceed autonomously (do not ask user)

**Chaotic:**
1. STOP execution
2. Display: "CORTEX: Chaotic -- {description of crisis}. Requesting user input."
3. Wait for user instruction before proceeding

### Challenge Block

For Complicated and Complex tasks, output BEFORE any code:

<challenge>
FAIL: [3 specific failure modes for this approach]
ASSUME: [assumptions -- mark each as verified/unverified]
COUNTER: [strongest argument against this approach]
VERDICT: proceed | modify | reject
</challenge>

Rules:
- FAIL: exactly 3 items, specific not vague
- ASSUME: distinguish verified (checked) from unverified (guessed)
- COUNTER: genuine attack, not a softball
- VERDICT: honest assessment
```

### /mz:discuss Skill Structure

```markdown
---
name: discuss
description: Socratic brainstorming to explore approaches before implementation
disable-model-invocation: false
---

# /mz:discuss

Facilitate Socratic brainstorming that explores 5+ alternative approaches before
converging on a direction. Produces CONTEXT.md output compatible with /mz:plan.

## Step 1: Display Banner

MEGAZORD > DISCUSS

## Step 2: Determine Context

- If user provides a phase number: output to {phase_dir}/{padded}-CONTEXT.md
- If within an active phase (from STATE.md): output to current phase CONTEXT.md
- If standalone (no phase context): output to .planning/brainstorms/{timestamp}-{slug}.md

## Step 3: Seed the Conversation

Ask the user a probing question about their topic. Not a generic "what do you want?"
but a specific question that demonstrates understanding and challenges assumptions.

## Step 4: Iterative Dialogue

Track explored approaches. For each exchange:
- Listen to the user's answer
- Identify an assumption and challenge it
- Suggest an alternative angle
- Build on their ideas

Minimum 5 distinct approaches must be explored before convergence.

## Step 5: Convergence

After 5+ approaches explored:
- Summarize all approaches with trade-offs
- Ask user to select a direction or combine elements
- Record as decisions

## Step 6: Output

Write CONTEXT.md with:
- domain: Phase boundary
- decisions: Locked choices
- specifics: Specific implementation ideas
- deferred: Out of scope items
```

### /mz:debug Skill Structure

```markdown
---
name: debug
description: Systematic four-phase debugging (reproduce, isolate, root-cause, fix)
disable-model-invocation: false
---

# /mz:debug

Guide systematic four-phase debugging with observable state transitions.

## Step 1: Display Banner

MEGAZORD > DEBUG

## Step 2: Gather Issue Context

Parse the user's description of the issue. If vague, ask clarifying questions:
- What is the expected behavior?
- What is the actual behavior?
- When did it start happening?
- Any recent changes?

## Step 3: REPRODUCE

Display: "REPRODUCE: Establishing reliable reproduction"

1. Run the failing test/command to confirm the issue exists
2. If not reproducible: ask for more context, try variations
3. Document reproduction steps
4. Exit criteria: issue reliably reproduced

## Step 4: ISOLATE

Display: "ISOLATE: Narrowing down the failing component"

1. Identify candidate components
2. Binary search: disable/mock components to narrow scope
3. Find the minimal reproduction case
4. Exit criteria: failing component identified

## Step 5: ROOT CAUSE

Display: "ROOT CAUSE: Identifying why it fails"

1. Trace execution through the failing component
2. Add logging/breakpoints as needed
3. Identify the exact condition causing failure
4. Explain WHY (causation, not just correlation)
5. Exit criteria: root cause explained

## Step 6: FIX

Display: "FIX: Implementing and verifying the fix"

1. Implement the minimal fix
2. Run reproduction: confirm fixed
3. Run full test suite: confirm no regressions
4. If TDD enabled: write regression test first, then fix
5. Commit the fix
6. Exit criteria: fix verified, no regressions
```

### Optional TDD Hook Script (scripts/enforce-tdd.sh)

```bash
#!/bin/bash
# TDD enforcement backstop hook for PreToolUse on Edit|Write
# This is a BACKSTOP -- primary enforcement is instruction-level in the executor.
# The hook provides a safety net by checking if a test file was modified
# more recently than an implementation file in the current commit.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only enforce for Edit and Write tools
if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if TDD enforcement is active (look for a marker file)
TDD_MARKER="${CLAUDE_PROJECT_DIR:-.}/.mz-tdd-active"
if [ ! -f "$TDD_MARKER" ]; then
  exit 0  # TDD not active, allow
fi

# Read current TDD stage from marker
TDD_STAGE=$(cat "$TDD_MARKER" 2>/dev/null)

# If we're in RED stage, only allow test files
if [ "$TDD_STAGE" = "RED" ]; then
  # Check if the file is a test file
  if [[ "$FILE_PATH" != *".test."* ]] && [[ "$FILE_PATH" != *".spec."* ]] && [[ "$FILE_PATH" != *"__tests__"* ]]; then
    echo "TDD VIOLATION: Cannot write implementation during RED stage. Write tests first." >&2
    exit 2  # Hard block
  fi
fi

exit 0
```

**Note:** This hook is optional and serves as a backstop. The primary TDD enforcement is in the executor agent's instructions. The hook requires the executor to write a `.mz-tdd-active` marker file at the start of TDD cycles and remove it after REFACTOR. This adds complexity -- recommend starting with instruction-only enforcement and adding the hook only if violations are observed in practice.

## Discretion Recommendations

### 1. /mz:discuss Trigger Timing
**Recommendation: Manual trigger only, with a soft suggestion at planning time.**

The /mz:discuss skill should be manually invoked. However, the /mz:plan skill should suggest running `/mz:discuss` when no CONTEXT.md exists for the target phase (this already happens in Step 4 of /mz:plan). Do not auto-trigger /mz:discuss during execution -- it would interrupt the workflow. The user decides when brainstorming is needed.

Rationale: The user has full control over when brainstorming happens. Auto-triggering during execution would be disruptive and unpredictable. The planning-time suggestion is sufficient nudge.

### 2. Self-Challenge Frequency
**Recommendation: Challenge on every Complicated+ task. Skip self-challenge on Clear tasks entirely.**

The challenge block adds ~50-100 tokens per task. For Clear tasks, this is pure overhead with no value. For Complicated+ tasks, it's the core quality mechanism. The executor should never challenge its own plan for Clear tasks, and always challenge for Complicated+.

For self-challenge (challenging one's own generated plan within a task), apply only when the executor makes a non-trivial architectural choice not specified in the plan. If the plan says "create X with approach Y," don't challenge Y -- it was decided at planning time. If the executor must choose between approaches not specified in the plan, then self-challenge.

### 3. TDD Violation Recovery Severity
**Recommendation: Auto-fix threshold at 5 lines of implementation code. Escalate above.**

If the executor writes 1-5 lines of implementation before having a failing test (minor violation), auto-fix by reverting those lines, writing the test, then re-implementing. This is a normal slip that the executor can recover from without user intervention.

If the executor writes an entire function or module before tests (structural violation), this indicates a deeper issue -- the task may not be naturally TDD-friendly, or the executor lost track of the protocol. Stop and escalate to the user: "TDD violation detected: {N} lines of implementation written before tests. Options: (a) revert and restart with TDD, (b) accept as-is and write tests after (degraded TDD), (c) exempt this task from TDD."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSD/Superpowers: CORTEX as static CLAUDE.md text | Megazord: CORTEX as executor protocol + per-task classification | Phase 7 | Integrated into execution flow, not just advisory |
| GSD: CORTEX hooks via SessionStart + UserPromptSubmit | Megazord: CORTEX as executor agent instruction | Phase 7 | No hook overhead per prompt, classification within execution context |
| GSD: TDD not enforced by framework | Megazord: TDD enforced within executor with stage banners and violation detection | Phase 7 | First-class TDD support with automatic exemptions |
| GSD: /gsd:discuss-phase as planning workflow | Megazord: /mz:discuss as standalone Socratic skill | Phase 7 | Reusable outside phase context, more conversational |
| GSD: No systematic debugging support | Megazord: /mz:debug with four-phase methodology | Phase 7 | Structured debugging replaces ad-hoc investigation |
| GSD: Anti-sycophancy as CORTEX guardrail text | Megazord: Anti-sycophancy as behavioral rules in agent definitions | Phase 7 | Embedded in every agent that interacts with users |

**Deprecated/outdated:**
- GSD's CORTEX enforcement via hooks (SessionStart + UserPromptSubmit scripts): Megazord integrates CORTEX directly into the executor's instruction flow, avoiding the per-prompt overhead and the ~250 token SessionStart context injection.
- GSD's static `.cortex/CORTEX.md` file: Replaced by dynamic classification within the execution pipeline. The classification adapts per-task rather than being a global system prompt.

## Open Questions

1. **TDD Commit Count vs One-Commit Rule**
   - What we know: Phase 4 established "one commit per task, no exceptions." TDD requires at least 2 commits (RED + GREEN). These rules conflict.
   - What's unclear: Whether the planner should account for this in task decomposition (each "task" becomes a test-then-implement pair), or whether the executor should override the one-commit rule when TDD is active.
   - Recommendation: Override the one-commit rule when TDD is active. The executor produces 2-3 commits per task (RED, GREEN, optional REFACTOR). Document this as a known TDD override. The review runs after GREEN, not after each micro-commit. The SUMMARY.md records all commits per task. This is the simplest approach that preserves the TDD audit trail.

2. **TDD Hook Complexity vs Value**
   - What we know: The user wants "hard block on violations" for TDD. A PreToolUse hook on Edit|Write could block implementation writes during the RED stage.
   - What's unclear: Whether the complexity of maintaining TDD stage state (via marker files) justifies the additional enforcement when instruction-level enforcement is already present.
   - Recommendation: Start with instruction-only enforcement (Phase 7 MVP). The executor agent is already good at following protocols. Add the hook script only if testing reveals systematic violations. The hook adds operational complexity (marker file management, race conditions with concurrent agents) that may not be worth it for the initial release.

3. **CORTEX + Agent Teams Interaction**
   - What we know: Phase 6 added Agent Teams mode where multiple executors work in parallel. CORTEX classification happens within each executor independently.
   - What's unclear: Whether a teammate executor should communicate CORTEX classifications to the team lead, and whether a Chaotic classification in one executor should affect other executors in the same wave.
   - Recommendation: Each executor classifies independently. If an executor hits Chaotic, it stops and messages the team lead via SendMessage (in Agent Teams mode) or escalates via return value (in subagent mode). Other executors in the wave continue -- a Chaotic classification in one task doesn't necessarily affect others. The team lead decides whether to stop the wave.

4. **Brainstorming Output Format for Standalone Use**
   - What we know: When /mz:discuss is used within a phase context, output goes to CONTEXT.md. When used standalone, output goes to a temporary file.
   - What's unclear: The exact format and location for standalone brainstorm output.
   - Recommendation: Use `.planning/brainstorms/{timestamp}-{slug}.md` with the same CONTEXT.md sections (domain, decisions, specifics, deferred). This keeps all brainstorming output in the .planning directory and maintains a consistent format that could later be promoted to a phase CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- Existing Megazord codebase (verified on disk):
  - `src/lib/config.ts` -- Config schema with `quality.tdd`, `quality.brainstorming`, `quality.cortex`, `quality.debug` (lines 14-19)
  - `agents/mz-executor.md` -- Executor agent with commit protocol, deviation rules, review integration, teammate mode
  - `skills/go/SKILL.md` -- Orchestrator with execution rules forwarding, mode detection, wave execution
  - `skills/go/executor.md` -- Execution protocol: spawning, review integration, state ownership
  - `skills/discuss/SKILL.md` -- Current stub (disable-model-invocation: true)
  - `skills/debug/SKILL.md` -- Current stub (disable-model-invocation: true)
  - `skills/review/SKILL.md` -- Full skill (Phase 5) -- pattern reference for new skills
  - `skills/verify/SKILL.md` -- Full skill (Phase 5) -- pattern reference for new skills
  - `skills/init/presets.md` -- Preset profiles showing quality toggle values
  - `skills/init/design-system.md` -- Visual output formatting tokens
  - `skills/help/SKILL.md` -- Current skill listing with /mz:debug and /mz:discuss as "Coming soon"
  - `hooks/hooks.json` -- Current hook configuration (PreToolUse on Edit|Write for ownership)
  - `scripts/enforce-ownership.sh` -- Hook script pattern reference
  - `.planning/REQUIREMENTS.md` -- Phase 7 requirement IDs and descriptions
  - `.planning/ROADMAP.md` -- Phase 7 goal, success criteria, dependency chain
  - `.planning/phases/07-quality-and-debugging-skills/07-CONTEXT.md` -- User decisions

- Predecessor CORTEX methodology (verified on disk):
  - `/Users/sh3rd3n/Desktop/Megazord/dev/CORTEX.md` -- Full CORTEX methodology with classification, challenge blocks, pushback mandate, anti-sycophancy, verification gate, anti-rationalization, early warning signals

### Secondary (MEDIUM confidence)
- Claude Code Hooks reference: https://code.claude.com/docs/en/hooks
  - Verified hook event types: PreToolUse, PostToolUse, UserPromptSubmit, Stop, SessionStart, SessionEnd, SubagentStart, SubagentStop, TeammateIdle, TaskCompleted, PreCompact, Notification, PermissionRequest, PostToolUseFailure
  - Verified PreToolUse can block with exit 2 or JSON `permissionDecision: "deny"`
  - Verified matcher patterns work with regex (e.g., `Edit|Write`)
  - Verified hooks can be defined in plugin `hooks/hooks.json`, skill frontmatter, or settings files
  - Verified skill-scoped hooks via YAML frontmatter (once flag, lifecycle-scoped)

### Tertiary (LOW confidence)
- TDD hook script effectiveness: The proposed `enforce-tdd.sh` with marker file approach is untested. The marker file adds state management complexity. Instruction-only enforcement may be sufficient.
- CORTEX classification accuracy: Claude's ability to consistently classify tasks into the correct Cynefin domain is based on training-data knowledge. Edge cases between Complicated and Complex may produce inconsistent classifications.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zero new dependencies, all verified in existing codebase
- Architecture (TDD in executor): HIGH -- Follows established executor modification pattern from Phase 5 (review integration). TDD protocol is well-defined by user decisions.
- Architecture (/mz:discuss skill): HIGH -- Follows established skill pattern from /mz:review and /mz:verify. Socratic dialogue is a well-understood interaction pattern.
- Architecture (/mz:debug skill): HIGH -- Four-phase debugging methodology is standard (reproduce-isolate-root cause-fix). Skill structure follows established patterns.
- Architecture (CORTEX classification): HIGH -- Adapted from proven predecessor CORTEX.md. Classification framework (Cynefin) is well-established.
- Architecture (anti-sycophancy): HIGH -- Behavioral rules in agent definitions, proven in predecessor.
- TDD enforcement via hooks: LOW -- Marker file approach is untested and adds complexity. Recommend instruction-only for MVP.
- CORTEX edge case consistency: MEDIUM -- Classification between Complicated and Complex may vary. Acceptable for initial release with observation.

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (30 days -- stable domain, no fast-moving dependencies)

---
*Phase 7 research for: Quality and Debugging Skills*
*Researched: 2026-02-18*
