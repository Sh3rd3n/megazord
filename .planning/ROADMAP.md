# Roadmap: Megazord

## Milestones

- ✅ **v1.0 Megazord Initial Release** — Phases 1-11 (shipped 2026-02-19)
- **v1.1 Distribution & Publication** — Phases 12-16 (in progress)

## Phases

<details>
<summary>v1.0 Megazord Initial Release (Phases 1-11) — SHIPPED 2026-02-19</summary>

- [x] Phase 1: Plugin Scaffold and Build Pipeline (2/2 plans) — completed 2026-02-17
- [x] Phase 2: Project Initialization and Configuration (2/2 plans) — completed 2026-02-17
- [x] Phase 3: Core Skills and State Management (4/4 plans) — completed 2026-02-17
- [x] Phase 4: Subagent Execution and Atomic Commits (2/2 plans) — completed 2026-02-17
- [x] Phase 5: Code Review and Verification (2/2 plans) — completed 2026-02-18
- [x] Phase 6: Agent Teams Integration (3/3 plans) — completed 2026-02-18
- [x] Phase 7: Quality and Debugging Skills (2/2 plans) — completed 2026-02-18
- [x] Phase 8: Brownfield Support and Project Lifecycle (3/3 plans) — completed 2026-02-18
- [x] Phase 9: Config Consumption Wiring (3/3 plans) — completed 2026-02-19
- [x] Phase 10: Distribution and Autocomplete Fixes (2/2 plans) — completed 2026-02-19
- [x] Phase 11: Milestone Lifecycle Completion (1/1 plan) — completed 2026-02-19

</details>

### v1.1 Distribution & Publication

**Milestone Goal:** Make Megazord installable and usable by anyone — GitHub repo, npm package, marketplace plugin, documentation, and CI/CD.

- [x] **Phase 12: Package Foundation** - Fix package.json gaps, add LICENSE, create GitHub repo, resolve package name (completed 2026-02-19)
- [ ] **Phase 13: Documentation** - README with quickstart, command reference, and usage examples
- [ ] **Phase 14: CI/CD Pipeline** - GitHub Actions for quality gates and automated npm publish
- [ ] **Phase 15: npm Publication** - Publish megazord-cli to npm with provenance attestation
- [ ] **Phase 16: Marketplace** - Separate marketplace repo and official Anthropic directory submission

## Phase Details

### Phase 12: Package Foundation
**Goal**: The codebase is publish-ready with correct metadata, no showstopper gaps, and a private GitHub repository
**Depends on**: Phase 11 (v1.0 complete)
**Requirements**: REPO-01, REPO-02, REPO-03, REPO-04, REPO-05, REPO-06, REPO-07, DOCS-04
**Success Criteria** (what must be TRUE):
  1. `sh3rd3n/megazord` exists as a private GitHub repo with all v1.0 code pushed
  2. `npm pack --dry-run` includes `scripts/`, `bin/`, `hooks/`, `skills/`, `agents/`, `commands/` and excludes `.planning/`, `.git/`, `.DS_Store`
  3. Running `node bin/megazord.mjs --version` returns the version from package.json (not a hardcoded string)
  4. LICENSE file exists at repo root and matches the license field in package.json
  5. CHANGELOG.md exists with a v1.0.0 entry documenting initial release
**Plans:** 2/2 plans complete

Plans:
- [ ] 12-01-PLAN.md — Package metadata, files array fix, LICENSE, CHANGELOG, .gitignore
- [ ] 12-02-PLAN.md — Version deduplication, language audit, GitHub repo creation

### Phase 13: Documentation
**Goal**: A new user landing on the GitHub repo or npm page can understand what Megazord is, install it, and start using it within 5 minutes
**Depends on**: Phase 12
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. README.md contains a hero paragraph explaining what Megazord is and why it exists
  2. README.md contains a quickstart section with copy-pasteable install and first-use commands
  3. README.md contains a full command reference listing all 15 `/mz:` commands with one-line descriptions
  4. README.md contains at least 3 usage examples showing real workflows (init, plan+go, verify)
