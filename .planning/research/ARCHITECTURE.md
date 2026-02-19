# Architecture Patterns: Distribution & Publication

**Domain:** Claude Code plugin framework distribution (npm + marketplace + CI/CD)
**Researched:** 2026-02-19
**Overall confidence:** HIGH

## Recommended Architecture

Megazord has **three distribution channels** that must work in concert. Each serves a different audience and installation path, but they share a single source of truth: the GitHub repository.

```
                     +-------------------+
                     |   GitHub Repo     |
                     | sh3rd3n/megazord  |
                     +--------+----------+
                              |
              +---------------+---------------+
              |               |               |
     +--------v---+   +------v------+   +----v-----------+
     | npm publish |   | Marketplace |   | Direct clone   |
     | (bunx)      |   | (plugin)    |   | (developers)   |
     +--------+----+   +------+------+   +----+-----------+
              |               |               |
     +--------v---+   +------v------+   +----v-----------+
     | bunx        |   | /plugin     |   | git clone +    |
     | megazord    |   | install     |   | megazord       |
     | install     |   | mz@...      |   | install        |
     +-----------+-+   +------+------+   +----+-----------+
                 |            |               |
                 +------------+---------------+
                              |
                     +--------v----------+
                     | ~/.claude/plugins/ |
                     | cache/mz/         |
                     +-------------------+
```

All three paths end at the same destination: plugin files installed in `~/.claude/plugins/cache/`.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **GitHub Repo** (`sh3rd3n/megazord`) | Source of truth for all code, issues, PRs | GitHub Actions, npm registry, marketplace repo |
| **GitHub Actions CI** (`.github/workflows/ci.yml`) | Test, lint, typecheck on every PR to main | GitHub repo (trigger), Biome/Vitest (tools) |
| **GitHub Actions Publish** (`.github/workflows/publish.yml`) | Build + publish to npm on version tag | npm registry (output), GitHub repo (trigger) |
| **npm Package** (`megazord` on npmjs.com) | Distributes CLI + plugin files via `bunx megazord` | npm registry (hosted), user machine (installed) |
| **Marketplace Repo** (`sh3rd3n/megazord-marketplace`) | Plugin catalog for Claude Code native discovery | Claude Code plugin system, GitHub (hosted) |
| **package.json** | Version source of truth, deps, scripts, files manifest | npm (publish), tsdown (build), GitHub Actions (CI) |
| **plugin.json** (`.claude-plugin/plugin.json`) | Plugin manifest for Claude Code recognition | Claude Code plugin system |
| **tsdown** | Bundles TypeScript CLI to `bin/` | `src/cli/` (input), `bin/` (output) |
| **README.md** | User-facing docs and quickstart | GitHub (landing page), npm (package page) |

### Data Flow: Publish Pipeline

```
Developer bumps version in package.json + plugin.json
  -> Commits: "chore: release v1.1.0"
  -> Tags: git tag v1.1.0
  -> Pushes: git push && git push --tags
  -> GitHub Actions triggers on tag v*
     -> Checkout code
     -> Setup Bun + Node
     -> bun install --frozen-lockfile
     -> bun run typecheck
     -> bun run lint
     -> bun test
     -> bun run build (tsdown -> bin/)
     -> npm publish --provenance --access public (OIDC auth, no token)
  -> Package live on npm
  -> Users: bunx megazord install
```

```
Developer updates marketplace repo (separate repo)
  -> marketplace.json version/ref updated to match
  -> Push to sh3rd3n/megazord-marketplace
  -> Users: /plugin marketplace update megazord-marketplace
  -> Claude Code fetches updated plugin from GitHub source
  -> Plugin files cached in ~/.claude/plugins/cache/
```

## Files: New vs Modified

### Files to CREATE (new)

| File | Purpose | Priority |
|------|---------|----------|
| `.github/workflows/ci.yml` | Quality gates on PRs: typecheck + lint + test + build | P0 |
| `.github/workflows/publish.yml` | npm publish with provenance on version tags | P0 |
| `README.md` | Quickstart, commands reference, installation for both paths | P0 |
| `LICENSE` | MIT license file (referenced in package.json but missing from repo) | P0 |
| `CHANGELOG.md` | Version history visible on npm and GitHub | P1 |

### Files to MODIFY (existing)

