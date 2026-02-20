# Phase 14: CI/CD Pipeline - Research

**Researched:** 2026-02-19
**Domain:** GitHub Actions CI/CD, npm Trusted Publishing, OIDC provenance
**Confidence:** HIGH

## Summary

Phase 14 requires two GitHub Actions workflows: a CI workflow (`ci.yml`) that runs on PRs to validate typecheck, lint, and tests using bun; and a release workflow (`release.yml`) that publishes to npm with OIDC provenance when a version tag is pushed.

The critical finding is that **npm provenance requires a public GitHub repository**. The Megazord repo (`sh3rd3n/megazord`) is currently **private**. It must be made public before the release workflow can produce provenance attestations. This is a hard requirement from npm -- no workaround exists.

The stack is straightforward: `oven-sh/setup-bun@v2` for installing bun (CI + publish build steps), `actions/setup-node@v4` for the publish step only (npm CLI with OIDC support). Trusted Publishing eliminates all static npm tokens -- GitHub proves identity via OIDC, npm issues short-lived credentials. First publish must be done manually due to the chicken-and-egg problem: the package must exist on npmjs.com before trusted publishing can be configured.

**Primary recommendation:** Create two lean workflow files. Use `biome ci --error-on-warnings` for zero-tolerance lint. Use Node.js 24 for the publish step (bundles npm 11 natively, no upgrade step needed). Automate branch protection via `gh api` rulesets. Make the repo public as a prerequisite.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- OIDC Trusted Publishing (zero static secrets -- npm verifies the GitHub Actions workflow identity directly)
- Provenance attestation enabled (`--provenance` flag on npm publish)
- First publish done manually (`npm publish --access public`) due to 2FA requirement for new packages -- CI takes over after that
- Plan must include step-by-step instructions for configuring Trusted Publishing on npmjs.com settings
- Tag-based trigger: pushing a `vX.Y.Z` tag starts the publish workflow
- PR workflow runs: typecheck, lint, test (all via bun)
- Warnings treated as failures -- zero tolerance (CI fails on any linter warning)
- Required: CI must pass before merge to main
- Required: No force push to main
- Direct pushes to main still allowed (solo developer)
- bun handles everything except the final `npm publish` step -- npm CLI is the only exception to the bun-only rule, required for OIDC/provenance support
- Workflow structure: `oven-sh/setup-bun@v2` for build/test, `actions/setup-node@v4` + `npm publish` for publish
- CI badge in README uses `ci.yml` placeholder URL (already set up in Phase 13) -- will activate once workflow exists

