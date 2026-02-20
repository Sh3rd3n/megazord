# Phase 14: CI/CD Pipeline - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated quality gates on pull requests and automated npm publish on version tags. Two GitHub Actions workflows: one for PR checks (typecheck, lint, test via bun), one for release (npm publish with OIDC provenance on tag push). Branch protection rules on main.

</domain>

<decisions>
## Implementation Decisions

### npm Authentication Strategy
- OIDC Trusted Publishing (zero static secrets — npm verifies the GitHub Actions workflow identity directly)
- Provenance attestation enabled (`--provenance` flag on npm publish)
- First publish done manually (`npm publish --access public`) due to 2FA requirement for new packages — CI takes over after that
- Plan must include step-by-step instructions for configuring Trusted Publishing on npmjs.com settings

### Release Process
- Tag-based trigger: pushing a `vX.Y.Z` tag starts the publish workflow
- Version tag/package.json validation, GitHub Release creation, and workflow_dispatch trigger: Claude's Discretion

### Quality Gate Scope
- PR workflow runs: typecheck, lint, test (all via bun)
- Warnings treated as failures — zero tolerance (CI fails on any linter warning)
- npm pack validation, re-running checks at publish time, and Node.js version choice: Claude's Discretion

### Branch Protection
- Required: CI must pass before merge to main
- Required: No force push to main
- Direct pushes to main still allowed (solo developer)
- Configuration method (gh API vs manual UI): Claude's Discretion

### Claude's Discretion
- Release process details: version tag/package.json mismatch validation, auto-creating GitHub Releases from CHANGELOG, workflow_dispatch as fallback trigger
- Whether to include npm pack dry-run in PR checks
- Whether publish workflow re-runs quality checks before publishing
- Node.js version for the publish step (LTS 20 or 22)
- Branch protection setup method (automated via gh API or documented manual steps)
- Repo visibility decision (private vs public) based on provenance requirements

</decisions>

<specifics>
## Specific Ideas

- bun handles everything except the final `npm publish` step — npm CLI is the only exception to the bun-only rule, required for OIDC/provenance support
- Workflow structure: `oven-sh/setup-bun@v2` for build/test, `actions/setup-node@v4` + `npm publish` for publish
- CI badge in README uses `ci.yml` placeholder URL (already set up in Phase 13) — will activate once workflow exists

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-ci-cd-pipeline*
*Context gathered: 2026-02-19*
