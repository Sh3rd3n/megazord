# Phase 1: Plugin Scaffold and Build Pipeline - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A developer can install Megazord as a Claude Code plugin via `bunx megazord` and have the framework load without conflicting with other plugins or exceeding context budget. Includes npm distribution, plugin manifest, TypeScript CLI build (`mz-tools`), and coexistence during migration from GSD/Superpowers.

</domain>

<decisions>
## Implementation Decisions

### Installation flow
- `bunx megazord` triggers an interactive setup focused on **installation only** (not project configuration — that's `/mz:init` in Phase 2)
- Interactive prompts cover: install location confirmation, existing plugin detection, installation verification
- If already installed: prompt asking whether to update, reinstall, or uninstall
- Feedback: minimal with spinner — short messages ("Installing...", "Done!"), no step-by-step details

### Skill naming scheme
- All slash commands use the `/mz:` prefix — short and fast to type
- No alias shortcuts — full names only (`/mz:status`, not `/mz:s`) for clarity
- `/mz:help` provides a complete listing of all skills with descriptions and usage examples

### Coexistence strategy
- **Megazord is the successor to GSD and Superpowers** — coexistence is a temporary migration state, not permanent
- During migration: each plugin keeps its own namespace (`/mz:plan` and `/gsd:plan` both exist)
- Megazord is **completely standalone** — zero dependencies on other plugins, all functionality self-contained
- No namespace conflicts: `/mz:` prefix ensures no collisions with `/gsd:` or `/superpowers:`

### CLI output style
- Tone: friendly and informative — like Vercel CLI or Railway, not dry like git
- Emoji: yes, with moderation — for section headers and status indicators, not excessive
- Colors: yes — green/success, red/error, yellow/warning, cyan/info

### Claude's Discretion
- Skill grouping strategy (flat vs sub-namespace under `/mz:`)
- Auto-detection of existing plugins during install
- Redundancy warnings when GSD/Superpowers have overlapping skills
- Plugin manifest format (standard Claude Code + any extensions needed)
- Context budget loading strategy (eager vs lazy skill loading)
- Error message format (with/without suggested actions)
- Migration tooling from GSD config (whether to offer import)
- Project directory choice (`.planning/` reuse vs separate directory)

</decisions>

<specifics>
## Specific Ideas

- Installer should feel lightweight — spinner + brief messages, not a wall of text
- The `/mz:help` experience matters — it's the first thing new users will run after install
- Coexistence must be friction-free: a developer with GSD + Superpowers + Megazord installed should never see conflicts or errors
- `bunx megazord` handles plugin installation; `/mz:init` (Phase 2) handles project configuration — clear separation of concerns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-plugin-scaffold-and-build-pipeline*
*Context gathered: 2026-02-17*