| File | Changes Needed | Why |
|------|---------------|-----|
| **`package.json`** | Add `author`, `repository`, `homepage`, `bugs`, `keywords`, `publishConfig`, `prepublishOnly` script | npm publication requires these fields for proper package page rendering and build safety |
| **`.claude-plugin/plugin.json`** | Update `homepage`, `repository` to real GitHub URLs; add `version` field if missing; sync with package.json version | Marketplace discovery links and version tracking |
| **`.gitignore`** | No changes needed -- `bin/` is excluded from git, and `files` array in package.json includes it for npm | Already correct |
| **`src/cli/commands/install.ts`** | Replace hardcoded `const VERSION = "0.1.0"` with dynamic read from package.json | Eliminates version drift between package.json and install code |
| **`src/cli/commands/update.ts`** | Same hardcoded VERSION fix | Same reason |

### Files to CREATE in separate marketplace repo

| File | Location | Purpose |
|------|----------|---------|
| `.claude-plugin/marketplace.json` | `sh3rd3n/megazord-marketplace` repo | Plugin catalog with GitHub source pointing to main repo |
| `README.md` | `sh3rd3n/megazord-marketplace` repo | Marketplace description and installation instructions |

**Critical insight:** The `.megazord-marketplace/` directory inside the main repo is a LOCAL marketplace for development testing. For public distribution, the marketplace MUST be a separate GitHub repository because Claude Code's `/plugin marketplace add` clones the repo and expects `.claude-plugin/marketplace.json` at the repository root.

## Architecture Patterns

### Pattern 1: Dual Distribution (npm + Marketplace)

**What:** Megazord is distributed through BOTH npm (for CLI installation via `bunx megazord`) AND the Claude Code marketplace (for `/plugin install` discovery).

**When:** Always -- these serve complementary purposes for different user personas.

**npm path (power users):** `bunx megazord` downloads from npm, runs the install command, which copies plugin files into `~/.claude/plugins/cache/`. Best for users comfortable with package managers.

**Marketplace path (discovery users):** `/plugin marketplace add sh3rd3n/megazord-marketplace` then `/plugin install mz@megazord-marketplace` fetches directly from GitHub. Best for users who discover plugins through Claude Code's native UI.

**Why both:** npm gives the `bunx` one-liner install experience. Marketplace gives native Claude Code discovery, auto-updates, and the `/plugin > Discover` browsing experience. Neither alone covers all users.

**Confidence:** HIGH

### Pattern 2: Tag-Triggered npm Publish with Trusted Publishing

**What:** GitHub Actions workflow that publishes to npm when a version tag (e.g., `v1.1.0`) is pushed. Uses OIDC-based trusted publishing instead of long-lived npm tokens.

**When:** Every release.

**Implementation:**

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun test
      - run: bun run build
      # Use setup-node for npm publish (bun publish lacks --provenance support)
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm publish --provenance --access public
```

**Critical detail about bun vs npm for publishing:** Even though the project uses bun for everything in development, `npm publish` must be used for the actual publish step. npm's trusted publishing/OIDC integration requires the npm CLI. `bun publish` does not support `--provenance` or OIDC token exchange. The `actions/setup-node` step configures `.npmrc` with the registry URL, and trusted publishing provides authentication automatically via OIDC -- no `NODE_AUTH_TOKEN` secret needed.

**npmjs.com setup required:** Before first publish, configure trusted publishing on npmjs.com:
1. Log into npmjs.com, navigate to the `megazord` package settings
2. Under "Trusted Publisher", select "GitHub Actions"
3. Enter: org/user = `sh3rd3n`, repo = `megazord`, workflow = `publish.yml`
4. Save

**Confidence:** HIGH -- verified against npm trusted publishing docs and setup-bun action.

### Pattern 3: PR CI Pipeline

**What:** GitHub Actions workflow that runs quality checks on every pull request and push to main.

**Implementation:**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run lint
      - run: bun test
      - run: bun run build
```

**Confidence:** HIGH -- standard pattern, verified with oven-sh/setup-bun docs.

### Pattern 4: Version Synchronization

**What:** Single source of truth for version numbers with dynamic reading.

**Problem:** Currently `VERSION` is hardcoded as `"0.1.0"` in both `src/cli/commands/install.ts` (line 16) and `src/cli/commands/update.ts` (line 8), separate from the `package.json` version field. This causes version drift.

**Solution:** Both files should read version from package.json dynamically. The CLI entry point (`bin/megazord.mjs`) already reads package.json for the `--version` flag, so the pattern exists. Apply it to install.ts and update.ts:

```typescript
// Replace in install.ts and update.ts:
// const VERSION = "0.1.0";

// With:
function getVersion(): string {
  const pkgPath = join(import.meta.dirname, "..", "package.json");
  return JSON.parse(readFileSync(pkgPath, "utf-8")).version;
}
const VERSION = getVersion();
```

