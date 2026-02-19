# Megazord Design System

Visual identity tokens for all Megazord output. Every skill references this file for consistent formatting.

## Init Banner

```
╔═════════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║  ███╗   ███╗███████╗ ██████╗  █████╗ ███████╗ ██████╗ ██████╗ ██████╗   ║
║  ████╗ ████║██╔════╝██╔════╝ ██╔══██╗╚════██║██╔═══██╗██╔══██╗██╔══██╗  ║
║  ██╔████╔██║█████╗  ██║  ███╗███████║  ███╔╝ ██║   ██║██████╔╝██║  ██║  ║
║  ██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║ ███╔╝  ██║   ██║██╔══██╗██║  ██║  ║
║  ██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║███████╗╚██████╔╝██║  ██║██████╔╝  ║
║  ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝   ║
║                                                                         ║
║  ⚡ MEGAZORD v{VERSION}                                                 ║
║  Project Management × Code Quality × Agent Teams                        ║
║                                                                         ║
╚═════════════════════════════════════════════════════════════════════════╝
```

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

Use for structured information: settings summaries, file lists, status reports, confirmation panels.

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

Use 20-character bar. Filled = `█`, empty = `░`. Label is always "Power:". Calculate percentage from completed/total.

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
3. **Action boxes** -- structured data only, not prose
4. **Separators** -- between sections, max 2-3 per output
5. **Status symbols** -- use consistently, never mix meanings
6. **Progress bar** -- phase progress, plan progress, any completion metric
7. **Section headers** -- within boxes or after separators
8. **Next up block** -- always end with one, always suggest exactly one command

All Megazord output MUST use these tokens. No plain text headers, no markdown `#` headings in user-facing output, no ad-hoc formatting.
