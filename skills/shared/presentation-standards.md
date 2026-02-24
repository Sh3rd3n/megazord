---
name: presentation-standards
description: Single source of truth for all content formatting rules across Megazord skills — summaries, roadmap displays, inline phase context, wave/task descriptions, and progress indicators.
---

# Presentation Standards

All skills that produce summaries, tables, roadmap displays, progress output, or phase/plan references MUST follow these standards.

**Skills that reference this document:** status, plan, go, verify, lifecycle, discuss

For visual chrome (ASCII boxes, stage banners, separators, the init banner), see `@skills/init/design-system.md`. This document governs CONTENT formatting — what to write and how to structure it. The design system governs CHROME — the visual wrapper around that content.

---

## 1. Summary Format Rules

Summaries use markdown H3 headings for category sections. No flat bullet lists, no ASCII box borders.

**Heading structure:**

```
### Goal
{one functional line — user-centric}

### Status
{emoji + progress bar + text}

### Plans
{plan summaries — one line each}

### Next Up
{single actionable next step}
```

**Goal line — user-centric language:**
- Write what users can DO, not what the system IMPLEMENTS
- "Users can log in with email and password" — not "Implements JWT authentication"
- "Projects get structured with opinionated defaults" — not "Executes initialization workflow"

**Plan summaries — goal + task count + status:**

```
Plan 03-01: presentation standards foundation — 2 tasks (complete)
Plan 03-02: skill wiring — 3 tasks (1 completed)
Plan 03-03: progress indicators — 2 tasks (pending)
```

**ASCII box borders — reserved for important moments only:**
- Allowed: PHASE COMPLETE celebration, critical errors, confirmation panels
- Not allowed: regular summaries, status displays, informational output

**Before / after example:**

Before (dense box format — incorrect):
```
╔═══════════════════════════════════════════════╗
║  Phase 3 Summary                              ║
╠═══════════════════════════════════════════════╣
║  - Implements presentation formatting rules   ║
║  - 5 plans total, 1 completed                 ║
║  - Status: in progress                        ║
╚═══════════════════════════════════════════════╝
```

After (heading format — correct):
```
### Goal
Output is scannable at a glance — clean headings, Unicode progress bars, functional descriptions everywhere.

### Status
◆ ████░░░░░░ Phase 3: Presentation — 1/5 plans complete

### Plans
Plan 03-01: presentation standards foundation — 2 tasks (complete)
Plan 03-02: status + roadmap wiring — 3 tasks (pending)
Plan 03-03: go/verify progress indicators — 2 tasks (pending)
```

---

## 2. Status Indicator Rules

Always combine all three cues: emoji + progress bar + text. Never use just one or two.

**Formula:**
```
{emoji} {progress_bar} {label}: {name} — {functional_sentence} ({completed}/{total})
```

**Progress bar calculation:**
- Bar width: 10 characters (default)
- Filled characters: `round(percentage / 100 * bar_width)`
- Filled block: `█`
- Empty block: `░`
- Example at 40%: `████░░░░░░`

**Emoji mapping (reused from design-system.md):**

| Symbol | Meaning      | When to use                          |
|--------|--------------|--------------------------------------|
| ✓      | Complete     | Finished phase, all plans done       |
| ◆      | In Progress  | Currently active phase               |
| ○      | Pending      | Not yet started                      |
| ⚡     | Active/Power | Current task, branding accents       |
| ✗      | Failed       | Error or blocked state               |
| ⚠      | Warning      | Non-blocking issue                   |

**Completed phases — visually dimmed:**
- Use checkmark and show count, no progress bar needed
- Format: `✓ Phase 1: Interview Options — structured choices with modern defaults (3/3)`

**Active phase — full detail:**
- Format: `◆ ████░░░░░░ Phase 3: Presentation — output scannable a colpo d'occhio (2/5)`

**Pending phase — minimal:**
- Format: `○ Phase 5: Update Lifecycle — keeping skills and config current (0/3)`

**Multi-phase summary — one line per phase, no multi-line blocks:**
```
✓ Phase 1: Interview Options — structured choices with modern defaults (3/3)
✓ Phase 2: Interview Flow — intelligent questioning and pushback (4/4)
◆ ████░░░░░░ Phase 3: Presentation — output scannable a colpo d'occhio (2/5)
○ Phase 4: Plan Context — inline context everywhere (0/3)
○ Phase 5: Update Lifecycle — keeping skills and config current (0/3)
```