### Claude's Discretion
- Release process details: version tag/package.json mismatch validation, auto-creating GitHub Releases from CHANGELOG, workflow_dispatch as fallback trigger
- Whether to include npm pack dry-run in PR checks
- Whether publish workflow re-runs quality checks before publishing
- Node.js version for the publish step (LTS 20 or 22)
- Branch protection setup method (automated via gh API or documented manual steps)
- Repo visibility decision (private vs public) based on provenance requirements

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CICD-01 | GitHub Actions CI workflow -- lint + typecheck + test on every PR | CI workflow (`ci.yml`) using `oven-sh/setup-bun@v2`, running `bun run typecheck`, `biome ci --error-on-warnings`, `bun run test`. Triggered on `pull_request` to `main`. |
| CICD-02 | GitHub Actions CD workflow -- build + npm publish on tag/release | Release workflow (`release.yml`) triggered on `push tags: ['v*.*.*']`. Build with bun, publish with `npm publish --provenance --access public`. |
| CICD-03 | CI uses `oven-sh/setup-bun@v2` for bun and `actions/setup-node@v4` for npm publish | Verified: setup-bun@v2 (latest v2.1.2) for bun install/build/test. setup-node@v4 (or v6) for Node.js + npm in publish step only. Do NOT set `registry-url` in setup-node -- it conflicts with OIDC. |
| CICD-04 | npm publish with provenance (OIDC or granular token) | OIDC Trusted Publishing with `id-token: write` permission. Provenance requires **public repository**. npm CLI 11.5.1+ required (Node.js 24 bundles npm 11 natively). |
| DOCS-03 | README includes badges (npm version, CI status, license) | Badges already exist in README from Phase 13. CI badge references `ci.yml` -- will auto-activate when workflow file is created. No further action needed. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `oven-sh/setup-bun` | `@v2` (v2.1.2) | Install bun in GitHub Actions | Official Bun action, verified on Marketplace, auto-detects version from package.json |
| `actions/setup-node` | `@v4` | Install Node.js + npm for publish step | Official Node.js action. Note: v6 exists but v4 is stable and sufficient. |
| `actions/checkout` | `@v4` | Checkout repository code | Standard, required by all workflows |
| `biome` | `2.3.0+` (project devDep) | Lint + format in CI | Already configured in project. `biome ci` is purpose-built for CI (read-only, GitHub annotations) |
| `vitest` | `4.0.0+` (project devDep) | Test runner | Already configured as `bun run test` script |
| `softprops/action-gh-release` | `@v2` (v2.5.0) | Create GitHub Release from tag | Most popular release action, supports `generate_release_notes`, body from file |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `gh` CLI | (pre-installed on runners) | Branch protection rulesets | Automating branch protection setup via `gh api` |
| Node.js | `24` (LTS) | Runtime for npm publish step | Bundles npm 11 natively -- no `npm install -g npm@latest` needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `actions/setup-node@v4` | `actions/setup-node@v6` | v6 is newer but v4 is explicitly required by success criteria. v6 auto-enables caching (may conflict with bun). Stick with v4. |
| Node.js 24 | Node.js 22 | Node 22 bundles npm 10, which is below the 11.5.1 minimum for trusted publishing. Would need `npm install -g npm@latest` as extra step. Node 24 avoids this entirely. |
| `softprops/action-gh-release` | `gh release create` CLI | CLI is simpler but action provides better GitHub annotations and artifact upload. Either works. |
| `biomejs/setup-biome` | Run from project devDeps | setup-biome installs a standalone biome. Project already has biome as devDep via bun install. Running from project deps is simpler and ensures version consistency. |

## Architecture Patterns

### Recommended Workflow Structure
```
.github/
  workflows/
    ci.yml          # PR quality gate
    release.yml     # Tag-triggered npm publish
```

### Pattern 1: CI Workflow (`ci.yml`)
**What:** Quality gate on every PR to main
**When to use:** Every pull request
**Example:**
```yaml
# Source: Verified from oven-sh/setup-bun docs, biome CI recipe, vitest docs
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bunx biome ci --error-on-warnings .

      - name: Test
        run: bun run test
```