**Plans:** 1 plan

Plans:
- [ ] 13-01-PLAN.md — README with hero image, badges, quickstart, command reference, and workflow examples

### Phase 14: CI/CD Pipeline
**Goal**: Every PR is automatically quality-checked and every version tag triggers a verified npm publish
**Depends on**: Phase 12
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04, DOCS-03
**Success Criteria** (what must be TRUE):
  1. A PR to main triggers a GitHub Actions workflow that runs typecheck, lint, and tests using bun
  2. Pushing a version tag (e.g., `v1.1.0`) triggers a GitHub Actions workflow that builds and publishes to npm with provenance
  3. The publish workflow uses `oven-sh/setup-bun@v2` for build/test and `actions/setup-node@v4` + `npm publish` for the publish step
  4. README.md displays working badges for npm version, CI status, and license
**Plans**: TBD

Plans:
- [ ] 14-01: TBD
- [ ] 14-02: TBD

### Phase 15: npm Publication
**Goal**: Anyone can install Megazord from npm and it works on a clean machine with no prior setup
**Depends on**: Phase 12, Phase 14
**Requirements**: NPM-01, NPM-02, NPM-03
**Success Criteria** (what must be TRUE):
  1. `npm view megazord-cli` returns package metadata from the npm registry
  2. `bunx megazord-cli` on a clean machine installs successfully and the CLI responds
  3. After `bunx megazord-cli install`, all plugin files (skills, agents, hooks, commands) are in `~/.claude/`
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

### Phase 16: Marketplace
**Goal**: Megazord is discoverable and installable through the Claude Code native plugin system
**Depends on**: Phase 15
**Requirements**: MKT-01, MKT-02, MKT-03
**Success Criteria** (what must be TRUE):
  1. `sh3rd3n/megazord-marketplace` exists as a public GitHub repo with a valid `.claude-plugin/marketplace.json`
  2. Running `claude plugin validate .` in the marketplace repo passes with no errors
  3. `/plugin marketplace add` followed by `/plugin install mz` works end-to-end in Claude Code
  4. Submission to `clau.de/plugin-directory-submission` is sent with all required fields
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

## Progress

**Execution Order:**
Phases 12 through 16 execute sequentially. Phase 14 depends on Phase 12 (not 13), so 13 and 14 could theoretically overlap, but sequential execution is simpler for a solo developer.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Plugin Scaffold and Build Pipeline | v1.0 | 2/2 | Complete | 2026-02-17 |
| 2. Project Initialization and Configuration | v1.0 | 2/2 | Complete | 2026-02-17 |
| 3. Core Skills and State Management | v1.0 | 4/4 | Complete | 2026-02-17 |
| 4. Subagent Execution and Atomic Commits | v1.0 | 2/2 | Complete | 2026-02-17 |
| 5. Code Review and Verification | v1.0 | 2/2 | Complete | 2026-02-18 |
| 6. Agent Teams Integration | v1.0 | 3/3 | Complete | 2026-02-18 |
| 7. Quality and Debugging Skills | v1.0 | 2/2 | Complete | 2026-02-18 |
| 8. Brownfield Support and Project Lifecycle | v1.0 | 3/3 | Complete | 2026-02-18 |
| 9. Config Consumption Wiring | v1.0 | 3/3 | Complete | 2026-02-19 |
| 10. Distribution and Autocomplete Fixes | v1.0 | 2/2 | Complete | 2026-02-19 |
| 11. Milestone Lifecycle Completion | v1.0 | 1/1 | Complete | 2026-02-19 |
| 12. Package Foundation | 2/2 | Complete    | 2026-02-19 | - |
| 13. Documentation | v1.1 | 0/? | Not started | - |
| 14. CI/CD Pipeline | v1.1 | 0/? | Not started | - |
| 15. npm Publication | v1.1 | 0/? | Not started | - |
| 16. Marketplace | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-17*
*Last updated: 2026-02-19 — v1.1 phases 12-16 added*
