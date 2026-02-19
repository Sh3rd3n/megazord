---
phase: 14-ci-cd-pipeline
plan: 02
subsystem: infra
tags: [github-actions, npm-publish, oidc, provenance, trusted-publishing, branch-protection]

# Dependency graph
requires:
  - phase: 12-npm-packaging
    provides: "package.json with name, version, files, bin, scripts"
provides:
  - "Tag-triggered release workflow (.github/workflows/release.yml)"
  - "OIDC Trusted Publishing configuration (id-token: write)"
  - "npm publish with cryptographic provenance attestation"
  - "Automatic GitHub Release creation from tags"
  - "Branch protection ruleset (no force push, CI required for PRs)"
  - "Public repository (required for provenance)"
affects: [15-first-publish, marketplace]

# Tech tracking
tech-stack:
  added: [actions/setup-node@v4, softprops/action-gh-release@v2]
  patterns: [oidc-trusted-publishing, tag-triggered-release, version-validation]

key-files:
  created: [.github/workflows/release.yml]
  modified: []

key-decisions:
  - "Node.js 24 for publish step — bundles npm 11 natively, no upgrade needed"
  - "workflow_dispatch included as fallback trigger for manual re-runs"
  - "Quality checks re-run before publish as safety net (~15s cost)"
  - "Version validation via 4-line shell script (tag vs package.json)"
  - "Repository made public — required for provenance attestation"
  - "Rulesets API for branch protection — modern, API-first approach"

patterns-established:
  - "Tag-to-publish: push vX.Y.Z tag triggers build+publish pipeline"
  - "Dual runtime: bun for build/test, npm CLI for publish only (OIDC)"
  - "Branch protection via rulesets API (not classic branch protection)"

requirements-completed: [CICD-02, CICD-03, CICD-04]

# Metrics
duration: 1min 33s
completed: 2026-02-19
---

# Phase 14 Plan 02: Release Workflow Summary

**Tag-triggered npm publish with OIDC provenance, automatic GitHub Releases, and branch protection ruleset on master**

## Performance

- **Duration:** 1min 33s
- **Started:** 2026-02-19T21:10:25Z
- **Completed:** 2026-02-19T21:11:58Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Release workflow publishes to npm with OIDC Trusted Publishing (zero static secrets)
- Cryptographic provenance attestation via `--provenance` flag
- Tag-version validation prevents mismatches between git tag and package.json
- Quality checks (typecheck, lint, test) re-run before publish as safety net
- GitHub Release auto-created with generated release notes on each tag push
- Repository made public (required for provenance)
- Branch protection ruleset: no force push, no deletion, CI status check required for PRs, direct pushes allowed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create release workflow and configure repository** - `ec29e62` (feat)
2. **Task 2: Configure npm Trusted Publishing** - non-blocking checkpoint (documentation only, deferred to Phase 15)

## Files Created/Modified
- `.github/workflows/release.yml` - Tag-triggered release workflow with OIDC provenance, version validation, quality re-run, and GitHub Release creation

## Decisions Made
- **Node.js 24 for publish step:** Bundles npm 11 natively, eliminating the need for `npm install -g npm@latest`
- **workflow_dispatch included:** Allows manual re-trigger from GitHub UI if a release fails partway through
- **Quality checks re-run before publish:** Belt-and-suspenders approach, ~15s cost for safety net
- **Repository made public:** Irreversible change, required for npm provenance attestation (locked user decision)
- **Rulesets API for branch protection:** Modern API-first approach, composable and reproducible

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `gh repo edit --visibility public` required `--accept-visibility-change-consequences` flag (newer gh CLI safety feature). Resolved by adding the flag.

## User Setup Required

**Trusted Publishing configuration is required after first manual publish (Phase 15).**

Step-by-step instructions for npmjs.com:

1. **First publish (Phase 15):** Run `npm publish --access public` locally (requires npm login + 2FA)
2. Go to: https://www.npmjs.com/package/megazord-cli/access
3. Find: "Publishing access" section, then "Trusted Publisher"
4. Click: "GitHub Actions" then "Set up connection"
5. Fill in the form:
   - Organization or user: `Sh3rd3n` (case-sensitive -- must match GitHub exactly, capital S)
   - Repository: `megazord`
   - Workflow filename: `release.yml` (just the filename, NOT `.github/workflows/release.yml`)
   - Environment: (leave empty -- not using GitHub environments)
6. Click: "Set up connection" to save
7. Verify: Push a test tag (e.g., `v1.0.1`) and check that the release workflow publishes successfully without any npm token
8. Optional security hardening: Enable "Require two-factor authentication and disallow tokens" for OIDC-only publishing

**Note on owner casing:** GitHub shows the owner as `Sh3rd3n` (capital S). The npm OIDC configuration is case-sensitive. If publishing fails with an OIDC error, try `sh3rd3n` (lowercase) instead.

## Next Phase Readiness
- Release workflow is ready to trigger on tag push
- First publish MUST be manual (`npm publish --access public`) due to chicken-and-egg problem
- After first publish: configure Trusted Publishing on npmjs.com (instructions above)
- Branch protection ruleset is active on master
- CI workflow from plan 14-01 is referenced but not yet created -- status check "Quality" will activate once ci.yml exists

## Self-Check: PASSED

- FOUND: `.github/workflows/release.yml`
- FOUND: `14-02-SUMMARY.md`
- FOUND: commit `ec29e62`

---
*Phase: 14-ci-cd-pipeline*
*Completed: 2026-02-19*