---

## 3. Roadmap Display Rules

Use a formatted list, NOT a markdown table. Formatted lists are more readable in terminal output and avoid column alignment issues.

**Format per line:**
```
{emoji} Phase {N}: {Name} — {functional_description} ({completed}/{total})
```

**Functional descriptions:**
- One short sentence, maximum 8-10 words
- Extracted from the phase Goal in ROADMAP.md — no extra field to maintain
- Describe what the phase DOES for the user, not what it IS technically
- Shorten longer Goal text to fit: pick the core verb + object

**Completed phases — shown but visually secondary:**
```
✓ Phase 1: Interview Options — structured choices with modern defaults (3/3)
```

**Active phase — full detail with progress bar:**
```
◆ ████░░░░░░ Phase 3: Presentation — output scannable a colpo d'occhio (2/5)
```

**Full roadmap example:**
```
✓ Phase 1: Interview Options — structured choices with modern defaults (3/3)
✓ Phase 2: Interview Flow — intelligent questioning and pushback (4/4)
◆ ████░░░░░░ Phase 3: Presentation — output scannable a colpo d'occhio (2/5)
○ Phase 4: Plan Context — inline context everywhere (0/3)
○ Phase 5: Update Lifecycle — keeping skills and config current (0/3)
```

**What NOT to do:**

Avoid markdown tables for roadmap display:
```
| Phase | Name         | Status | Progress |
|-------|--------------|--------|----------|
| 1     | Options      | ✓      | 3/3      |
```
Tables misalign in monospace terminals and are harder to scan at a glance.

---

## 4. Inline Phase Context Rules

Every reference to "Phase X" MUST include name + functional sentence. Never use a bare phase number.

**Template:**
```
Phase {N}: {Name} — {functional_sentence_from_goal}
```

**Template for plans:**
```
Plan {NN}-{MM}: {brief_objective}
```

**Applied everywhere — no exceptions:**
- Summaries and status output
- Error messages: "Error in Phase 3: Presentation — output scannable a colpo d'occhio"
- Next Up blocks: "Next Up: Phase 4: Plan Context — inline context everywhere"
- Execution logs: "Continuing Phase 3: Presentation..."
- Cross-references between skills

**Functional sentence extraction:**
- Pull from the Goal field in ROADMAP.md for the relevant phase
- Shorten if needed: keep the core functional clause, drop filler words
- The sentence should answer "what does this phase make possible?"

**Examples — correct:**
```
Phase 3: Presentation — output scannable a colpo d'occhio
Phase 1: Interview Options — structured choices with modern defaults
Plan 03-02: skill wiring — phase context visible in every citation
```

**Examples — incorrect (bare references):**
```
Phase 3
Plan 03-02
the current phase
```

---

## 5. Wave and Task Description Rules

Wave descriptions include functional context — not just a wave number.

**Wave format:**
```
Wave {N}/{total} — {task_count} tasks in parallel: {comma-separated task names}
```

**Example:**
```
Wave 2/3 — 3 tasks in parallel: JWT session, API middleware, login UI
```

**Task descriptions — functional, not technical:**
- Write what the task accomplishes, not what code is added
- "Implement JWT session persistence" — not "Add middleware"
- "Wire roadmap display to status skill" — not "Update status.md"
- "Extract functional descriptions from ROADMAP.md" — not "Parse roadmap"

**Task execution display:**
```
████░░░░░░ Task {N}/{total}: {functional_task_description}
```

**Example:**
```
████░░░░░░ Task 3/5: implement session middleware
```

The progress bar shows overall task progress, not just the current wave.

---

## 6. Progress Indicator Rules (Long Operations)

Long operations show current step plus context — never a bare spinner or blank wait.

**Current step with context:**
```
Researching auth patterns... (2/4 sources)
Scanning project structure... (done)
Generating plan... (wave 1/3)
```

**Task execution with total progress:**
```
████░░░░░░ Task 3/5: implement session middleware
```

**Wave detail line:**
```
Wave 2/3 — 3 tasks in parallel
```

**Error inline with recovery hint:**
```
✗ Task 3: session middleware — type error in auth.ts:42. Run /mz:debug
```

