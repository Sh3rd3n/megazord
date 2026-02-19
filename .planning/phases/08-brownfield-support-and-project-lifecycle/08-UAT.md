---
status: complete
phase: 08-brownfield-support-and-project-lifecycle
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md
started: 2026-02-18T18:00:00Z
updated: 2026-02-19T10:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. /mz:map Skill Defined
expected: skills/map/SKILL.md is a full orchestrator (not a stub) with 4 focus areas, parallel spawning, focus filtering, and re-mapping behavior
result: pass
note: Initially showed as /map in autocomplete due to explicit `name: map` in commands/map.md frontmatter. Fixed by removing the name field (matching all other commands). Verified by user after fix.

### 2. Mapper Agent Definition
expected: agents/mz-mapper.md exists as a comprehensive agent definition (300+ lines) with document templates for all 7 outputs, exclusion list, and secret scanning rules
result: pass

### 3. Roadmap List CLI
expected: Running `node bin/megazord.mjs tools roadmap list` outputs all 8 phases with their names and completion status
result: pass

### 4. Phase Add/Remove/Insert CLI
expected: `node bin/megazord.mjs tools roadmap add-phase`, `remove-phase`, and `insert-phase` commands are registered and respond to --help
result: pass

### 5. Milestone CLI Tools
expected: `node bin/megazord.mjs tools milestone create`, `archive`, and `audit` commands are registered and respond to --help
result: pass

### 6. Verification Gate Check
expected: Running `node bin/megazord.mjs tools roadmap check-gate --phase 7` returns meaningful verification status
result: pass

### 7. /mz:plan Brownfield Detection
expected: skills/plan/SKILL.md contains brownfield detection logic that checks for existing codebase map and suggests /mz:map when existing code is detected
result: pass

### 8. /mz:plan Phase Management Subcommands
expected: skills/plan/SKILL.md routes add-phase, remove-phase, insert-phase subcommands to CLI tools and exits without entering regular planning flow
result: pass

### 9. /mz:verify Milestone Audit Mode
expected: skills/verify/SKILL.md contains --milestone mode that aggregates verification across all phases and produces MILESTONE-AUDIT.md
result: pass

### 10. /mz:help Shows 14 Available Skills
expected: skills/help/SKILL.md lists all 14 Megazord skills as Available with usage examples for /mz:map, phase management, and milestone audit
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