**Key details:**
- `bun install --frozen-lockfile` ensures reproducible installs (fails if lockfile is out of date)
- `biome ci` (not `biome check`) is CI-specific: read-only, no write/fix, GitHub annotations
- `--error-on-warnings` enforces zero-tolerance lint policy
- `bun run test` runs vitest (not `bun test`, which runs Bun's own test runner)

### Pattern 2: Release Workflow (`release.yml`)
**What:** Build and publish to npm on version tag push
**When to use:** When a `vX.Y.Z` tag is pushed
**Example:**
```yaml
# Source: npm trusted publishing docs, community discussions, blog posts
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write    # For creating GitHub Release
  id-token: write    # Required for OIDC trusted publishing

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      # Validate tag matches package.json version
      - name: Validate version
        run: |
          TAG_VERSION="${GITHUB_REF_NAME#v}"
          PKG_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
            echo "::error::Tag version ($TAG_VERSION) does not match package.json ($PKG_VERSION)"
            exit 1
          fi

      # Re-run quality checks before publishing
      - name: Typecheck
        run: bun run typecheck
      - name: Lint
        run: bunx biome ci --error-on-warnings .
      - name: Test
        run: bun run test

      # Publish to npm with OIDC + provenance
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          # Do NOT set registry-url -- it creates .npmrc that conflicts with OIDC

      - name: Publish to npm
        run: npm publish --provenance --access public

      # Create GitHub Release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

**Key details:**
- `permissions.id-token: write` is REQUIRED for OIDC -- without it, publishing fails with token errors
- Do NOT set `registry-url` in setup-node -- it creates an `.npmrc` that conflicts with OIDC authentication
- Do NOT set `NODE_AUTH_TOKEN` -- OIDC handles auth automatically
- Node.js 24 bundles npm 11 natively (satisfies >= 11.5.1 requirement)
- `--provenance` flag generates cryptographic provenance attestations
- `--access public` is needed for first CI publish (can be omitted after first publish)
- Quality checks re-run before publish as a safety net

### Pattern 3: Tag-Version Validation
**What:** Ensure git tag matches package.json version
**When to use:** In release workflow, before npm publish
**Example:**
```bash
TAG_VERSION="${GITHUB_REF_NAME#v}"
PKG_VERSION=$(node -p "require('./package.json').version")
if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
  echo "::error::Tag version ($TAG_VERSION) does not match package.json ($PKG_VERSION)"
  exit 1
fi
```

**Recommendation (Claude's Discretion):** Include this validation. It's a simple 4-line shell step that catches a common mistake (forgetting to update package.json before tagging). No third-party action needed.

### Pattern 4: Branch Protection via Rulesets
**What:** Protect main branch with required status checks
**When to use:** After CI workflow exists and has run at least once
**Example:**
```bash
# Create branch protection ruleset via gh API
gh api --method POST repos/{owner}/{repo}/rulesets \
  --input - <<'EOF'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "quality" }
        ]
      }
    }
  ]
}
EOF
```

**Recommendation (Claude's Discretion):** Automate via `gh api` rulesets. Rulesets are the modern replacement for classic branch protection rules -- they're API-first, composable, and easier to manage. Include the command in the plan as a task step. The "quality" context must match the CI job name exactly.

**Note on direct pushes:** The user wants direct pushes to main allowed (solo developer). Rulesets enforce status checks on PRs but do not block direct pushes unless explicitly configured with "restrict pushes" rules. Omitting that rule achieves the desired behavior.

### Anti-Patterns to Avoid
- **Setting `registry-url` in setup-node for OIDC:** Creates `.npmrc` that conflicts with OIDC authentication. Results in `EINVALIDNPMTOKEN` errors.
- **Setting `NODE_AUTH_TOKEN` with OIDC:** OIDC handles auth automatically. Setting a token (even empty) causes npm to use the token instead of OIDC.
- **Using `bun test` instead of `bun run test`:** `bun test` runs Bun's built-in test runner (different from vitest). `bun run test` runs the `test` script from package.json which invokes vitest.
- **Using `biome check` in CI:** `biome ci` is purpose-built for CI -- read-only mode, better runner integration, GitHub annotations.
- **Using Node.js 22 without upgrading npm:** Node 22 bundles npm 10, which doesn't support trusted publishing (requires 11.5.1+).
- **Using broad tag pattern `v*`:** Matches `v-beta`, `v1`, etc. Use `v*.*.*` for semver tags only.
- **Configuring trusted publishing before first publish:** The package must exist on npmjs.com before OIDC can be configured. First publish MUST be manual.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub Release creation | Custom API calls | `softprops/action-gh-release@v2` or `gh release create` | Handles assets, notes, draft state |
| Tag-version mismatch check | Custom marketplace action | 4-line shell script (see Pattern 3) | Simpler than adding a dependency |
| npm authentication | Manual token management | OIDC Trusted Publishing | Zero static secrets, auto-rotating |
| CI lint/format | Custom biome invocation | `biome ci --error-on-warnings` | Purpose-built for CI, annotations |

**Key insight:** This phase is mostly configuration (YAML files), not code. The main risk is misconfiguration, not missing libraries.

## Common Pitfalls

### Pitfall 1: Private Repository Blocks Provenance
**What goes wrong:** `npm publish --provenance` fails with an error when the GitHub repository is private.
**Why it happens:** npm's provenance verification requires the OIDC token's source repository to be publicly auditable. Private repos cannot provide this guarantee.
**How to avoid:** Make the repository public BEFORE the first CI publish. This is a prerequisite, not a nice-to-have.
**Warning signs:** Error message mentioning provenance generation not supported for private repositories.
**Confidence:** HIGH -- confirmed by npm official docs, multiple blog posts, and GitHub issues.

### Pitfall 2: First Publish Must Be Manual
**What goes wrong:** Attempting to use OIDC for the very first npm publish of a new package fails.
**Why it happens:** Trusted Publishing configuration on npmjs.com requires the package to already exist. Chicken-and-egg problem.
**How to avoid:** Manually run `npm publish --access public` locally for the first version. Then configure Trusted Publishing on npmjs.com. CI handles all subsequent publishes.
**Warning signs:** Cannot find trusted publisher settings for a package that doesn't exist yet.
**Confidence:** HIGH -- confirmed by npm/cli issue #8544, official docs.

### Pitfall 3: setup-node registry-url Conflicts with OIDC
**What goes wrong:** `EINVALIDNPMTOKEN` errors despite correct OIDC setup.
**Why it happens:** `registry-url` in `actions/setup-node` creates an `.npmrc` file that sets up token-based auth, which conflicts with OIDC's automatic auth mechanism.
**How to avoid:** Do NOT set `registry-url` in the setup-node step when using trusted publishing. Let npm handle registry config automatically.
**Warning signs:** Token-related errors when OIDC should be handling auth.
**Confidence:** HIGH -- confirmed by GitHub community discussion #176761, multiple blog posts.

### Pitfall 4: npm Version Too Old for Trusted Publishing
**What goes wrong:** Trusted publishing fails with "Access token expired or revoked" error.
**Why it happens:** npm CLI below 11.5.1 does not support OIDC trusted publishing. Node.js 22 bundles npm 10.
**How to avoid:** Use Node.js 24 (bundles npm 11 natively) OR add `npm install -g npm@latest` step after setup-node.
**Warning signs:** Authentication failures despite correct OIDC configuration.
**Confidence:** HIGH -- npm version requirement documented in official trusted publishing docs.

### Pitfall 5: `bun test` vs `bun run test`
**What goes wrong:** CI runs Bun's built-in test runner instead of vitest, potentially finding zero tests or running wrong test framework.
**Why it happens:** `bun test` invokes Bun's native test runner. `bun run test` invokes the `test` script from package.json (which runs vitest).
**How to avoid:** Always use `bun run test` in CI, never `bun test`.
**Warning signs:** "No test files found" or tests running with unexpected behavior.
**Confidence:** HIGH -- documented in vitest getting started guide, confirmed by project's package.json.

### Pitfall 6: Branch Protection Status Check Context Mismatch
**What goes wrong:** PR merges are not blocked by CI because the status check name in branch protection doesn't match the CI job name.
**Why it happens:** GitHub uses the `jobs.<job_id>` name as the status check context. If the ruleset specifies "CI" but the job is named "quality", they don't match.
**How to avoid:** Ensure the `required_status_checks.context` in the ruleset matches the exact job name in ci.yml.
**Warning signs:** PRs can be merged even when CI is failing.
**Confidence:** HIGH -- common misconfiguration documented in GitHub community.

### Pitfall 7: No Test Files = CI Failure
**What goes wrong:** `bun run test` (vitest) exits with code 1 when no test files exist.
**Why it happens:** vitest defaults to failing when no test files are found, as a safety measure against misconfigured test suites.
**How to avoid:** Either add at least one test file before enabling CI, or configure vitest with `passWithNoTests: true` (less safe). The project currently has zero test files.
**Warning signs:** `No test files found, exiting with code 1`.
**Confidence:** HIGH -- confirmed by running `bun run test` on the actual project.

## Code Examples

### Complete CI Workflow (`ci.yml`)
```yaml
# Source: Synthesized from oven-sh/setup-bun docs, biome CI recipe, vitest docs
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    name: Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bunx biome ci --error-on-warnings .

      - name: Test
        run: bun run test
