# Requirements: Megazord

**Defined:** 2026-02-19
**Core Value:** One framework that handles the entire development lifecycle with agents that actually communicate and coordinate

## v1.1 Requirements

Requirements for v1.1 Distribution & Publication. Each maps to roadmap phases.

### Repository Foundation

- [ ] **REPO-01**: GitHub repo `sh3rd3n/megazord` created with full code push
- [ ] **REPO-02**: Package name changed to `megazord-cli` in package.json and all references
- [ ] **REPO-03**: `scripts/` added to `files` array in package.json
- [ ] **REPO-04**: Hardcoded versions in `src/cli/commands/install.ts` and `update.ts` replaced with dynamic read from package.json
- [ ] **REPO-05**: Versions synchronized between package.json and .claude-plugin/plugin.json
- [ ] **REPO-06**: MIT LICENSE file added to project root
- [ ] **REPO-07**: `.npmignore` or `files` array configured to exclude `.planning/`, `.git/`, dev files from published package

### Documentation

- [ ] **DOCS-01**: README.md with hero paragraph, quickstart guide, and full command list with descriptions
- [ ] **DOCS-02**: README includes usage examples for key commands
- [ ] **DOCS-03**: README includes badges (npm version, CI status, license)
- [ ] **DOCS-04**: CHANGELOG.md initialized with v1.0 and v1.1 entries

### CI/CD Pipeline

- [ ] **CICD-01**: GitHub Actions CI workflow — lint + typecheck + test on every PR
- [ ] **CICD-02**: GitHub Actions CD workflow — build + npm publish on tag/release
- [ ] **CICD-03**: CI uses `oven-sh/setup-bun@v2` for bun and `actions/setup-node@v4` for npm publish
- [ ] **CICD-04**: npm publish with provenance (OIDC or granular token)

### npm Publication

- [ ] **NPM-01**: Package `megazord-cli` published on npmjs.com
- [ ] **NPM-02**: `bunx megazord-cli` installs and works on clean machine
- [ ] **NPM-03**: `publishConfig` configured in package.json

### Marketplace

- [ ] **MKT-01**: Separate repo `sh3rd3n/megazord-marketplace` with marketplace.json
- [ ] **MKT-02**: Plugin installable via `/plugin marketplace add` from marketplace repo
- [ ] **MKT-03**: Submission sent to Anthropic official directory (`claude-plugins-official`)

## Future Requirements

### TUI Interface (deferred to v1.2+)

- **TUI-01**: Terminal UI as alternative to pure CLI
- **TUI-02**: Tabs that open when agent teams spawn
- **TUI-03**: Visual agent coordination display

### CORTEX Enhancements (deferred to v1.2+)

- **CRTX-01**: Thinking patterns from untools.co integrated into CORTEX
- **CRTX-02**: Beads pattern (steveyegge/beads) integrated into CORTEX

## Out of Scope

| Feature | Reason |
|---------|--------|
| Demo GIF/video | Nice to have but not blocking for v1.1 launch |
| CONTRIBUTING.md | Can be added post-launch when contributors appear |
| npm name dispute for "megazord" | Slower path, `megazord-cli` is clear and available |
| Automated npm token rotation | Manual rotation on 90-day cycle is sufficient |
| bun publish (instead of npm publish) | bun lacks OIDC/provenance support in CI |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REPO-01 | Phase 12 | Pending |
| REPO-02 | Phase 12 | Pending |
| REPO-03 | Phase 12 | Pending |
| REPO-04 | Phase 12 | Pending |
| REPO-05 | Phase 12 | Pending |
| REPO-06 | Phase 12 | Pending |
| REPO-07 | Phase 12 | Pending |
| DOCS-01 | Phase 13 | Pending |
| DOCS-02 | Phase 13 | Pending |
| DOCS-03 | Phase 14 | Pending |
| DOCS-04 | Phase 12 | Pending |
| CICD-01 | Phase 14 | Pending |
| CICD-02 | Phase 14 | Pending |
| CICD-03 | Phase 14 | Pending |
| CICD-04 | Phase 14 | Pending |
| NPM-01 | Phase 15 | Pending |
| NPM-02 | Phase 15 | Pending |
| NPM-03 | Phase 15 | Pending |
| MKT-01 | Phase 16 | Pending |
| MKT-02 | Phase 16 | Pending |
| MKT-03 | Phase 16 | Pending |

**Coverage:**
- v1.1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 — traceability updated with phase mappings*
