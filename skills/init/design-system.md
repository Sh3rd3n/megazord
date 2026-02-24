# Megazord Design System

Visual identity tokens for all Megazord output. Every skill references this file for consistent formatting.

Reference `@skills/shared/presentation-standards.md` for content formatting rules (summaries, tables, progress indicators, inline phase context).

## Init Banner

Display via the banner script (Power Rangers colored, auto-adapts to terminal width):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/banner.sh" "{VERSION}"
```

Full ASCII art with each letter in its Ranger color, no frame. Version and tagline on the right side to save vertical space (6 lines total).

**Power Rangers palette:**
- Red `#E63946` — M, O
- Blue `#457B9D` — E, R
- Yellow `#F4A300` — G, D
- Pink `#E891B2` — A
- Green `#2DC653` — Z

Use only at `/mz:init` startup. Replace `{VERSION}` with current version from package.json.

## Stage Banners

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► {STAGE}                        ║
╚═══════════════════════════════════════════════╝
```

Use at the start of every skill's output. Replace `{STAGE}` with the current stage name (e.g., "Configuration", "Research", "Planning").

## Action Boxes

```
╔═══════════════════════════════════════════════╗
║  {TITLE}                                      ║
╠═══════════════════════════════════════════════╣
║  {line 1}                                     ║
║  {line 2}                                     ║
╚═══════════════════════════════════════════════╝
```

Action boxes are reserved for: stage banners, PHASE COMPLETE celebrations, critical errors, and confirmation panels.

Regular summaries, status displays, and informational output use the heading-based layout from `@skills/shared/presentation-standards.md` instead.

## Separators

```
═══════════════════════════════════════════════════
```

Use between major sections within a single skill output. Do not overuse -- one per logical boundary.

## Status Symbols

| Symbol | Meaning                  | When to use                          |
|--------|--------------------------|--------------------------------------|
| ⚡     | Active / Current / Power | Current phase, active task, branding |
| ✓      | Complete / Passed        | Finished tasks, passed checks        |
| ✗      | Failed / Missing         | Failed checks, missing files         |
| ◆      | In Progress              | Currently executing                  |
| ○      | Pending                  | Queued, not yet started              |
| ⚠      | Warning                  | Non-blocking issues, deprecations    |

## Progress Display

```
Power: ██████████░░░░░░░░░░ 50%
```

Use 20-character bar. Filled = `█`, empty = `░`. Calculate percentage from completed/total.

Label can be "Power:" (branding) or contextual (e.g., "Phase 3:", "Wave 2:").

Multi-phase progress lines follow the one-line-per-phase format defined in `@skills/shared/presentation-standards.md`.

## Section Headers

```
▸ {Section Name}
```

Use for sub-sections within action boxes or skill output. Always one space after `▸`.

## Next Up Block

```
═══════════════════════════════════════════════════
▸ Next Up
**{Task Name}** -- {brief description}
`/mz:{command}`
═══════════════════════════════════════════════════
```

Use at the end of every skill output to suggest the logical next action.

## Usage Rules

1. **Init banner** -- only at `/mz:init` startup, nowhere else
2. **Stage banner** -- every skill starts with one
3. **Action boxes** -- reserved for stage banners, PHASE COMPLETE celebrations, critical errors, and confirmation panels
4. **Separators** -- between sections, max 2-3 per output
5. **Status symbols** -- use consistently, never mix meanings
6. **Progress bar** -- phase progress, plan progress, any completion metric
7. **Section headers** -- within boxes or after separators
8. **Next up block** -- always end with one, always suggest exactly one command
9. **Content formatting** -- summaries, roadmaps, phase references, and task descriptions follow `@skills/shared/presentation-standards.md`

All Megazord output MUST use these tokens. No plain text headers, no markdown `#` headings in user-facing output, no ad-hoc formatting.

## Content Formatting

For content formatting rules — how to write summaries, display roadmaps, reference phases inline, describe tasks and waves, and format progress indicators — see `@skills/shared/presentation-standards.md`.

**Boundary:**
- This file (`design-system.md`) = visual chrome (boxes, separators, banners, status symbols)
- `presentation-standards.md` = content formatting (structure, wording, what to write)