```

### Complete Release Workflow (`release.yml`)
```yaml
# Source: npm trusted publishing docs, GitHub community #176761, blog posts
name: Release

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:

permissions:
  contents: write
  id-token: write

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Build and test with bun
      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - name: Validate version
        run: |
          TAG_VERSION="${GITHUB_REF_NAME#v}"
          PKG_VERSION=$(node -p "require('./package.json').version")
          if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
            echo "::error::Tag version ($TAG_VERSION) does not match package.json ($PKG_VERSION)"
            exit 1
          fi

      - name: Typecheck
        run: bun run typecheck

      - name: Lint
        run: bunx biome ci --error-on-warnings .

      - name: Test
        run: bun run test

      # Publish with Node.js (npm CLI required for OIDC/provenance)
      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Publish to npm
        run: npm publish --provenance --access public

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

### npmjs.com Trusted Publishing Configuration Steps
```
1. Manually publish first version:
   npm publish --access public
   (Requires local npm login + 2FA)

2. Go to https://www.npmjs.com/package/megazord-cli/access

3. Under "Publishing access" section, find "Trusted Publisher"

4. Click "GitHub Actions" then "Set up connection"

5. Fill in the form:
   - Organization or user: Sh3rd3n (case-sensitive, must match GitHub)
   - Repository: megazord
   - Workflow filename: release.yml (just filename, not full path)
   - Environment: (leave empty, unless using GitHub environments)

6. Click "Set up connection" to save

7. Optionally: Under publishing access, enable
   "Require two-factor authentication and disallow tokens"
   for enhanced security (since OIDC replaces all tokens)
```