Error format: `✗ Task {N}: {task_name} — {brief_description}. {recovery_action}`

**What to always include for long operations:**
- What is happening right now (not "Processing...")
- Where in the sequence (N/total)
- Recovery path when something fails (specific command or action)

---

## 7. Cross-Reference Directive

This document is the single source of truth for content formatting. The following skills MUST follow these standards when producing any output:

- `skills/cortex/` — status summaries, execution logs, progress indicators
- `skills/init/` — interview summaries, plan output, phase status
- `skills/plan/` — roadmap display, plan summaries, progress output
- `skills/go/` — wave/task descriptions, execution progress, error output
- `skills/verify/` — verification summaries, check results, status output
- `skills/lifecycle/` — update summaries, migration output, phase references
- `skills/discuss/` — session summaries, inline phase references

Reference `@skills/shared/terminology.md` for official term definitions used across all skill output.

**Boundary with design-system.md:**
- `presentation-standards.md` = CONTENT formatting (what to write, how to structure it)
- `design-system.md` = CHROME formatting (ASCII boxes, separators, color, stage banners)

When in doubt: if it's about structure and wording, use this document. If it's about visual wrapping and decoration, use design-system.md.

---

## 8. Next Up Block Rules

Every skill output MUST end with a Next Up block. This block is the authoritative format for all next-action suggestions across Megazord.

**Structure:**

```
## Next Up

**{Phase {N}: {Name} — {functional_sentence}}**
`/mz:{command} {phase_number}`

- Alternative: `/mz:{other_command} {phase_number}` — {brief description}

<sub>`/clear` — start fresh context for the next step</sub>
```

**Rules:**

1. **Heading:** Use `## Next Up` (standard markdown H2) — no decorative symbols, no ASCII box borders, no separator lines wrapping the block
2. **Command format:** Display the primary command in a backtick inline on its own line — clean, copy-pasteable, no arrows, boxes, or emoji interfering with the command text
3. **Specific phase numbers:** Commands ALWAYS include the specific phase number (e.g., `/mz:plan 4` never bare `/mz:plan` when a phase is known); `/mz:go` operates on the current phase and does not need a number, but add inline phase context in the description line above
4. **Command prominence:** Main command displayed first and prominently, followed by 1-2 alternatives as a secondary bullet list (indented, labeled with "Alternative:")
5. **`/clear` placement:** Always include `/clear` suggestion as a `<sub>` note at the bottom of every Next Up block — this is the standard and only placement
6. **Visual separation:** Block is preceded by a blank line from the previous content section — it is a visually distinct section, not inline prose
7. **Inline phase context:** When the next action involves a specific phase, include a bold description line before the command: "**{What to do}: Phase {N}: {Name} — {functional_sentence}**" so users always know what they are doing next

**Before / after example:**

Before (separator-boxed format — incorrect):
```
═══════════════════════════════════════════════════
▸ Next Up
**Execute Phase 4: Navigation** — start with plan 01
`/mz:go`
═══════════════════════════════════════════════════
```

After (heading format — correct):
```
## Next Up

**Execute Phase 4: Navigation — users always know what to do next**
`/mz:go`

<sub>`/clear` — start fresh context for the next step</sub>
```

**Commands that require phase numbers:**

| Command | Format | When to use |
|---------|--------|-------------|
| `/mz:plan` | `/mz:plan {N}` | Planning a specific phase |
| `/mz:verify` | `/mz:verify {N}` | Verifying a specific phase |
| `/mz:discuss` | `/mz:discuss {N}` | Discussing a specific phase |
| `/mz:go` | `/mz:go` | Execute current phase (no number needed, always add phase context line above) |
| `/mz:init` | `/mz:init` | Project initialization (no phase) |
| `/mz:status` | `/mz:status` | Project status (no phase) |

---

## 9. Terminology Consistency

All skill output MUST use official terms from `@skills/shared/terminology.md`. Key rules:

- **One name per concept:** A phase is always "phase", never "stage" or "section"
- **No synonym drift:** If the glossary says "complete", do not write "done" or "finished" in output
- **Context exceptions:** "Step" for skill-internal flow, "stage" only in "stage banner", "run" in informal contexts

See `@skills/shared/terminology.md` for the complete glossary.
