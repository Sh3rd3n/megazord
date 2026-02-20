# Phase 15: npm Publication - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish Megazord as `megazord-cli` on npm so anyone can install it from a clean machine. The CLI provides `install`, `update`, and `uninstall` subcommands. After install, all plugin files (skills, agents, hooks, commands) are available in Claude Code. Marketplace integration and advanced distribution are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Install experience
- Silent install — no prompts, no confirmation, no wizard
- Minimal output: just the final result (e.g., "✓ Megazord installed" with path)
- Subcommand-based CLI: `megazord-cli install`, `megazord-cli update`, `megazord-cli uninstall`, `megazord-cli version`
- On failure: full rollback — undo everything, restore previous state, clear error message

### File placement strategy
- Dedicated directory: all Megazord files go in `~/.claude/megazord/` — total isolation from user files
- Files are immutable — users must NOT modify Megazord files directly. To customize, create their own skills/hooks in their own directories
- Updates overwrite Megazord directory cleanly since files are immutable

### Package identity
- Package name: `megazord-cli` (no scope)
- Command: `bunx megazord-cli install`

### Update & uninstall
- `megazord-cli uninstall` exists — full cleanup of `~/.claude/megazord/` and all references
- Automatic update check: when user launches Claude Code with Megazord, check for new version and show message if available
- Dual update channels: `megazord-cli update` (CLI, from terminal) AND `/mz:update` skill (from within Claude Code session)

### Claude's Discretion
- How to make Megazord files visible to Claude Code (symlink vs --plugin-dir vs other approach)
- Whether/how to touch user's CLAUDE.md
- npm description and keywords for discoverability
- README strategy (single vs dedicated npm README)
- Update flow details (changelog display, sovrascrittura diretta vs diff)
- Versioning strategy (semver starting point)
- Exact update check mechanism and frequency

</decisions>

<specifics>
## Specific Ideas

- The install should feel like a "one-liner and done" experience — `bunx megazord-cli install` and you're ready
- Update notification should be non-intrusive — a single line, not blocking

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-npm-publication*
*Context gathered: 2026-02-19*
