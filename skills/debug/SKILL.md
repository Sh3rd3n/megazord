---
name: debug
description: Systematic four-phase debugging (reproduce, isolate, root-cause, fix)
disable-model-invocation: false
---

# /mz:debug

Guide systematic four-phase debugging with observable state transitions. Each phase has a distinct banner so the user always knows which stage the debugging process is in. Adapts techniques based on issue type (runtime error, build failure, test failure, performance, logic bug).

Reference `@skills/init/design-system.md` for visual output formatting.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > DEBUG                             |
+===============================================+
```

## Step 2: Gather Issue Context

Parse the user's description from the text after `/mz:debug`. If the description is insufficient (vague, missing key details), ask targeted clarifying questions:

- What is the expected behavior?
- What is the actual behavior?
- When did it start happening?
- Any recent changes?

If a file path, error message, stack trace, or test name is provided, use it as the starting point.

**Issue Type Detection:**

Categorize the issue to adapt techniques within each phase:

| Type | Signals | Adapted Approach |
|------|---------|-----------------|
| Runtime error | Stack trace, exception, crash, unhandled rejection | Trace from stack, check inputs at each frame |
| Build failure | Compile error, bundler error, type error at build time | Check imports, types, config, dependency versions |
| Test failure | Test name, assertion error, expected vs received | Run specific test in isolation, check assertion values |
| Performance | Slow, timeout, memory leak, high CPU | Profile, measure baselines, compare before/after |
| Logic bug | Wrong output, incorrect behavior, data corruption | Add logging, trace data flow, check conditionals |

Display the detected type:

```
> Issue type: {type}
```

### Debug Mode Configuration

Read `quality.debug` from `.planning/megazord.config.json` (if config exists). If config does not exist, default to "systematic".

**If mode is "systematic" (default):**
- Follow the full 4-phase approach (REPRODUCE -> ISOLATE -> ROOT CAUSE -> FIX)
- Display all phase banners
- No shortcuts -- every phase is executed

**If mode is "quick":**
- Allow shortcuts based on the issue type:
  - If the stack trace directly points to a single file and line: skip ISOLATE phase (go from REPRODUCE to ROOT CAUSE)
  - If the error is a build/compile error with a clear message: skip REPRODUCE phase (go directly to ISOLATE)
  - If root cause is obvious from the error message: skip ROOT CAUSE phase (go directly to FIX)
- Display abbreviated banners:
  ```
  > Quick Debug: {issue type}
  ```
- Only execute the phases that add value for this specific issue

Display the active mode:
```
> Debug mode: {systematic | quick}
```

**Note:** `/mz:debug` always works when invoked manually, regardless of any config toggle. The `quality.debug` setting only controls the approach depth (systematic vs quick), not whether debugging is available.

## Step 3: REPRODUCE

Display phase banner:

```
+-----------------------------------------------+
|  REPRODUCE: Establishing reliable reproduction |
+-----------------------------------------------+
```

**Goal:** Confirm the issue exists and establish reliable reproduction steps.

1. Run the failing test or command to confirm the issue:
   ```bash
   {test command or reproduction command}
   ```

2. If not immediately reproducible: ask for more context, try variations, check environment differences.

3. Document reproduction steps clearly:
   ```
   > Reproduction steps:
   1. {step}
   2. {step}
   Expected: {expected behavior}
   Actual: {actual behavior}
   ```

4. **Exit criteria:** Issue reliably reproduced with clear steps.

**Shortcut:** If the issue is inherently reproducible (build error, static analysis finding, compile error), note this and move directly to ISOLATE without ceremony:

```
> Reproduction: Inherent (build error reproduces on every build)
```

## Step 4: ISOLATE

Display phase banner:

```
+-----------------------------------------------+
|  ISOLATE: Narrowing down the failing component |
+-----------------------------------------------+
```

**Goal:** Narrow the scope from "something is broken" to "this specific component is broken."

1. Identify candidate components that could cause the issue
2. Use binary search strategy: disable or mock components to narrow scope
3. **For runtime errors:** trace the call stack to identify the failing function
4. **For build errors:** check the specific file and line from the error message
5. **For test failures:** run the specific failing test in isolation to rule out test interaction
6. **For performance:** use profiling or timing to identify the slow path
7. **For logic bugs:** add logging at decision points to trace data flow
8. Find the minimal reproduction case (fewest files, simplest input that triggers the issue)

Display the isolated component:

```
> Isolated to: {component/file/function}
```

9. **Exit criteria:** Failing component identified.

**Shortcut:** If the error includes an obvious stack trace pointing to a specific location, skip extensive binary search and proceed directly to that location.

## Step 5: ROOT CAUSE

Display phase banner:

```
+-----------------------------------------------+
|  ROOT CAUSE: Identifying why it fails          |
+-----------------------------------------------+
```

**Goal:** Understand not just WHERE it fails, but WHY it fails. Causation, not correlation.

### CORTEX-Aware Depth Control

Apply Issue Tree + Ishikawa MECE decomposition when the issue is NOT trivially obvious. Use this decision logic:

**Full decomposition (apply Issue Tree + Ishikawa):**
- Stack trace spans multiple files or modules
- Error message is ambiguous or misleading
- Multiple possible root causes exist
- The issue involves timing, state, or environment factors
- Previous fix attempts have failed

**Skip formal decomposition:**
- Stack trace directly points to a single-line fix with an obvious cause (e.g., "Cannot read property 'x' of undefined at line 42" with a clear null check missing)
- Build error with a self-explanatory message (e.g., "Module not found: './missing-file'")
- Type error with an obvious type mismatch

When skipping, display: `> Issue Tree: Skipped (root cause obvious from {error type/stack trace})`

When applying, display: `> Issue Tree: Applying MECE decomposition with Ishikawa categories`

### Issue Tree Decomposition

> This is the CORTEX-04 implementation: structured root-cause analysis using Issue Tree (MECE decomposition) and Ishikawa cause categories adapted for software.

Before investigating, structure the problem as an Issue Tree — a MECE (Mutually Exclusive, Collectively Exhaustive) breakdown of possible causes:

```
<issue-tree>
PROBLEM: [root problem statement]
├── {category 1}: [hypothesis]
│   ├── {sub-cause}: [evidence for/against]
│   └── {sub-cause}: [evidence for/against]
├── {category 2}: [hypothesis]
│   └── {sub-cause}: [evidence for/against]
└── {category 3}: [hypothesis]
    └── {sub-cause}: [evidence for/against]