**The release flow becomes:**
1. Bump version in `package.json` (single source of truth)
2. Bump version in `.claude-plugin/plugin.json` to match (manual, same commit)
3. Run `bun run build` (rebuilds bin/ which will read version at runtime)
4. Commit: `chore: release v1.1.0`
5. Tag: `git tag v1.1.0`
6. Push: `git push && git push --tags`
7. GitHub Actions publishes to npm automatically

**Confidence:** HIGH -- standard npm versioning pattern.

### Pattern 5: files Array as npm Allowlist

**What:** The `package.json` `files` array controls what ships in the npm package. When present, it acts as an allowlist and `.gitignore` is NOT consulted by npm.

**Current state (already correct):**

```json
"files": [
  "bin",
  "dist",
  "skills",
  "agents",
  "hooks",
  "commands",
  ".claude-plugin"
]
```

This means `bin/` is excluded from git (via `.gitignore`) but INCLUDED in the npm package (via `files` array). This is the correct behavior: build output should not be in version control but must be in the published package.

**One addition needed:** `README.md` and `LICENSE` are automatically included by npm regardless of the `files` array, so they will appear in the package without explicit listing.

**No `.npmignore` needed:** The `files` allowlist is sufficient and clearer than a dual `.gitignore` + `.npmignore` approach. Adding `.npmignore` would actually OVERRIDE the `files` array behavior in confusing ways.

**Confidence:** HIGH -- confirmed by npm documentation.

### Pattern 6: Marketplace Repository Structure

**What:** A separate GitHub repository that serves as the marketplace catalog.

**Structure for `sh3rd3n/megazord-marketplace`:**

```
megazord-marketplace/
  .claude-plugin/
    marketplace.json
  README.md
```

**marketplace.json content:**

```json
{
  "name": "megazord-marketplace",
  "owner": {
    "name": "sh3rd3n"
  },
  "metadata": {
    "description": "Official Megazord framework marketplace",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "mz",
      "source": {
        "source": "github",
        "repo": "sh3rd3n/megazord",
        "ref": "main"
      },
      "description": "Unified framework for project management, code quality, and multi-agent coordination",
      "version": "1.1.0",
      "author": {
        "name": "sh3rd3n"
      },
      "homepage": "https://github.com/sh3rd3n/megazord",
      "repository": "https://github.com/sh3rd3n/megazord",
      "license": "MIT",
      "keywords": [
        "project-management",
        "code-quality",
        "agent-teams",
        "tdd",
        "workflow"
      ],
      "category": "productivity",
      "tags": ["framework", "project-management", "multi-agent", "code-quality"]
    }
  ]
}
```

**Key design decisions:**

1. **GitHub source (not relative path):** The plugin source uses `"source": "github"` pointing to the main repo. This means Claude Code clones the main repo to get the plugin files. Relative paths would only work if the plugin files were inside the marketplace repo itself.

2. **`ref: "main"`:** Points to the main branch. For versioned releases, this could be changed to `"ref": "v1.1.0"` to pin to a specific tag. Starting with `main` simplifies the initial setup.

3. **npm source alternative:** The marketplace schema supports `"source": { "source": "npm", "package": "megazord" }` but the Claude Code docs note this is "not yet fully implemented" (it triggers a validation warning). Use GitHub source for now.

**Confidence:** HIGH -- follows the exact schema from official Claude Code marketplace documentation.

### Pattern 7: Official Anthropic Directory Submission

**What:** Submit Megazord to the official Anthropic plugin directory (`anthropics/claude-plugins-official`) for discovery via `/plugin > Discover`.