### Branch Protection Ruleset Setup
```bash
# Source: GitHub REST API docs for rulesets
gh api --method POST repos/sh3rd3n/megazord/rulesets \
  --input - <<'EOF'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          {
            "context": "Quality"
          }
        ]
      }
    }
  ]
}
EOF
```

**Note:** The `context` value "Quality" must exactly match the `name:` field of the CI job. The "deletion" rule prevents branch deletion. The "non_fast_forward" rule prevents force pushes. Direct pushes to main remain allowed (no "restrict pushes" rule).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm granular/classic tokens | OIDC Trusted Publishing | Sept 2025 (GA) | Zero static secrets, auto-rotating credentials |
| Classic branch protection | Repository rulesets | 2023+ (rulesets GA) | API-first, composable, no "double enforcement" |
| `actions/setup-node@v3` | `actions/setup-node@v4` (v6 available) | 2024 | Node 20 runtime, auto-caching |
| npm 10 bundled with Node 22 | npm 11 bundled with Node 24 | Oct 2025 (Node 24 LTS) | Native trusted publishing support |
| `biome check` in CI | `biome ci` | Biome 1.x+ | Read-only mode, CI annotations, better DX |
| Classic npm tokens | Blocked for new creation | Nov 2025 | Classic tokens deprecated, must migrate |

**Deprecated/outdated:**
- **Classic npm tokens:** Blocked for new creation since Nov 5, 2025. Granular tokens still work but OIDC is recommended.
- **`actions/create-release`:** Archived, no longer maintained. Use `softprops/action-gh-release@v2` or `gh release create`.
- **`actions/setup-node@v3`:** Still works but uses Node 16 runtime (EOL). v4 uses Node 20.

## Discretion Recommendations

### Version Tag/Package.json Validation
**Recommendation: Include.** A 4-line shell script (see Pattern 3) catches a common release mistake. No external dependency. Cost: ~2 seconds of CI time.

### Auto-Creating GitHub Releases
**Recommendation: Include.** Use `softprops/action-gh-release@v2` with `generate_release_notes: true`. GitHub auto-generates release notes from merged PRs and commits. Simple, no CHANGELOG parsing needed.

### workflow_dispatch as Fallback Trigger
**Recommendation: Include.** Adding `workflow_dispatch` to the release workflow allows manual re-trigger from the GitHub UI if a release fails partway through. Zero cost, high value for recovery.

### npm pack Dry-Run in PR Checks
**Recommendation: Skip.** The project already has `"files"` array in package.json that controls what's published. Running `npm pack --dry-run` in CI would add ~3 seconds and minimal value since the files field is static. Better to validate once manually during setup.

### Re-Running Quality Checks Before Publishing
**Recommendation: Include.** Re-running typecheck, lint, and test in the release workflow adds ~15 seconds but provides a safety net. The tag could have been pushed on a commit that bypassed CI (direct push to main). Belt-and-suspenders approach.

