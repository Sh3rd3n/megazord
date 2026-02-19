# Domain Pitfalls: Distribution & Publication

**Domain:** First-time npm publish of a bun-based TypeScript CLI + Claude Code plugin marketplace submission + GitHub Actions CI/CD
**Researched:** 2026-02-19
**Confidence:** HIGH (verified against npm official docs, Claude Code plugin docs, GitHub Actions docs, real issue trackers)

---

## Critical Pitfalls

Mistakes that cause broken installs, leaked files, or rejected submissions.

---

### Pitfall 1: `scripts/` Directory Missing from Published Package

**What goes wrong:**
Megazord's `hooks/hooks.json` references `${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh`, but the `scripts/` directory is NOT listed in the `files` array of `package.json`. When users install the package via npm, the hooks will try to execute a script that does not exist, causing silent failures or errors at runtime.

**Why it happens:**
The `files` array in `package.json` acts as a whitelist -- only listed directories/files are included in the published tarball. Currently the array includes `bin`, `dist`, `skills`, `agents`, `hooks`, `commands`, `.claude-plugin` but omits `scripts`. Because there is no `.npmignore` file, npm falls back to `.gitignore` for exclusion rules, but the `files` array takes precedence as a whitelist regardless.

**Consequences:**
- Hook execution fails silently or throws ENOENT errors
- Plugin appears broken immediately after install
- Users lose trust and uninstall before trying anything else

**Prevention:**
Add `"scripts"` to the `files` array in `package.json`. Then verify with `npm pack --dry-run` before every publish to confirm all referenced files are included.

**Detection:**
Run `npm pack --dry-run` locally and confirm `scripts/enforce-ownership.sh` appears in the output. Better yet: add a CI step that unpacks the tarball and verifies every file referenced by `hooks.json` exists.

**Phase to address:** Phase 1 (Package Configuration). Must be fixed before the first publish.

**Confidence:** HIGH -- directly verified by reading the current `package.json` files array and `hooks/hooks.json`.

---

### Pitfall 2: `bin/` and `dist/` Are in `.gitignore` but in `files` Array

**What goes wrong:**
The `.gitignore` contains `bin/` and `dist/`, which are build outputs. The `files` array in `package.json` also lists `bin` and `dist`. This creates a subtle interaction: when the `files` array is present, it takes precedence as a whitelist, so `bin/` and `dist/` WILL be included in the npm tarball even though they are gitignored. However, this behavior is fragile and confusing. If someone adds a `.npmignore` file later (even an empty one), it replaces `.gitignore` entirely, and the interaction changes unpredictably. Worse, if `npm pack` is run before `bun run build`, the `bin/` directory will be empty or stale.

**Why it happens:**
The interplay between `.gitignore`, `.npmignore`, and the `files` array is one of npm's most confusing behaviors. From the [npm docs](https://github.com/npm/cli/wiki/Files-&-Ignores): "If there is a .gitignore file, and .npmignore is missing, .gitignore's contents will be used instead." But "if there is a files list in package.json, then only the files specified will be included." The `files` array wins over ignore files, but only when everything aligns correctly.

**Consequences:**
- Publishing before building ships an empty or stale `bin/` directory
- Adding `.npmignore` later could accidentally break the package
- Contributors may be confused why gitignored files end up in the npm package

**Prevention:**
1. Add a `prepublishOnly` script that runs the build: `"prepublishOnly": "bun run build"`. This ensures the build always runs before publish.
2. Never create a `.npmignore` file. The `files` array is the correct whitelist approach for this project.
3. Document in the README/CONTRIBUTING.md that `bin/` is gitignored but npm-published (build artifact pattern).

**Detection:**
`npm pack --dry-run` shows whether `bin/megazord.mjs` and all chunk files are present and non-empty.

**Phase to address:** Phase 1 (Package Configuration).

