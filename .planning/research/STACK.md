# Stack Research: Distribution & Publication

**Domain:** npm package publishing, CI/CD, Claude Code plugin marketplace
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

Megazord needs three distribution channels: npm registry (for `bun install megazord`), GitHub-hosted plugin marketplace (for `/plugin marketplace add`), and optionally the official Anthropic plugin directory. The stack additions are minimal: GitHub Actions workflows (YAML files, no new dependencies), npm account configuration, and marketplace.json refinement. No new runtime dependencies are needed.

**Critical finding:** `bun publish` does NOT support npm's OIDC trusted publishing or `--provenance` flag (open issues #22423 and #15601 on oven-sh/bun). The CI/CD publish step MUST use `npm publish` with a granular npm token, not `bun publish`. This is the single most important gotcha for a bun-based project publishing to npm.

---

## Recommended Stack

### CI/CD Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| GitHub Actions | N/A (platform) | CI/CD pipeline | Already hosting the repo; free for public repos; native npm token support |
| `oven-sh/setup-bun` | v2 (latest: v2.1.2) | Install bun in CI | Official action from Oven (bun creators); caches bun binary; auto-detects version from package.json |
| `actions/checkout` | v4 | Checkout repo | Standard; required by every workflow |
| `actions/setup-node` | v4 | Install Node.js for `npm publish` | Required because `bun publish` lacks OIDC/provenance support; provides `npm` CLI for the publish step |

### Publishing Tools

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `npm` CLI (via setup-node) | >=11.5.1 (Node 22+) | Publishing to npmjs.com | Only `npm publish` supports `--provenance` and trusted publishing; `bun publish` cannot do this yet |
| npm Granular Access Token | N/A | CI authentication | Classic tokens were permanently revoked Dec 2025; granular tokens are now the only option; 90-day max lifetime for write tokens |
| `bun publish --dry-run` | Current | Pre-publish validation | Validates package contents without uploading; use in CI before the actual npm publish step |

### Plugin Marketplace

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `marketplace.json` | Claude Code plugin spec | Plugin discovery catalog | Standard format for Claude Code plugin distribution; already scaffolded in `.megazord-marketplace/` |
| GitHub repository (as marketplace host) | N/A | Host the marketplace | Recommended by Anthropic docs; free; users add with `/plugin marketplace add owner/repo`; supports auto-updates |
| Anthropic plugin directory submission | N/A | Official listing | Optional but high-visibility; submit via Google Form at `clau.de/plugin-directory-submission` |

---

## Detailed Decisions

### 1. GitHub Actions Workflows Needed

**Two workflows, not one.** Keep CI (test on every push) separate from CD (publish on release).

#### CI Workflow: `.github/workflows/ci.yml`
- **Trigger:** push to `main`, pull requests
- **Steps:** checkout, setup-bun, `bun install`, `bun run lint`, `bun run typecheck`, `bun test`
- **Why separate:** Runs on every push/PR, fast feedback, no secrets needed

#### CD Workflow: `.github/workflows/publish.yml`
- **Trigger:** GitHub Release (type: published)
- **Steps:** checkout, setup-bun, `bun install`, `bun run build`, setup-node (for npm CLI), `npm publish --provenance`
- **Why release trigger:** Manual control over when to publish; version bumped in package.json before tagging; GitHub Release creates the git tag
- **Authentication:** npm granular access token stored as `NPM_TOKEN` repository secret
- **Permissions:** `id-token: write` (for provenance), `contents: read`