LIKELY-ROOT: [{category}/{sub-cause}] — {evidence}
</issue-tree>
```

### Ishikawa Cause Categories

Use these software-adapted cause categories to structure the Issue Tree branches:

| Category | What to check |
|----------|--------------|
| **Code** | Logic errors, type mismatches, edge cases, off-by-one, null handling |
| **Data** | Schema mismatch, null/undefined values, encoding issues, malformed input |
| **Environment** | Node/runtime versions, OS differences, config mismatches, env vars |
| **Dependencies** | Version conflicts, breaking changes, missing packages, peer deps |
| **Timing** | Race conditions, async ordering, timeouts, event loop blocking |
| **State** | Stale cache, leaked state, initialization order, shared mutable state |

Not every category applies to every bug. Select 2-4 categories most relevant to the issue type detected in Step 2.

**CORTEX boundary:** When `/mz:debug` is invoked manually, the debug skill owns the analysis — CORTEX classification from the executor is NOT applied separately. The debug skill's own systematic methodology (REPRODUCE -> ISOLATE -> ROOT CAUSE -> FIX) governs. When debugging happens during execution (executor encounters a bug and applies auto-fix deviation rules), the executor's CORTEX classification governs instead.

### Investigation

1. Work through the Issue Tree systematically — check each branch against evidence
2. Trace execution through the failing component
3. Add logging or read code to understand the data flow at the failure point
4. Identify the EXACT condition causing failure:
   - What input triggers it?
   - What state must exist for it to fail?
   - What assumption is violated?
5. Explain causation chain: "This fails because {A} leads to {B} which causes {C}"
6. Distinguish correlation from causation: verify the root cause by predicting what behavior changes if the root cause is addressed
7. Update the Issue Tree with findings — mark branches as confirmed or eliminated
8. **Exit criteria:** Root cause identified and explained, Issue Tree resolved

Display the root cause:

```
> Root cause: {explanation}
> Evidence: {what proves this is the cause, not just a correlation}
> Category: {Ishikawa category}
```

**Direct tone:** "This fails because X" -- never "This might be related to X" or "This could possibly be caused by X." If the root cause is uncertain, say so explicitly: "Root cause is uncertain. Two candidates: {A} or {B}. Next step: {how to distinguish}."

## Step 6: FIX

Display phase banner:

```
+-----------------------------------------------+
|  FIX: Implementing and verifying the fix       |
+-----------------------------------------------+
```

**Goal:** Implement the minimal fix that addresses the root cause, verify it works, and confirm no regressions.

1. **Design the minimal fix:** smallest change that addresses the root cause. Avoid fixing adjacent issues -- scope the fix to THIS root cause only.

2. **Check TDD mode:** Read `.planning/megazord.config.json` for `quality.tdd`:
   - If TDD enabled:
     - Write a regression test FIRST that fails with the current bug
     - Run tests: confirm the regression test fails
     - Implement the fix
     - Run tests: confirm the regression test passes
   - If TDD not enabled:
     - Implement the fix directly

3. **Verify the fix:**
   - Run reproduction steps from Step 3: confirm the issue is resolved
   - Run the full test suite: confirm no regressions
     ```bash
     bun test
     ```

4. **Commit the fix** (if within an execution context or if the user requests):
   ```bash
   git add {fixed_files}
   git commit -m "fix: {concise description of what was fixed and why}"
   ```

5. **Exit criteria:** Fix verified, reproduction passes, no regressions.

## Step 7: Summary

Display the debug summary:

```
+===============================================+
|  Debug Complete                                |
+-----------------------------------------------+
|  Issue: {brief description}                    |
|  Type: {issue type}                            |
|  Root cause: {one-line root cause}             |
|  Fix: {one-line fix description}               |
|  Regressions: None                             |
+===============================================+
```

Display the Next Up block:

```
===============================================
> Next Up
**Issue resolved.** Continue with your current task.
===============================================
```

## Key Behaviors

- **Four phases always in order:** REPRODUCE -> ISOLATE -> ROOT CAUSE -> FIX. Never skip phases, but shortcuts within phases are encouraged when evidence is obvious.
- **Phase banners provide observable state transitions:** the user always knows which phase the debugging is in.
- **Adapt techniques based on issue type:** do not force reproduce ceremony on build errors; do not apply binary search when a stack trace points directly to the failing line.
- **Integrate with TDD when enabled:** write regression test before fix when `quality.tdd` is true in config.
- **Direct tone throughout:** "This fails because X" not "This might be related to X." Evidence-based assertions.
- **Minimal fix principle:** fix the root cause, not symptoms. Fix THIS issue, not adjacent issues discovered during investigation.

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| No issue description provided | Step 2 | Ask the user to describe the issue. Do not proceed without context. |
| Issue not reproducible | Step 3 | Ask for more context (environment, timing, inputs). If still not reproducible after 3 attempts, document as intermittent and proceed to ISOLATE with best-available reproduction. |
| Multiple root causes found | Step 5 | Document all candidates, prioritize the most likely. Fix the primary root cause first. Note secondary causes for follow-up. |
| Fix introduces regressions | Step 6 | Revert the fix. Re-analyze the root cause -- the original analysis may be incomplete. Try a different fix approach. |
| Config file missing | Step 6 | Assume TDD is not enabled. Implement fix directly. |

## Notes

- ALWAYS use bun/bunx for any JavaScript/TypeScript operations (never npm/npx).
- This skill is manually invoked -- it does not auto-trigger during execution.
- The four-phase methodology applies regardless of issue complexity. For simple issues, phases may complete in seconds. For complex issues, each phase may require multiple exchanges with the user.
- When debugging within an active `/mz:go` execution, the fix should follow the executor's commit conventions.