**Process:**
1. Plugin must have proper `plugin.json` manifest with name, description, version, author -- already exists
2. Must have a public GitHub repository -- will exist after Phase 1
3. Submit via [clau.de/plugin-directory-submission](https://clau.de/plugin-directory-submission)
4. Anthropic performs basic automated review
5. If approved, plugin appears in the official directory and is browsable via `/plugin > Discover`

**Timing:** Submit AFTER npm publication and marketplace setup are working. The official directory is a bonus discovery channel, not the primary distribution mechanism.

**Confidence:** MEDIUM -- the submission form exists and is referenced in the official repo README, but review criteria and timeline are not publicly documented.

### Pattern 8: package.json Enrichment

**What:** Additional fields needed in package.json for proper npm publication metadata.

**Fields to add:**

```jsonc
{
  // Existing fields stay as-is, ADD these:
  "author": "sh3rd3n",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sh3rd3n/megazord.git"
  },
  "homepage": "https://github.com/sh3rd3n/megazord#readme",
  "bugs": {
    "url": "https://github.com/sh3rd3n/megazord/issues"
  },
  "keywords": [
    "claude-code",
    "claude",
    "ai",
    "framework",
    "project-management",
    "code-quality",
    "agent-teams",
    "tdd",
    "plugin"
  ],
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "scripts": {
    // ... existing scripts unchanged ...
    "prepublishOnly": "bun run build"
  }
}
```

**Why each field matters:**
- `author`: Shown on npm package page
- `repository`/`homepage`/`bugs`: npm renders clickable links on the package page
- `keywords`: npm search discoverability
- `publishConfig.access`: Ensures public publish (avoids "payment required" error on first publish)
- `publishConfig.provenance`: Default provenance generation
- `prepublishOnly`: Safety net -- ensures `bun run build` runs before every `npm publish`, preventing stale `bin/` artifacts

**Confidence:** HIGH -- standard npm package fields.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Committing bin/ to Git

**What:** Adding `bin/` to git because npm needs it in the package.
**Why bad:** Build artifacts in version control create merge conflicts, noise in diffs, and confusion about source vs output. The current `.gitignore` correctly excludes `bin/`.
**Instead:** The `prepublishOnly` script runs `bun run build` before every `npm publish`, ensuring `bin/` is fresh. The `files` array includes it in the npm package. The `postbuild` script already runs after local builds.

### Anti-Pattern 2: Long-Lived npm Token as GitHub Secret

**What:** Creating an npm automation token, storing it as `NPM_TOKEN` in GitHub repository secrets, and using it with `NODE_AUTH_TOKEN`.
**Why bad:** Token theft risk if secrets are exposed, rotation burden, overly broad permissions (a single token can publish any of your packages).
**Instead:** Use npm Trusted Publishing (OIDC). Zero secrets to manage. The authentication token is short-lived (minutes), automatically generated by GitHub Actions, and scoped to the specific workflow run.

### Anti-Pattern 3: Marketplace Inside Main Repo for Public Distribution

**What:** Using the existing `.megazord-marketplace/` directory inside the megazord repo as the public marketplace.
**Why bad:** `/plugin marketplace add` expects a Git repository (or URL) containing `.claude-plugin/marketplace.json` at the REPOSITORY ROOT. Having it as a subdirectory means users would need to add it with a path like `sh3rd3n/megazord/.megazord-marketplace`, which is not a supported format. The marketplace must be a standalone repo.
**Instead:** Create `sh3rd3n/megazord-marketplace` as a separate repo with `.claude-plugin/marketplace.json` at its root. Keep `.megazord-marketplace/` in the main repo for local development testing only (or remove it to reduce confusion).

### Anti-Pattern 4: Manual Version Bumping in Multiple Files

**What:** Manually updating version in package.json, plugin.json, install.ts, update.ts, and marketplace.json independently.
**Why bad:** Guaranteed version drift. Currently install.ts and update.ts hardcode `"0.1.0"` while package.json says `"0.1.0"` -- they match now but will diverge on first version bump.
**Instead:** `package.json` is the single source of truth. `install.ts` and `update.ts` read from it dynamically. `plugin.json` is bumped in the same release commit. Marketplace `marketplace.json` is updated in the marketplace repo as part of the release checklist.

### Anti-Pattern 5: Publishing Without Quality Gates

**What:** An npm publish workflow that skips typecheck, lint, or tests.
**Why bad:** Broken packages shipped to users. Once published, an npm version cannot be re-published (only deprecated).
**Instead:** The publish workflow runs the full `typecheck + lint + test + build` pipeline before `npm publish`. The `prepublishOnly` script provides a local safety net for manual publishes.

### Anti-Pattern 6: Using bun publish Instead of npm publish

**What:** Using `bun publish` in the GitHub Actions workflow instead of `npm publish`.
**Why bad:** `bun publish` does not support `--provenance` or OIDC token exchange (trusted publishing). The publish would fail or require a long-lived npm token.
**Instead:** Use `oven-sh/setup-bun` for install/build/test, then `actions/setup-node` for the publish step only. This gives bun's speed for development tasks and npm's OIDC support for publishing.

## Scalability Considerations

| Concern | Now (v1.1) | At 100 users | At 1K+ users |
|---------|------------|--------------|--------------|
| **npm publish** | Manual tag push | Same workflow | Same -- consider `bun run release` script that automates bump + tag |
| **Marketplace updates** | Manual push to marketplace repo | Same | Pin to tags instead of `main` for stability |
| **Version management** | Manual bump in package.json + plugin.json | Same | Add script: `bun run release patch/minor/major` that bumps both + creates tag |
| **Plugin size** | ~500KB total (skills, agents, commands, bin) | Same | Monitor; if >5MB, split experimental skills into separate plugin |
| **CI time** | <2 min (typecheck + lint + test + build) | Same | No user-scaling concern for CI |
| **Official directory** | Submit once | Keep listing updated | Submit updates for major releases only |
| **Download volume** | Negligible | npm CDN handles it | npm CDN handles it |

## Build Order Recommendation

Based on dependency analysis of what must exist before what:

### Phase 1: Repository Foundation (no external dependencies)

**Tasks:**
1. Create GitHub repo `sh3rd3n/megazord` and push existing code
2. Add `README.md` with quickstart, commands reference, installation for both paths
3. Add `LICENSE` (MIT)
4. Fix VERSION hardcoding in `install.ts` and `update.ts` to read from package.json
5. Enrich `package.json` with publication fields (author, repository, homepage, bugs, keywords, publishConfig, prepublishOnly)
6. Update `.claude-plugin/plugin.json` with real GitHub URLs and version sync

**Rationale:** Everything else depends on code being on GitHub with proper metadata.

### Phase 2: CI Pipeline (depends on Phase 1 -- needs GitHub repo)

**Tasks:**
7. Create `.github/workflows/ci.yml` (test + lint + typecheck + build)
8. Verify CI passes on a test PR to main

**Rationale:** Must have safety net before publishing anything to npm.

### Phase 3: npm Publication (depends on Phase 1 + 2 -- needs repo + CI)

**Tasks:**
9. Check npm name availability for `megazord` (may need scoped name like `@sh3rd3n/megazord`)
10. Configure npm Trusted Publishing on npmjs.com (link GitHub repo + workflow)
11. Create `.github/workflows/publish.yml`
12. Bump version to `1.1.0`, tag `v1.1.0`, push -- verify automated publish works

**Rationale:** npm is the primary distribution path. Must work before marketplace (which is a secondary channel).

### Phase 4: Marketplace (can run in parallel with Phase 3)

**Tasks:**
13. Create separate `sh3rd3n/megazord-marketplace` GitHub repo
14. Write `.claude-plugin/marketplace.json` with GitHub source pointing to main repo
15. Add marketplace README.md
16. Test locally: `/plugin marketplace add sh3rd3n/megazord-marketplace` then `/plugin install mz@megazord-marketplace`
17. Submit to `anthropics/claude-plugins-official` via the submission form

**Rationale:** Marketplace has no dependency on npm publication -- it fetches directly from GitHub. Can be set up in parallel with Phase 3. Official directory submission is last because it requires everything else to be working.

### Dependency Graph

```
Phase 1 (repo setup)
  |
  +---> Phase 2 (CI)
  |       |
  |       +---> Phase 3 (npm publish)
  |
  +---> Phase 4 (marketplace) -- can run parallel with Phase 2+3
```

## Sources

- [Claude Code Plugin Marketplaces docs](https://code.claude.com/docs/en/plugin-marketplaces) -- HIGH confidence, official Anthropic documentation
- [Claude Code Discover Plugins docs](https://code.claude.com/docs/en/discover-plugins) -- HIGH confidence, official Anthropic documentation
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) -- HIGH confidence, official Anthropic repo, includes submission form link
- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) -- HIGH confidence, official npm documentation
- [npm Provenance docs](https://docs.npmjs.com/generating-provenance-statements/) -- HIGH confidence, official npm documentation
- [oven-sh/setup-bun GitHub Action](https://github.com/oven-sh/setup-bun) -- HIGH confidence, official Bun CI action
- [Bun CI/CD guide](https://bun.com/docs/guides/runtime/cicd) -- HIGH confidence, official Bun documentation
- [npm Trusted Publishing setup guide](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) -- MEDIUM confidence, community guide verified against official docs
- [NPM Publish GitHub Action](https://github.com/marketplace/actions/npm-publish) -- MEDIUM confidence, popular third-party action (not recommended over direct npm publish)
- [Automatic npm publish with granular tokens](https://httptoolkit.com/blog/automatic-npm-publish-gha/) -- MEDIUM confidence, community reference

---
*Architecture research for: Megazord v1.1 Distribution & Publication*
*Researched: 2026-02-19*
