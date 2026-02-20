---
name: cortex
description: Adaptive reasoning engine -- classifies task complexity via Cynefin and applies structured thinking frameworks
disable-model-invocation: true
---

# CORTEX: Adaptive Reasoning Engine

CORTEX classifies every task through Cynefin domains (Clear/Complicated/Complex/Chaotic) and applies appropriate mental models from untools.co. It is a protocol reference consumed by the executor during task execution when `cortex_enabled: true`.

CORTEX is NOT a manually invocable skill. It activates automatically as part of the executor flow before each task when the config flag is enabled.

## Classification Heuristic Matrix

Before every task, assess the domain using these concrete heuristics. Each signal is evaluated independently.

| Signal | Clear | Complicated | Complex | Chaotic |
|--------|-------|-------------|---------|---------|
| **LOC estimate** | <50 | 50-300 | >300 or new architecture | N/A (broken state) |
| **Files affected** | 1-2 | 3-5 | 6+ or new module structure | N/A |
| **New APIs/interfaces** | 0 | 1-2 internal | External API or new public interface | N/A |
| **Module scope** | Same module | 2-3 modules | 4+ modules or cross-system | N/A |
| **Pattern familiarity** | Well-known, done before | 2+ valid patterns to choose from | No clear pattern, novel territory | N/A |
| **Existing test coverage** | Tests exist, minor modification | Tests need modification | No existing test patterns | Tests failing on unrelated code |
| **Side effects** | None | Localized, predictable | Distributed, hard to trace | Cascading failures |
| **External dependencies** | None new | Internal packages | External services, 3rd-party APIs | External service down/corrupt |

### Classification Algorithm

1. Evaluate each signal independently
2. Task domain = HIGHEST domain any signal triggers
3. Chaotic ONLY triggered by crisis signals (build broken, tests failing on unrelated code, external service down, data corruption, security incident) -- never by quantitative thresholds alone
4. When signals conflict, explain the override: `CORTEX: Complicated -- 30 LOC but new external API integration elevates from Clear`

## Classification Output Format

- **Clear:** `CORTEX -> Clear -- {2+ concrete signals}` (NO visible output beyond this internal classification -- user sees nothing)
- **Complicated:** `CORTEX -> Complicated | {signals} | Applying: {framework list}`
- **Complex:** `CORTEX -> Complex | {signals} | Applying: {framework list}`
- **Chaotic:** `CORTEX: Chaotic -- {description}. Requesting user input.` (STOP execution)

For Complicated+ tasks, the classification line is the `<summary>` of a collapsible `<details>` block.

## Post-Classification Protocol

- **Clear:** Execute directly. No framework output. No CORTEX output visible to user.
- **Complicated:** Output challenge block inside `<details>`, then execute.
- **Complex:** Output challenge block + complex analysis block inside `<details>`, select approach, proceed.
- **Chaotic:** STOP and request user input.

## Challenge Block Template (Complicated+ Tasks)

For every Complicated or Complex task, produce this block:

```xml
<details>
<summary>CORTEX -> {domain} | {signals} | Applying: {framework list}</summary>

<challenge domain="{complicated|complex}">
INVERSION (Pre-mortem):
  1. "This fails when {specific scenario 1}"
  2. "This fails when {specific scenario 2}"
  3. "This fails when {specific scenario 3}"

ASSUMPTIONS (Ladder of Inference):
  For each key assumption:
  - Data: {observable fact}
  - Interpretation: {what we read into the data}
  - Assumption: {inference we're making}
  - Status: {verified (checked in code/docs) | unverified (guessed)}

SECOND-ORDER (Consequence trace):
  If we do X:
  -> First-order: {immediate effect}
  -> Second-order: {what follows from that}
  -> Third-order: {what follows from that} (if relevant)

COUNTER: {strongest argument against this approach}
VERDICT: proceed | modify | reject
</challenge>

</details>
```

### Challenge Block Rules

- **INVERSION:** Exactly 3 pre-mortem failure scenarios, specific not vague. "This fails when..." not "This might fail"
- **ASSUMPTIONS:** Trace chain from data through interpretation to assumption. Mark verified/unverified. Catches assumption jumps where conclusions skip evidence rungs.
- **SECOND-ORDER:** Follow consequence chain at least 2 steps. "If we do X, then Y happens, and then Z follows." Surfaces cascading effects invisible at first glance.
- **COUNTER:** Genuine attack, not a softball
- **VERDICT:** Honest assessment. If modify: state changes. If reject: explain, propose alternative.