### Node.js Version for Publish Step
**Recommendation: Node.js 24.** It's already LTS (since Oct 2025), supported through April 2028, and bundles npm 11 natively. Eliminates the need for `npm install -g npm@latest`. The project's `engines.node` is `>=22`, and Node 24 satisfies this. The setup-node step only affects the publish step, not bun-based build/test steps.

### Branch Protection Setup Method
**Recommendation: Automated via `gh api` rulesets.** The `gh` CLI is pre-installed on runners and works locally. A single API call creates the ruleset. Document the command in the plan so it's reproducible and version-controllable.

### Repo Visibility
**Recommendation: Make public.** Provenance is a locked decision. Provenance requires a public repo. Therefore the repo must be made public. Include this as a prerequisite step in the plan with a note about the irreversibility of the decision (public repos cannot easily be made private again if they have forks/dependents).

## Open Questions

1. **Vitest with no test files**
   - What we know: The project currently has zero test files. Running `bun run test` exits with code 1.
   - What's unclear: Whether the plan should add a placeholder test file or configure `passWithNoTests`.
   - Recommendation: Add a minimal smoke test (e.g., importing the main module) as part of Phase 14 to make CI green from day one. A failing CI on the first PR defeats the purpose.

2. **Repository name case sensitivity for OIDC**
   - What we know: npm's trusted publisher configuration is case-sensitive. GitHub shows the owner as `Sh3rd3n` (capital S) but git remote URL uses `Sh3rd3n`.
   - What's unclear: Whether the npm OIDC configuration must match `Sh3rd3n` or `sh3rd3n`.
   - Recommendation: Use the exact casing shown on GitHub (likely `Sh3rd3n`). Test with a manual trigger after first setup. Flag this in the plan as something to verify.

3. **Default branch name**
   - What we know: The current default branch is `master` (from git status), but CI workflow and badges reference `main`.
   - What's unclear: Whether the branch will be renamed to `main` before or as part of this phase.
   - Recommendation: The planner should address this. Either rename `master` to `main` as a prerequisite step, or update workflow files to use `master`. The README badges already reference `main`, suggesting a rename is expected.

## Sources

### Primary (HIGH confidence)
- [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) -- Action inputs, caching, version detection
- [actions/setup-node](https://github.com/actions/setup-node) -- v4/v6 inputs, registry-url behavior
- [Biome CI recipe](https://biomejs.dev/recipes/continuous-integration/) -- `biome ci` vs `biome check`, workflow example
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release) -- v2.5.0, generate_release_notes
- Local project analysis -- package.json, biome.json, tsconfig.json, README badges, vitest exit code

### Secondary (MEDIUM confidence)
- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) -- OIDC setup, requirements (WebFetch returned CSS, verified via blog posts)
- [npm Provenance docs](https://docs.npmjs.com/generating-provenance-statements/) -- Public repo requirement, --provenance flag
- [GitHub community discussion #176761](https://github.com/orgs/community/discussions/176761) -- registry-url OIDC conflict, NODE_AUTH_TOKEN issue
- [npm/cli issue #8544](https://github.com/npm/cli/issues/8544) -- First publish OIDC limitation, status
- [philna.sh trusted publishing guide](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) -- Practical gotchas, npm version requirement, provenance flag behavior
- [remarkablemark.org trusted publishing](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) -- Step-by-step, version requirements
- [vcfvct.wordpress.com OIDC publishing](https://vcfvct.wordpress.com/2026/01/17/publishing-to-npm-with-github-actions-oidc-trusted-publishing-what-i-learned/) -- Permissions, gotchas

### Tertiary (LOW confidence)
- None -- all findings verified with at least two sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Official action repos checked, versions verified, project deps confirmed
- Architecture: HIGH -- Workflow patterns verified across multiple official sources and recent blog posts
- Pitfalls: HIGH -- Each pitfall confirmed by at least two independent sources (docs + community)
- Discretion items: MEDIUM -- Recommendations based on synthesis of multiple sources; some items (e.g., exact npm OIDC behavior with --provenance flag) have minor conflicting reports

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days -- stable domain, but npm OIDC ecosystem is still maturing)