**Confidence:** HIGH -- verified against [npm Files & Ignores documentation](https://github.com/npm/cli/wiki/Files-&-Ignores) and current project state.

---

### Pitfall 3: Package Name "megazord" Is Already Taken on npm

**What goes wrong:**
The name `"megazord"` in `package.json` is already registered on npm (published as `megazord@0.0.0` by `rodrigogs`). Attempting `npm publish` will fail with a 403 error: "You do not have permission to publish 'megazord'."

**Why it happens:**
npm package names are first-come-first-served. Even squatted/placeholder packages (0.0.0 with no real code) block the name permanently unless the npm dispute process succeeds, which is slow and not guaranteed.

**Consequences:**
- First publish attempt fails, blocking the entire release
- Delays while deciding on an alternative name
- If the name is changed after any users have started using it, migration is painful

**Prevention:**
Choose a name strategy NOW, before any publish:
1. **Scoped package** (recommended): `@megazord/cli` or `@your-username/megazord`. Scoped packages have guaranteed namespace under your npm org/user. Requires `npm publish --access public` for public scoped packages.
2. **Alternative unscoped name**: `megazord-cli`, `megazord-cc`, `megazord-framework`. Check availability with `npm view <name>` before committing.
3. **Dispute process**: Contact npm support to claim the squatted `megazord` name. This is unreliable and slow (weeks to months). Not recommended as the primary strategy.

**Detection:**
Run `npm view megazord` -- it returns package info confirming the name is taken.

**Phase to address:** Phase 1 (Package Configuration). Name must be decided before first publish because npm does not allow renaming after publish.

**Confidence:** HIGH -- directly verified via `npm view megazord` returning `megazord@0.0.0`.

---

### Pitfall 4: Shebang and Runtime Compatibility for npm Users

**What goes wrong:**
The `bin/megazord.mjs` entry point uses `#!/usr/bin/env node` (added by tsdown via banner config). This works when users have Node.js installed. However, there is a subtle trap: if the package is built with bun-specific APIs or syntax that Node.js does not support, the CLI will crash on `node` even though it parses fine. The dependencies (commander, zod, picocolors, ora, fs-extra, gray-matter) are all Node-compatible, but any future use of Bun-specific APIs (like `Bun.file()`, `Bun.spawn()`, `Bun.serve()`) would silently break Node.js compatibility.

**Why it happens:**
Development and testing happen with bun, but the published package runs with whatever runtime the user has. There is no CI matrix testing Node.js compatibility. The `engines` field says `"node": ">=22"` but there is no bun engine specification or runtime detection.

**Consequences:**
- Users who install via `npm install -g megazord` and run with Node.js get cryptic errors if any Bun-specific API is used
- The shebang `#!/usr/bin/env node` will fail for users without Node.js who only have bun (rare but possible)
- No way to detect or report the issue clearly

**Prevention:**
1. Keep the shebang as `#!/usr/bin/env node` -- Node.js has far wider install base than bun for global CLI tools.
2. Add a CI test that runs the built `bin/megazord.mjs` with Node.js (not just bun) to catch Bun-specific API usage.
3. If bun-specific APIs are ever needed, use runtime detection: `typeof Bun !== 'undefined'` with Node.js fallbacks.
4. Document both `bun install -g` and `npm install -g` as supported install methods.

**Detection:**
CI test: `node bin/megazord.mjs --version` should succeed. If it does not, a Bun-specific API has leaked into the build.

**Phase to address:** Phase 2 (CI/CD Pipeline). Runtime compatibility testing must be part of the CI matrix.

**Confidence:** HIGH -- verified the tsdown config adds `#!/usr/bin/env node` banner and that all current dependencies are Node-compatible.

---

### Pitfall 5: GitHub Actions npm Publish Without Proper Token or Provenance Setup

**What goes wrong:**
The most common CI/CD publish failures:
1. **Missing or expired NPM_TOKEN**: The workflow references `secrets.NPM_TOKEN` but the secret was never created, or the token expired (npm now enforces 90-day max lifetime as of October 2025).
2. **Provenance without `id-token: write`**: Publishing with `--provenance` flag (recommended for trust) requires `permissions: id-token: write` in the workflow. Without it, publish fails with a cryptic OIDC error.
3. **Trusted Publishing misconfiguration**: npm Trusted Publishing (OIDC-based, token-free) requires npm CLI 11.5.1+ and Node 22.14.0+. Using an older `setup-node` version silently falls back to no auth.
4. **Missing `registry-url` in setup-node**: Even though npmjs.com is the default, `setup-node` needs `registry-url: 'https://registry.npmjs.org'` explicitly set to write the `.npmrc` file that enables authentication.

**Why it happens:**
npm's authentication landscape changed significantly in 2025-2026 with Trusted Publishing and granular tokens. Tutorials from 2023-2024 show patterns that no longer work. The token lifetime limits (90-day max enforced October 2025, classic tokens revoked November 2025) break workflows that were set-and-forget.

**Consequences:**
- Publish fails in CI after everything else passes, blocking the release
- Expired tokens discovered only when you try to publish (not during regular CI runs)
- Provenance errors are cryptic and poorly documented

**Prevention:**
Two approaches, pick one:

**Option A: Trusted Publishing (recommended)**
```yaml
permissions:
  contents: read
  id-token: write

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: '22'
      registry-url: 'https://registry.npmjs.org'
  - run: npm publish --provenance --access public
```
Configure the trusted publisher on npmjs.com under package settings. No NPM_TOKEN secret needed. Provenance is automatic.

**Option B: Granular Token**
Create an automation token on npmjs.com, store as `NPM_TOKEN` repository secret, set a calendar reminder for rotation before expiry.
```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: '22'
      registry-url: 'https://registry.npmjs.org'
  - run: npm publish --access public
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Detection:**
- Test the workflow with `npm publish --dry-run` in CI before the actual publish step
- Add a step that checks token validity: `npm whoami` should return your username

**Phase to address:** Phase 2 (CI/CD Pipeline).

**Confidence:** HIGH -- verified against [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) and [GitHub Actions npm publish docs](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages).

---

### Pitfall 6: Pre-release Versions Tagged as "latest" on npm

**What goes wrong:**
Running `npm publish` without `--tag` always updates the `latest` dist-tag, even for pre-release versions like `0.1.0-beta.1`. Any user running `npm install megazord` (or whatever the final name is) will get the pre-release instead of the last stable version. This is a [known npm bug/behavior](https://github.com/npm/cli/issues/7553) that has persisted for years.

**Why it happens:**
npm defaults to the `latest` tag for all publishes. There is no automatic detection of semver pre-release identifiers. The developer must explicitly pass `--tag next` (or `--tag beta`, etc.) for every pre-release publish.

**Consequences:**
- Users unknowingly install unstable code
- Breaking the `latest` tag requires manual `npm dist-tag` commands to fix
- Erodes trust in the package's stability

**Prevention:**
1. For pre-release publishes, always use: `npm publish --tag next`
2. Automate this in CI: detect pre-release versions in `package.json` and add the `--tag` flag automatically.
3. Consider using a release tool like `changeset` or `semantic-release` that handles tag management correctly.
4. Add a CI guard: `if [[ $(node -p "require('./package.json').version") == *"-"* ]]; then TAG="--tag next"; fi`

**Detection:**
After every publish, verify: `npm dist-tag ls <package-name>` should show `latest` pointing to a stable version, not a pre-release.

**Phase to address:** Phase 2 (CI/CD Pipeline).

**Confidence:** HIGH -- this is a well-documented and frequently reported issue.

---

## Moderate Pitfalls

Mistakes that cause friction, delays, or rework but not catastrophic failures.

---

### Pitfall 7: Plugin Manifest Mismatch Between npm Package and Claude Code Plugin

**What goes wrong:**
The project has TWO identity manifests:
1. `package.json` with `"name": "megazord"` -- npm identity
2. `.claude-plugin/plugin.json` with `"name": "mz"` -- Claude Code plugin identity

These serve different purposes, but the version numbers must stay synchronized. If `package.json` says `1.2.0` and `plugin.json` says `0.1.0`, users will see conflicting version info depending on where they look. More critically, the plugin name `"mz"` determines the slash command namespace (`/mz:init`, `/mz:plan`, etc.), and this name must be stable -- changing it breaks all user muscle memory and documentation.

**Why it happens:**
The two manifest files are maintained independently with no automated synchronization.

**Prevention:**
1. Add a `prebuild` or `prepublishOnly` script that copies the version from `package.json` into `plugin.json`.
2. Add a CI check that verifies version parity between the two files.
3. Decide the plugin name (`mz`) once and document that it must never change. The npm package name can differ from the plugin name -- this is fine and expected.

**Detection:**
CI step: `diff <(jq .version package.json) <(jq .version .claude-plugin/plugin.json)` should produce no output.

**Phase to address:** Phase 1 (Package Configuration).

**Confidence:** HIGH -- directly observed the version mismatch (both say `0.1.0` now, but no automation ensures this stays true).

---

### Pitfall 8: `.planning/` and Internal Files Leaking into npm Package

**What goes wrong:**
The `.planning/` directory contains research files, roadmaps, milestones, and internal state that should never be published to npm. Similarly, `.megazord-marketplace/`, `.DS_Store`, `superpowers-vs-gsd-analysis.md`, and other development artifacts should not be in the tarball. Because the `files` array is a whitelist, these files are currently excluded. But if someone mistakenly adds a catch-all or removes the `files` array, all 176+ files get published.

**Why it happens:**
The `files` array is the ONLY protection against leaking internal files. There is no `.npmignore` as a safety net.

**Prevention:**
1. Keep the `files` array as the primary mechanism -- it is the correct approach.
2. Add a CI step that runs `npm pack --dry-run` and fails if the tarball exceeds a size threshold (e.g., 500KB) or contains known-bad patterns (`.planning`, `.megazord-marketplace`, `.DS_Store`).
3. Consider adding a minimal `.npmignore` as defense-in-depth:
   ```
   .planning/
   .megazord-marketplace/
   .DS_Store
   *.md
   !README.md
   !LICENSE.md
   ```
   Note: `.npmignore` replaces `.gitignore`, so be careful. The `files` array approach is cleaner.

**Detection:**
`npm pack --dry-run 2>&1 | grep -E '\.planning|\.megazord|\.DS_Store'` should produce no output.

**Phase to address:** Phase 1 (Package Configuration) for the `files` array review. Phase 2 (CI/CD) for the automated guard.

**Confidence:** HIGH -- verified the current `files` array correctly excludes these, but there is no automated guard.

---

### Pitfall 9: Plugin Files Reference Paths Outside the Plugin Directory

**What goes wrong:**
When Claude Code installs a plugin, it copies the plugin directory to `~/.claude/plugins/cache`. Any paths that reference files outside the plugin root (e.g., `../shared-utils` or absolute paths like `/Users/sh3rd3n/...`) will break after installation because those files are not copied. The [official docs explicitly warn](https://code.claude.com/docs/en/plugin-marketplaces): "plugins can't reference files outside their directory using paths like `../shared-utils`, because those files won't be copied."

**Why it happens:**
Development uses `--plugin-dir ./` which loads from the source directory directly, where all paths work. The copy-to-cache behavior only happens during actual plugin installation, so path issues are invisible during development.

**Consequences:**
- Hooks, scripts, or MCP configurations that reference external files fail silently after install
- Works in development but breaks in production -- the worst kind of bug

**Prevention:**
1. Always use `${CLAUDE_PLUGIN_ROOT}` for internal references (the current hooks.json already does this correctly).
2. Never use relative paths with `..` in any plugin configuration.
3. Test the full install flow: `claude plugin install` from the marketplace, not just `--plugin-dir`.
4. All referenced files must be within the plugin directory tree and included in the `files` array.

**Detection:**
`grep -r '\.\.\/' hooks/ scripts/ .claude-plugin/` should return no results (no parent directory references).

**Phase to address:** Phase 3 (Marketplace Submission). Test the full install/cache flow.

**Confidence:** HIGH -- verified against official Claude Code plugin documentation.

---

### Pitfall 10: Version Bump and Git Tag Desynchronization

**What goes wrong:**
The `package.json` version, git tag, and npm registry version get out of sync. Common scenarios:
1. Bump version in `package.json`, push, but forget to create a git tag
2. Create a git tag but forget to bump `package.json`
3. CI publishes successfully but the git tag push fails (or vice versa)
4. Manual publish from local machine skips CI entirely, creating versions with no corresponding git tag

**Why it happens:**
Version management is a multi-step process (edit JSON, git commit, git tag, npm publish) with no atomic operation. Each step can fail independently.

**Prevention:**
1. Use `npm version patch/minor/major` which atomically updates `package.json`, creates a git commit, and creates a git tag.
2. Set up CI to publish ONLY on git tag push (`on: push: tags: 'v*'`). This ensures every publish has a corresponding tag.
3. Never publish manually from a local machine. All publishes go through CI.
4. Add a CI check: the version in `package.json` must match the git tag that triggered the workflow.

**Detection:**
```bash
# In CI:
PKG_VERSION=$(node -p "require('./package.json').version")
TAG_VERSION=${GITHUB_REF#refs/tags/v}
if [ "$PKG_VERSION" != "$TAG_VERSION" ]; then
  echo "Version mismatch: package.json=$PKG_VERSION tag=$TAG_VERSION"
  exit 1
fi
```

**Phase to address:** Phase 2 (CI/CD Pipeline).

**Confidence:** HIGH -- extremely common and well-documented issue.

---

### Pitfall 11: Scoped Package Requires `--access public` Flag

**What goes wrong:**
If the package is published under a scope (e.g., `@megazord/cli`), `npm publish` defaults to `--access restricted` (private). The publish succeeds but the package is invisible to everyone except the org members. Users cannot install it.

**Why it happens:**
npm scoped packages default to private access because scoped packages were originally designed for organization use. This default has tripped up countless first-time publishers.

**Consequences:**
- Package publishes successfully (no error) but is invisible to the public
- Users report "404 Not Found" when trying to install
- Confusing because `npm view` works for the publisher but not for anyone else

**Prevention:**
Always include `--access public` when publishing scoped packages:
```bash
npm publish --access public
```
Or set it permanently in `package.json`:
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

**Detection:**
After publish: `npm view @scope/package-name` from a different machine/user. Or check on npmjs.com that the package page is publicly visible.

**Phase to address:** Phase 1 (Package Configuration) -- add `publishConfig` to `package.json`.

**Confidence:** HIGH -- this is one of the most FAQ'd npm issues for scoped packages.

---

## Minor Pitfalls

---

### Pitfall 12: README Not Included or Poorly Formatted on npmjs.com

**What goes wrong:**
npm uses the README.md from the package tarball for the package page on npmjs.com. If there is no README.md (currently Megazord has no README.md in the repo root), the npm page will be blank, which devastates discoverability and trust. Even with a README, common formatting issues include broken relative links (images, other docs), badges pointing to wrong URLs, and missing installation instructions.

**Why it happens:**
README.md is auto-included by npm regardless of the `files` array, but it must exist. Relative links that work on GitHub (like `./docs/guide.md`) break on npmjs.com because npm does not host those files.

**Prevention:**
1. Create a `README.md` at the project root with at minimum: package name, one-line description, installation command, basic usage example, and license.
2. Use absolute URLs for any images or links.
3. Include badges: npm version, CI status, license.
4. Keep the README focused on "how to install and use" -- developers decide in 30 seconds.
5. Test rendering: `npm pack`, extract the tarball, and preview the README.

**Phase to address:** Phase 1 (Package Configuration).

**Confidence:** HIGH.

---

### Pitfall 13: `postbuild` Script Runs `megazord update --yes` During npm Install

**What goes wrong:**
The `package.json` has a `postbuild` script: `"postbuild": "node bin/megazord.mjs update --yes"`. This runs automatically after `bun run build`. If a consumer of the package somehow triggers a build (e.g., via `prepare` script), this would try to run the `megazord` CLI as part of the build, which may fail on their machine because the CLI context (plugin directories, etc.) does not exist.

**Why it happens:**
npm lifecycle scripts (`prebuild`, `postbuild`, `prepare`, `postinstall`) run automatically in specific contexts. The `postbuild` hook is intended for the developer's local workflow but could be triggered during `npm install` if a `prepare` script is added later.

**Prevention:**
1. The current setup is safe because `postbuild` only runs when `build` is explicitly called, not during `npm install`.
2. Do NOT add a `prepare` script that calls `build` -- this would trigger `postbuild` for every installer.
3. If a build step is needed for consumers, use `prepublishOnly` (runs only on `npm publish`, not on `npm install`).
4. Consider renaming to a custom script name (e.g., `"sync": "node bin/megazord.mjs update --yes"`) to avoid lifecycle hook confusion.

**Phase to address:** Phase 1 (Package Configuration) -- review and document lifecycle script intent.

**Confidence:** MEDIUM -- the current setup is safe, but the pattern is fragile.

---

### Pitfall 14: Marketplace Submission Rejection Due to Quality/Security Review

**What goes wrong:**
Anthropic's official plugin directory (`anthropics/claude-plugins-official`) requires quality and security review. Plugins can be rejected for:
1. Missing or incomplete `plugin.json` manifest
2. Hooks executing external commands without clear purpose
3. Missing README or documentation
4. MCP server configurations that could be security risks
5. Plugin name conflicts with existing plugins

**Why it happens:**
The Claude Code plugin ecosystem is relatively new (2025-2026), and review criteria are not fully documented. Anthropic states: "External plugins must meet quality and security standards for approval" but does not publish a detailed checklist. The "Anthropic Verified" badge requires additional review beyond basic admission.

**Prevention:**
1. Ensure `plugin.json` has all fields: `name`, `description`, `version`, `author`, `homepage`, `repository`, `license`, `keywords`.
2. Document every hook's purpose in the README. The `enforce-ownership.sh` hook runs on PreToolUse for Edit/Write -- explain why this exists and what it does.
3. Avoid `postinstall` scripts or any code that runs on install without user consent.
4. Self-host a marketplace first (GitHub repo with `marketplace.json`) for immediate distribution while waiting for official directory approval.
5. Use `claude plugin validate .` to catch structural issues before submission.

**Detection:**
Run `claude plugin validate .` and fix all warnings/errors before submitting.

**Phase to address:** Phase 3 (Marketplace Submission).

**Confidence:** MEDIUM -- review criteria are partially documented. The exact rejection reasons are not publicly listed.

---

### Pitfall 15: npm 2FA/OTP Required for First Publish

**What goes wrong:**
npm accounts with 2FA enabled (which is increasingly mandatory) require an OTP (one-time password) for the first publish of a new package. In CI, this means the automated publish fails because there is no way to provide an OTP interactively. The alternative is to use an automation token, but automation tokens still require the initial package to be created manually (or via Trusted Publishing).

**Why it happens:**
npm's security model requires human verification for new package creation. Automation tokens bypass 2FA for subsequent publishes but not always for the first one.

**Prevention:**
1. **Recommended**: Use npm Trusted Publishing (OIDC). This bypasses 2FA/OTP entirely because authentication is machine-to-machine.
2. **Alternative**: Publish the first version manually from your local machine (`npm publish --access public`), then set up CI for all subsequent versions.
3. Create an automation token with publish permissions, which can bypass 2FA for automation workflows.

**Phase to address:** Phase 2 (CI/CD Pipeline) -- decide auth strategy before first publish.

**Confidence:** HIGH -- well-documented npm security requirement.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Package Configuration | Package name taken (Pitfall 3) | Decide scoped name immediately; check with `npm view` |
| Package Configuration | `scripts/` not in files array (Pitfall 1) | Add to files array, verify with `npm pack --dry-run` |
| Package Configuration | No README.md (Pitfall 12) | Create before first publish |
| Package Configuration | Version mismatch between manifests (Pitfall 7) | Automate sync in prepublishOnly |
| CI/CD Pipeline | Token/provenance misconfiguration (Pitfall 5) | Use Trusted Publishing, test with `--dry-run` |
| CI/CD Pipeline | Pre-release tagged as latest (Pitfall 6) | Auto-detect semver pre-release, add `--tag next` |
| CI/CD Pipeline | Version/tag desync (Pitfall 10) | Publish on tag push, verify version matches |
| CI/CD Pipeline | Runtime compatibility (Pitfall 4) | Test with both Node.js and bun in CI matrix |
| Marketplace Submission | Plugin path issues after install (Pitfall 9) | Test full install flow, not just `--plugin-dir` |
| Marketplace Submission | Rejection for quality gaps (Pitfall 14) | Run `claude plugin validate`, document hooks |
| Marketplace Submission | Scoped package visibility (Pitfall 11) | Set `publishConfig.access: "public"` |

---

## Pre-Publish Checklist

Before the first `npm publish`, verify all of these:

- [ ] Package name is available on npm (or scoped name chosen)
- [ ] `files` array includes ALL directories needed at runtime: `bin`, `dist`, `skills`, `agents`, `hooks`, `commands`, `.claude-plugin`, `scripts`
- [ ] `npm pack --dry-run` shows exactly the files expected, nothing more, nothing less
- [ ] `prepublishOnly` script runs the build
- [ ] `publishConfig.access` set to `"public"` (if scoped)
- [ ] `README.md` exists at project root with installation/usage instructions
- [ ] `plugin.json` version matches `package.json` version
- [ ] Shebang is `#!/usr/bin/env node` (not `#!/usr/bin/env bun`)
- [ ] Built CLI works with Node.js: `node bin/megazord.mjs --version`
- [ ] No references to paths outside the plugin directory in any config
- [ ] npm account has 2FA set up and auth strategy decided (Trusted Publishing or token)
- [ ] Git tag matches package.json version

---

## Sources

### npm Publishing
- [npm Files & Ignores (official wiki)](https://github.com/npm/cli/wiki/Files-&-Ignores)
- [npm Publishing what you mean to publish (blog)](https://blog.npmjs.org/post/165769683050/publishing-what-you-mean-to-publish.html)
- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/)
- [npm Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/)
- [npm Pre-release versions tagged as latest (issue #7553)](https://github.com/npm/cli/issues/7553)
- [npm publish does not check if bin files exist (issue #18554)](https://github.com/npm/npm/issues/18554)
- [For the love of god, don't use .npmignore](https://medium.com/@jdxcode/for-the-love-of-god-dont-use-npmignore-f93c08909d8d)
- [Creating NPX compatible CLI tools with Bun](https://runspired.com/2025/01/25/npx-executables-with-bun.html)
- [Bootstrapping NPM Provenance with GitHub Actions](https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html)
- [Things you need to do for npm trusted publishing to work](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/)

### GitHub Actions CI/CD
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [Automatic npm publishing with GitHub Actions & granular tokens](https://httptoolkit.com/blog/automatic-npm-publish-gha/)

### Claude Code Plugin Ecosystem
- [Claude Code: Create plugins (official docs)](https://code.claude.com/docs/en/plugins)
- [Claude Code: Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [anthropics/claude-plugins-official (GitHub)](https://github.com/anthropics/claude-plugins-official)
- [Cline security advisory: unauthorized npm publish with malicious postinstall](https://github.com/cline/cline/security/advisories/GHSA-9ppg-jx86-fqw7)

### Scoped Packages & Naming
- [npm: About scopes](https://docs.npmjs.com/about-scopes/)
- [npm: Creating and publishing unscoped public packages](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/)