## Complex Analysis Block Template (Complex Tasks Only)

When a task is classified as Complex, produce this block AFTER the challenge block and BEFORE execution:

```xml
<details>
<summary>CORTEX Complex Analysis</summary>

<complex-analysis>
FIRST-PRINCIPLES:
  Irreducible truths about this problem:
  1. {fundamental truth}
  2. {fundamental truth}
  3. {fundamental truth}

  Decomposition method: {Five Whys | Socratic Questioning}
  {Show the chain of questions that reached these fundamentals}

ABSTRACTION-LADDERING:
  WHY (move up): {What's the real problem behind the stated problem?}
  REFRAMED: {The problem restated at a higher abstraction level}
  HOW (move down): {What specific approaches address the reframed problem?}

ALTERNATIVES:
  1. {approach} -- tradeoffs: {pro/con}
  2. {approach} -- tradeoffs: {pro/con}
  3. {approach} -- tradeoffs: {pro/con}

SELECTED: {N} -- {rationale with evidence}
</complex-analysis>

</details>
```

### Complex Analysis Rules

- **FIRST-PRINCIPLES:** Decompose to fundamentals -- what are the irreducible truths about this problem? Strip away conventions and assumptions to find bedrock facts. Use Five Whys or Socratic Questioning to reach them, and show the chain of questions.
- **ABSTRACTION-LADDERING:** Move up (WHY) to find the real problem behind the stated problem, then reframe it, then move down (HOW) to find specific approaches that address the reframed problem. This prevents solving the wrong problem.
- **ALTERNATIVES:** Generate at least 3 approaches with explicit tradeoffs (pro/con for each).
- **SELECTED:** Document selection rationale with evidence, not just preference.

## Iceberg Analysis Template (Recurring-Area Tasks)

**Trigger condition:** Task touches a module/area that was flagged as problematic in a prior SUMMARY.md (mentioned in "Deviations from Plan", "Issues Encountered", or "Deferred Issues" sections -- NOT merely listed as modified). This distinguishes recurring problems from normal development iteration.

Skip Iceberg Analysis on fresh tasks with no prior history.

```xml
<details>
<summary>CORTEX Iceberg Analysis: {area}</summary>

<iceberg area="{module/area name}">
EVENT: {What happened -- the surface symptom}
PATTERN: {Has this happened before? Evidence from SUMMARY.md, git history, or prior tasks}
STRUCTURE: {What system dynamics cause this pattern? Dependencies, coupling, tech debt, missing abstractions}
MENTAL-MODEL: {What assumption about this area keeps producing the pattern?}
LEVERAGE: {Where to intervene for a lasting fix, not just symptom treatment}
</iceberg>

</details>
```

### Iceberg Model Rules

- **EVENT:** Describe the surface symptom that triggered analysis
- **PATTERN:** Provide evidence of recurrence (prior SUMMARY references, git log patterns, task history)
- **STRUCTURE:** Identify systemic causes -- dependencies, coupling, tech debt, missing abstractions
- **MENTAL-MODEL:** Surface the assumption that perpetuates the pattern
- **LEVERAGE:** Identify the highest-leverage intervention point for a lasting fix, not just symptom treatment

## Anti-Patterns

- **Vague classification:** Always cite at least 2 concrete signals. "This seems complicated" is never acceptable.
- **Framework theater:** Frameworks must produce insights, not boilerplate. If a framework section reads like a template with blanks filled in, it is not adding value.
- **Over-classifying:** Do not inflate complexity to justify elaborate output. Simple tasks should stay Clear even if the executor could produce impressive-looking analysis.
- **Under-classifying:** Do not downplay complexity to avoid work. If multiple signals point to Complicated, do not classify as Clear.
- **CORTEX noise on Simple/Clear tasks:** Absolutely NO visible output. The user decision is explicit -- Simple/Clear tasks get no CORTEX output shown to the user.

## Complementary Frameworks

When they fit naturally, CORTEX may complement with:

- **5 Whys** -- During First Principles decomposition as a method for reaching irreducible truths
- **MECE** -- During Issue Tree construction to ensure mutually exclusive, collectively exhaustive decomposition

No other additions -- keep the set focused.
