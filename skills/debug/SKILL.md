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

1. Trace execution through the failing component
2. Add logging or read code to understand the data flow at the failure point
3. Identify the EXACT condition causing failure:
   - What input triggers it?
   - What state must exist for it to fail?
   - What assumption is violated?
4. Explain causation chain: "This fails because {A} leads to {B} which causes {C}"
5. Distinguish correlation from causation: verify the root cause by predicting what behavior changes if the root cause is addressed
6. **Exit criteria:** Root cause identified and explained

Display the root cause:

```
> Root cause: {explanation}
> Evidence: {what proves this is the cause, not just a correlation}
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
