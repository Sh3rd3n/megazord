# Phase 12: Package Foundation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the codebase publish-ready: fix package.json gaps, add LICENSE, create GitHub repo, resolve package metadata, and audit all user-facing strings for English. Creating documentation, CI/CD, and publishing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### License
- MIT license
- Copyright holder: Luca Derosas
- Copyright year: 2026
- LICENSE file at repo root must match `license` field in package.json

### GitHub Repository
- Repo name: `sh3rd3n/megazord` (not megazord-cli — npm name differs only because `megazord` was taken on npm)
- Start as **private** — goes public only after Phase 15 (npm publish)
- Before going public: explicit verification checkpoint with user
- Description and topics: Claude's discretion (optimize for discoverability)

### CHANGELOG
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Detail level for v1.0.0 entry: Claude's discretion
- Sections: Added/Changed/Fixed/Removed as applicable

### Versioning
- Start at **1.0.0** — the project is stable and the roadmap already calls phases 1-11 "v1.0"
- Semver strategy: Claude's discretion (standard semver expected)

### Language Audit
- **All user-facing text must be in English** — no Italian strings in the published package
- Scope: CLI output, skill prompts, agent descriptions, error messages, comments, docs
- This audit is part of Phase 12, not deferred to documentation

### Package Files
- Fix `scripts/` missing from `files` array (known showstopper from STATE.md)
- `npm pack --dry-run` must include: `scripts/`, `bin/`, `hooks/`, `skills/`, `agents/`, `commands/`
- Must exclude: `.planning/`, `.git/`, `.DS_Store`

### Claude's Discretion
- GitHub repo description text
- GitHub topics/tags selection
- CHANGELOG v1.0.0 detail level
- Semver strategy for future releases
- Exact package.json metadata fixes beyond the known `scripts/` gap

</decisions>

<specifics>
## Specific Ideas

- npm package name is `megazord-cli` (decided in v1.0 — `megazord` taken by squatter)
- `npm publish` must be used instead of `bun publish` for OIDC/provenance (CI-only exception, relevant for Phase 14-15)
- User wants verification checkpoint before any public visibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-package-foundation*
*Context gathered: 2026-02-19*