#### Why NOT use `bun publish` in CI:
`bun publish` does not support OIDC authentication or `--provenance` (oven-sh/bun issues #22423, #15601). Using `npm publish` in the publish step is the standard workaround. This is NOT a violation of the "always use bun" rule -- it is a CI-only exception forced by a bun limitation that has no workaround.

### 2. npm Package Configuration

Current `package.json` needs these additions for publishing:

```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/OWNER/megazord.git"
  },
  "keywords": [
    "claude-code",
    "claude-code-plugin",
    "ai-agent",
    "project-management",
    "code-quality",
    "agent-teams"
  ]
}
```

**Why `publishConfig.access: "public"`:** Prevents accidental restricted publish. Unscoped packages are always public, but explicit is safer.

**Why `publishConfig.provenance: true`:** Enables npm provenance attestation automatically. Users see a "Built and signed on GitHub Actions" badge on npmjs.com, proving the package came from your CI pipeline.

**Why `repository` field:** Required for npm provenance to work. Must match the GitHub repo URL exactly.

### 3. Claude Code Plugin Marketplace Strategy

**Two-track distribution:**

**Track A: Self-hosted marketplace (immediate)**
- Already scaffolded in `.megazord-marketplace/`
- Host as separate GitHub repo (e.g., `OWNER/megazord-marketplace`) OR as a directory in the main repo
- Users install with: `/plugin marketplace add OWNER/megazord-marketplace`
- Plugin source can point to the GitHub repo with a tag/SHA for version pinning
- Full control over updates and listing

**Track B: Anthropic official directory (deferred)**
- Submit via form at `clau.de/plugin-directory-submission`
- Required fields: plugin name, 50-100 word description, 3+ use case examples, company/org URL, contact email
- Target platform: Claude Code (option for both Claude Code and Cowork)
- No guaranteed inclusion; reviewed for quality and security
- All future updates require resubmission for safety screening
- Plugin names are permanent once submitted

**Recommendation:** Launch with Track A first. Submit to Track B after the marketplace has real users and battle-tested stability. The official directory has friction (resubmission for every update, review delays) that conflicts with rapid iteration.

### 4. Marketplace Plugin Source Format

The official Anthropic plugin directory uses ONLY two source types in practice:
- Relative paths (`"source": "./plugins/plugin-name"`) for plugins within the marketplace repo
- Git URL sources (`"source": { "source": "url", "url": "https://github.com/owner/repo.git" }`) for external plugins

**No plugins in the official directory use the `npm` source type.** While the spec supports `"source": { "source": "npm", "package": "megazord" }`, it is explicitly warned as "not yet fully implemented" in validation warnings. Use GitHub source type instead.

Recommended marketplace.json entry for external distribution:
```json
{
  "name": "mz",
  "source": {
    "source": "github",
    "repo": "OWNER/megazord",
    "ref": "v1.0.0"
  },
  "description": "Unified framework for project management, code quality, and multi-agent coordination",
  "version": "1.0.0",
  "category": "development"
}
```

### 5. Version Management

**Use manual version bumps, not semantic-release.** Rationale:

- Megazord is a single package (not a monorepo needing changesets)
- Manual version bump scripts give full control
- semantic-release adds complexity (conventional commits enforcement, release branches) that is overkill for a single-package project
- The release flow: bump version in package.json AND plugin.json, commit, push, create GitHub Release, CI publishes automatically

Add version scripts to package.json:
```json
{
  "scripts": {
    "version:patch": "npm version patch --no-git-tag-version",
    "version:minor": "npm version minor --no-git-tag-version",
    "version:major": "npm version major --no-git-tag-version"
  }
}
```

**Why `--no-git-tag-version`:** Let the developer commit the version bump and create the GitHub Release manually. The CD workflow triggers on the release event.

**Important:** Version must be updated in BOTH `package.json` AND `.claude-plugin/plugin.json`. Claude Code uses the plugin.json version to determine whether to update a plugin. If versions diverge, users will not receive updates.

### 6. Plugin Validation

Claude Code provides built-in validation:
```bash
claude plugin validate .
```
Or from within Claude Code: `/plugin validate .`

This should be added to the CI workflow to catch plugin manifest issues before publish.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `semantic-release` | Overkill for single package; enforces conventional commits; complex config | Manual version bump + GitHub Release trigger |
| `changesets` | Designed for monorepo release coordination; unnecessary for single package | Manual version bump |
| `bun publish` in CI | No OIDC, no provenance, no trusted publishing support | `npm publish --provenance` in CI only |
| `np` (npm publish helper) | Interactive CLI tool, not CI-friendly | Direct `npm publish` command |
| npm classic tokens | Permanently revoked as of Dec 2025 | npm granular access tokens |
| Trusted Publishing (OIDC) initially | Complex setup; requires npm >= 11.5.1; bun has zero support; granular tokens work fine for single-package | npm granular access token as GitHub secret; migrate to OIDC later |
| Self-hosted npm registry | Unnecessary complexity for a public package | npmjs.com directly |
| GitHub Packages (npm) | Adds friction for users (`@owner/megazord` scope, registry config needed); npmjs.com is the standard | npmjs.com directly |
| `.npmrc` committed to repo | Risk of token leakage; not needed when using CI secrets | `NODE_AUTH_TOKEN` env var in CI |
| npm source type in marketplace | Warned as "not yet fully implemented" in Claude Code validation | GitHub source type with repo + ref |
| `release-please` / `auto` / `release-it` | All add complexity for a problem (single-package release) that a 3-line script solves | Manual version bump scripts |

### On Trusted Publishing vs Granular Tokens

npm's Trusted Publishing (OIDC) eliminates long-lived tokens entirely -- GitHub Actions gets a short-lived OIDC token per run. However:
- Requires `npm` CLI >= 11.5.1 (which means Node 22.14.0+)
- `bun publish` does not support it at all
- Setup requires configuring trusted publishers per-package on npmjs.com
- Granular tokens (90-day rotation) are secure enough for a single-package project

**Decision:** Start with granular access tokens. Migrate to OIDC trusted publishing later if/when `bun publish` gains support, or if the 90-day rotation becomes annoying.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GitHub Release trigger for CD | Push tag trigger (`on: push: tags: 'v*'`) | If you want fully automated publish on tag push without writing GitHub Release notes |
| npm granular token | OIDC Trusted Publishing | When bun supports it, or if you switch to `npm publish` only and want zero secrets management |
| GitHub source in marketplace | npm source in marketplace.json | When Claude Code marks npm source as stable (currently warned as not fully implemented) |
| Manual version bump | `semantic-release` | If the project grows to multiple packages or you want conventional commit enforcement |
| Two separate workflow files | Single workflow with conditional jobs | If you prefer one file; separate files are clearer and easier to maintain |
| Self-hosted marketplace repo | Marketplace directory in main repo | If you want a single repo; separate repo is cleaner for users who only want the marketplace |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `oven-sh/setup-bun@v2` | bun 1.x | Auto-detects version from `package.json` `engines.bun` or `packageManager` field |
| `actions/setup-node@v4` | Node 22+ | Needed only for npm publish step; provides npm CLI >= 11.5.1 |
| npm granular tokens | npmjs.com | 90-day max lifetime for write tokens; must rotate before expiry |
| `bun publish` (local dev) | npm registry | Works for auth via `NPM_CONFIG_TOKEN` env var; lacks OIDC/provenance |
| Claude Code plugin system | Claude Code >= 1.0.33 | Plugin marketplace features require this minimum version |
| `marketplace.json` schema | Claude Code >= 1.0.33 | Supports github, url, relative, npm (experimental), pip source types |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.github/workflows/ci.yml` | CREATE | Lint + typecheck + test on push/PR |
| `.github/workflows/publish.yml` | CREATE | Build + publish to npm on GitHub Release |
| `package.json` | MODIFY | Add `publishConfig`, `repository`, `keywords`, version scripts |
| `.claude-plugin/plugin.json` | MODIFY | Ensure version field, author, repository, homepage match |
| `.megazord-marketplace/.claude-plugin/marketplace.json` | MODIFY | Update source to use GitHub source type with version pinning |
| `.npmrc` | DO NOT CREATE | Use CI env vars instead; no committed auth config |

---

## Sources

- [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) -- v2.1.2 (Jan 2026), input options, usage (HIGH confidence)
- [bun publish docs](https://bun.com/docs/pm/cli/publish) -- flags, `--tolerate-republish`, `NPM_CONFIG_TOKEN` env var (HIGH confidence)
- [bun CI/CD guide](https://bun.com/docs/guides/runtime/cicd) -- GitHub Actions setup patterns (HIGH confidence)
- [oven-sh/bun#22423](https://github.com/oven-sh/bun/issues/22423) -- `bun publish` does not support OIDC, closed as dup of #15601 (HIGH confidence)
- [oven-sh/bun#15601](https://github.com/oven-sh/bun/issues/15601) -- `--provenance` not implemented (HIGH confidence)
- [Claude Code plugin marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces) -- marketplace.json schema, hosting, distribution, validation (HIGH confidence)
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference) -- plugin.json schema, caching, versioning (HIGH confidence)
- [Claude Code plugins guide](https://code.claude.com/docs/en/plugins) -- plugin structure, development workflow (HIGH confidence)
- [Anthropic claude-plugins-official](https://github.com/anthropics/claude-plugins-official) -- official directory format, no npm source usage, submission form link (HIGH confidence)
- [Plugin directory submission form](https://clau.de/plugin-directory-submission) -- required fields: name, description, 3+ use cases, org URL, contact email (HIGH confidence)
- [npm access tokens docs](https://docs.npmjs.com/about-access-tokens/) -- classic tokens revoked Dec 2025, granular token 90-day cap (MEDIUM confidence)
- [philna.sh trusted publishing guide](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) -- practical gotchas: provenance flag must be explicit, repository field must match (HIGH confidence)
- [npm provenance docs](https://docs.npmjs.com/generating-provenance-statements/) -- provenance attestation setup (MEDIUM confidence)
- [GitHub Actions publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) -- workflow patterns (HIGH confidence)

---
*Stack research for: Megazord distribution & publication*
*Researched: 2026-02-19*
