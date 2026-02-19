# Project Research Summary

**Project:** Megazord — Distribution & Publication (v1.1 milestone)
**Domain:** npm package publishing, Claude Code plugin marketplace, GitHub Actions CI/CD
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

Megazord is a finished Claude Code plugin framework that needs a distribution layer, not more features. The goal of this milestone is to make the existing v1.0 codebase installable by anyone via two paths: npm (`bunx megazord install`) and the Claude Code native marketplace (`/plugin install mz@marketplace`). All four research areas converge on the same conclusion: the work is well-understood, the tooling is mature, and the risks are concrete and avoidable — not abstract.

The recommended approach is a four-phase sequence: (1) foundation work — fix known package.json gaps, create LICENSE and README, resolve the package name conflict before any publish; (2) CI pipeline — two GitHub Actions workflows (CI on PRs, publish on version tags) using bun for build/test and npm for the publish step only, because `bun publish` lacks OIDC/provenance support; (3) npm publication — using npm Trusted Publishing or granular tokens with provenance attestation; (4) marketplace — a separate GitHub repo as the self-hosted marketplace, followed by optional submission to the official Anthropic directory. Phase 4 Track B (official directory) should trail Phase 3 by enough time to confirm npm stability before seeking official listing.

The single most consequential risk is the package name: `megazord` on npm is already registered by another user (`rodrigogs`, v0.0.0 squatter). This blocks all publishing under the current `package.json` name and must be resolved in Phase 1 before any other publish work starts. Secondary risks include `scripts/` missing from the `files` array (hooks will silently fail post-install) and the `bun publish` limitation in CI (use `npm publish` for that step only). Both are straightforward to fix once identified.

---

## Key Findings

### Recommended Stack

Distribution infrastructure requires no new runtime dependencies. The additions are pure CI/CD configuration: two GitHub Actions workflow files, minor `package.json` field additions, and a separate marketplace repository.

**Core technologies:**

- **GitHub Actions** — CI/CD pipeline; free for public repos, native npm token support, already hosting the repo
- **`oven-sh/setup-bun@v2`** — official Bun action for install/build/test steps in CI; auto-detects bun version from package.json
- **`actions/setup-node@v4`** — provides `npm` CLI for the publish step only; required because `bun publish` lacks OIDC and `--provenance` support (bun open issues #22423, #15601)
- **`npm publish --provenance`** — the actual publish command; adds cryptographic attestation showing the package was built from the repo in GitHub Actions
- **npm granular access token or OIDC Trusted Publishing** — authentication for CI publish; classic npm tokens were permanently revoked November 2025; 90-day max on granular tokens; OIDC preferred for zero-secret management
- **GitHub-hosted marketplace repo (`sh3rd3n/megazord-marketplace`)** — the distribution vehicle for the Claude Code native install path; the existing `.megazord-marketplace/` subdirectory in the main repo cannot serve this role because `/plugin marketplace add` requires the manifest at a repository root

**What NOT to add:** semantic-release, changesets, release-please, Homebrew tap, GitHub Packages, `.npmignore`, `npm` source type in marketplace.json (warned as not fully implemented in Claude Code validation). See STACK.md for full rationale on each exclusion.

### Expected Features

The feature surface for this milestone is documentation and automation, not code. All functional features already ship in v1.0.

**Must have (table stakes):**

- **LICENSE file** — MIT is declared in package.json but the actual file is missing from the repo; npm warns about this; companies check before installing
- **README.md** — nothing exists at the repo root; npm page will be blank without it; include hero description, one-liner install, feature list, command reference
- **Working npm publication** — `bunx megazord` must resolve correctly on a clean machine; requires resolving the package name conflict first
- **Correct package.json metadata** — `repository`, `homepage`, `bugs`, `publishConfig`, `keywords`, and `scripts/` in files array all need updating
- **GitHub repository** — code must be publicly accessible before any other step; everything else depends on this
- **CHANGELOG.md** — required trust signal; start with a v1.0.0 manual entry documenting initial release features

**Should have (competitive):**

- **GitHub Actions CI/CD pipeline** — automated quality gates signal project maturity; prevents broken releases
- **npm provenance attestation** — "Built and signed on GitHub Actions" badge on npmjs.com; costs nothing extra with setup-node
- **Shields.io badges in README** — visual trust signals; add after CI and npm are live
- **Demo GIF in README** — repos with GIFs get 42% more stars; record a 15-20 second workflow showing init -> plan -> go -> verify
- **Claude Code marketplace listing** — Superpowers is the only major framework in the official Anthropic directory; getting Megazord listed is a significant competitive advantage; submit via `clau.de/plugin-directory-submission`
- **CONTRIBUTING.md** — signals the project welcomes contributions; document dev setup, test, PR process

**Defer (v2+):**

- Documentation website — write an excellent README first; docs site earns its complexity only after the README exceeds ~500 lines
- Logo and brand identity — a procrastination trap; tackle after traction exists
- GitHub Discussions / Discord — community infrastructure before community exists is empty and discouraging; use GitHub Issues until issue volume justifies it
- Homebrew tap — every target user already has npm/bun; zero new reach

### Architecture Approach

Three distribution channels share a single source of truth (the GitHub repository) and all terminate at the same destination (`~/.claude/plugins/cache/`). The channels are: (1) npm install path via `bunx megazord install`; (2) Claude Code native path via `/plugin install mz@megazord-marketplace`; (3) direct git clone for contributors. All three are managed from the same repo with no separate build infrastructure.

**Major components:**

1. **GitHub Repo (`sh3rd3n/megazord`)** — source of truth for all code, issues, PRs, and CI triggers
2. **GitHub Actions CI (`.github/workflows/ci.yml`)** — typecheck + lint + test + build on every PR and push to main; no secrets needed
3. **GitHub Actions Publish (`.github/workflows/publish.yml`)** — build + `npm publish --provenance` on version tag push; uses setup-node for the npm step only; bun handles everything else
4. **npm Package (scoped or alternative name)** — distributes CLI + plugin files; `prepublishOnly` ensures build always runs before publish; `files` array is the whitelist
5. **Marketplace Repo (`sh3rd3n/megazord-marketplace`)** — separate GitHub repository with `.claude-plugin/marketplace.json` at root; uses GitHub source type pointing back to the main repo; npm source type is not used (marked "not yet fully implemented" by Claude Code validation)
6. **Version Sync** — `package.json` is single source of truth; `plugin.json` bumped in same release commit; `install.ts` and `update.ts` must be patched to read version dynamically instead of hardcoded `"0.1.0"`

Key architectural constraint: the marketplace repo MUST be a separate repository. The existing `.megazord-marketplace/` directory in the main repo works for local development but cannot serve public `/plugin marketplace add` users because Claude Code expects `.claude-plugin/marketplace.json` at the repository root.

### Critical Pitfalls

1. **Package name `megazord` is already taken on npm** — `npm view megazord` returns `megazord@0.0.0` by `rodrigogs`. Decide on scoped name (`@sh3rd3n/megazord`) or alternative unscoped name (`megazord-cli`, `megazord-cc`) before any publish attempt. This is a Phase 1 blocker — npm does not allow renaming after publish.

2. **`scripts/` directory missing from `files` array** — `hooks/hooks.json` references `${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh` but `scripts/` is not listed in the `files` array. Hooks will silently fail after npm install. Fix: add `"scripts"` to the files array and verify with `npm pack --dry-run`.

3. **`bun publish` lacks OIDC/provenance support** — verified against open issues #22423 and #15601. The CI publish step must use `npm publish` via `actions/setup-node`. This is a deliberate CI-only exception, not a violation of the "always use bun" rule.

4. **GitHub Actions auth misconfiguration** — npm's classic tokens were permanently revoked November 2025; granular tokens have a 90-day hard cap; missing `id-token: write` permission breaks provenance silently; missing `registry-url` in setup-node breaks authentication silently. Use OIDC Trusted Publishing for zero-secret management, or granular tokens with a calendar rotation reminder. Note: first publish of a new package may require a manual step due to npm 2FA.

5. **Hardcoded version `"0.1.0"` in `install.ts` and `update.ts`** — both files have `const VERSION = "0.1.0"` that will diverge from `package.json` on the first version bump. Fix both to read version from package.json dynamically before cutting any release.

---

## Implications for Roadmap

Based on research, the dependency graph is clear. Every subsequent phase depends on Phase 1. Phase 4 Track A (self-hosted marketplace) can run in parallel with Phase 3 but Track B (official directory) benefits from npm being live and stable first.

### Phase 1: Foundation — Package Configuration and Repository

**Rationale:** The entire distribution effort depends on a public GitHub repo with correct metadata and a resolvable package name. The package name conflict is a pre-condition for everything in Phase 3. This phase has no external dependencies and unblocks everything else.

**Delivers:** Public GitHub repo, MIT LICENSE file, correct `package.json` (repository, homepage, bugs, publishConfig, keywords, `scripts/` in files array), version sync automation (install.ts and update.ts read version dynamically), initial README v1, CHANGELOG v1.0.0.

**Addresses:** Table-stakes features (GitHub repo, LICENSE, README, npm metadata); pitfalls 1 (name conflict), 2 (scripts/ missing), 7 (manifest version sync), 8 (internal files not leaking)

**Key decision to make now:** Package name strategy — scoped (`@sh3rd3n/megazord`) guarantees no conflict; alternative unscoped names need availability checks via `npm view`. Also decide whether to keep `.megazord-marketplace/` in main repo or remove it to reduce confusion now that it will be a separate repo.

**Avoids:** Blocked first publish (name taken), silent hook failures post-install, version drift on first release.

### Phase 2: CI Pipeline — Quality Gates

**Rationale:** A safety net must exist before publishing anything to npm. Once a version is published, it cannot be unpublished (only deprecated). CI catches broken builds before they reach users. This phase is fast (two YAML files) and enables the badge work that makes the README look maintained.

**Delivers:** `.github/workflows/ci.yml` (typecheck + lint + test + build on PRs and pushes to main), `.github/workflows/publish.yml` (build + npm publish on version tag), CI status badge for README, Node.js runtime compatibility test (`node bin/megazord.mjs --version` in CI matrix).

**Uses:** `oven-sh/setup-bun@v2`, `actions/checkout@v4`, `actions/setup-node@v4`; bun for install/build/test; `npm publish --provenance` for the release step only.

**Avoids:** Broken releases shipped to users (pitfall 5 — full quality gate before publish), pre-release versions tagged as latest (pitfall 6 — detect semver pre-release, add `--tag next`), version/tag desync (pitfall 10 — publish on tag push, verify version matches), Node.js runtime incompatibility (pitfall 4 — test with Node.js in CI).

**Auth decision to make:** OIDC Trusted Publishing preferred (zero secrets to rotate); granular token is a viable fallback. First publish may require a manual local `npm publish --access public` due to npm 2FA, then CI handles all subsequent versions.

### Phase 3: npm Publication — Primary Distribution Channel

**Rationale:** npm is the primary install path for users who discover Megazord outside of Claude Code. Getting the package live on the registry with provenance, correct metadata, and a tested install flow validates the entire distribution architecture. Marketplace listing in Phase 4 benefits from npm being functional but does not strictly require it.

**Delivers:** npm package live at registry with provenance attestation, tested `bunx megazord install` on a clean machine, shields.io badges added to README (npm version, CI status, license), CONTRIBUTING.md.

**Addresses:** Working npm publication (table stakes), npm provenance attestation (differentiator), badges (trust signal).

**Test gate before shipping:** `npm pack --dry-run` must show `scripts/enforce-ownership.sh`, `bin/megazord.mjs`, and all plugin directories. Must NOT show `.planning/`, `.megazord-marketplace/`, or `.DS_Store`. `node bin/megazord.mjs --version` must succeed. `npm whoami` must return the correct username.

**Avoids:** Scoped package invisible to public (pitfall 11 — set `publishConfig.access: "public"`), build artifacts missing from tarball (prepublishOnly ensures fresh build), internal files leaking (files array whitelist is the only protection).

### Phase 4: Marketplace — Native Claude Code Discovery

**Rationale:** This is the competitive differentiator. Superpowers is the only major framework in the official Anthropic directory. Native Claude Code discovery puts Megazord in front of the exact target audience without requiring them to know about npm. The two sub-tracks have different timelines and risk profiles.

**Track A (immediate, can run parallel with Phase 3):** Create `sh3rd3n/megazord-marketplace` as a separate GitHub repo, add `.claude-plugin/marketplace.json` with GitHub source type pointing to the main repo, test full `/plugin marketplace add` + `/plugin install mz` flow. Use `ref: "main"` initially; switch to pinned tags for stability once the release flow is established.

**Track B (after A is stable):** Submit to Anthropic official directory via `clau.de/plugin-directory-submission`. Required fields: plugin name, 50-100 word description, 3+ use case examples, org URL, contact email. Submit only after everything else is working. Resubmission required for every update — submit when the project is stable, not during rapid iteration.

**Delivers:** `sh3rd3n/megazord-marketplace` GitHub repo with tested marketplace.json, working `/plugin install mz@megazord-marketplace` flow, optional Anthropic official directory listing, demo GIF in README.

**Avoids:** Plugin path breakage after cache copy (pitfall 9 — use `${CLAUDE_PLUGIN_ROOT}`, never `../`), marketplace submission rejection (pitfall 14 — run `claude plugin validate .` first, document all hooks and their purpose in README).

**Note on npm source type:** Do NOT use `"source": { "source": "npm", "package": "..." }` in marketplace.json. Claude Code warns this is "not yet fully implemented." Use GitHub source type exclusively.

### Phase Ordering Rationale

- Phase 1 before everything: the package name decision and public GitHub repo are pre-conditions for all CI, npm, and marketplace work. Cannot build on air.
- Phase 2 before Phase 3: publishing broken code is worse than not publishing. Once a version is on npm it cannot be deleted — only deprecated. CI is the safety net.
- Phase 3 before Phase 4 Track B: the official Anthropic directory submission requires a working, polished, stable project. Submit after everything is battle-tested.
- Phase 4 Track A can overlap with Phase 2 and 3: the self-hosted marketplace uses GitHub source and has no dependency on npm being live.

### Research Flags

Phases with well-documented patterns (can proceed without additional research):
- **Phase 2 (CI):** GitHub Actions + bun + npm publish is a thoroughly documented pattern. The exact YAML is provided in both STACK.md and ARCHITECTURE.md.
- **Phase 3 (npm publication):** Standard npm publish process. The only novel element is OIDC Trusted Publishing setup, which is documented step-by-step in PITFALLS.distribution.md pitfall 5.

Phases that need validation during execution:
- **Phase 1 (package name):** The specific alternative name chosen needs an `npm view` availability check before committing to it in package.json and all documentation. Check before writing.
- **Phase 4 Track B (official directory submission):** Review criteria and timeline are not fully documented. Plan for possible rejection or delay — self-hosted marketplace (Track A) is the guaranteed path and should ship first.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All source materials are official docs (Anthropic, npm, GitHub, bun). The bun publish limitation is verified against open issue trackers with specific issue numbers. No guesswork. |
| Features | HIGH | Feature list derived from official Anthropic marketplace docs and direct analysis of the claude-plugins-official repo. Competitor distribution analysis is MEDIUM confidence but only informs the optional differentiator features. |
| Architecture | HIGH | Distribution architecture follows documented Claude Code plugin patterns exactly. Component boundaries and data flow match official plugin caching documentation. The separate marketplace repo requirement is verified against how `/plugin marketplace add` works. |
| Pitfalls | HIGH | Every critical pitfall was verified directly: package name conflict via `npm view megazord`, files array gap by reading current package.json, bun publish limitation via open issues, hooks path issues against official Claude Code docs. Not inferred — observed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Package name final decision:** Research confirmed `megazord` is taken but the specific alternative must be decided before Phase 1 work begins. Options: `@sh3rd3n/megazord` (scoped, guaranteed available), `megazord-cli` (needs `npm view` check), `megazord-cc` (needs `npm view` check). The chosen name affects the README, all install instructions, and the marketplace entry. Decide and commit to this before writing any documentation.

- **OIDC Trusted Publishing vs. granular token:** The architecture recommends OIDC (no secrets to manage) but the first publish of a brand-new package may require a manual step due to npm 2FA. Decide which auth strategy to use at the start of Phase 2, and decide whether to do the very first publish manually before automating subsequent ones.

- **Anthropic official directory review timeline:** No public documentation on how long review takes or the precise rejection criteria. Track B of Phase 4 should not be on the critical path for the launch milestone. Self-hosted marketplace (Track A) is the guaranteed, immediately controllable distribution channel.

- **`postbuild` script (`node bin/megazord.mjs update --yes`):** Currently safe because `postbuild` only runs when `build` is explicitly called, not during `npm install`. Flagged as a fragile pattern — never add a `prepare` script that calls `build` or this will run for all installers. Document this constraint in CONTRIBUTING.md.

---

## Sources

### Primary (HIGH confidence)

- [Claude Code Plugin Marketplaces docs](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace.json schema, hosting, distribution, validation commands
- [Claude Code Plugins reference](https://code.claude.com/docs/en/plugins-reference) — plugin.json schema, caching, versioning, `${CLAUDE_PLUGIN_ROOT}` behavior
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — official directory format, confirmed no npm source usage
- [Plugin directory submission form](https://clau.de/plugin-directory-submission) — required fields for official Anthropic directory listing
- [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) — v2.1.2, CI usage patterns, bun version auto-detection
- [oven-sh/bun#22423](https://github.com/oven-sh/bun/issues/22423) and [#15601](https://github.com/oven-sh/bun/issues/15601) — bun publish OIDC/provenance limitations confirmed
- [npm Trusted Publishing docs](https://docs.npmjs.com/trusted-publishers/) — OIDC authentication for CI, zero-secret management
- [npm Provenance docs](https://docs.npmjs.com/generating-provenance-statements/) — `--provenance` flag requirements (`id-token: write`, Node 22+)
- [GitHub Actions: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) — workflow patterns
- [npm Files & Ignores wiki](https://github.com/npm/cli/wiki/Files-&-Ignores) — files array vs .npmignore vs .gitignore precedence
- [philna.sh trusted publishing guide](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) — practical gotchas: provenance flag, repository field must match

### Secondary (MEDIUM confidence)

- [npm Pre-release versions tagged as latest #7553](https://github.com/npm/cli/issues/7553) — pre-release dist-tag behavior pitfall
- [npm Trusted Publishing community setup guide](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) — OIDC configuration walkthrough
- [npm Generating provenance (Thecandidstartup)](https://www.thecandidstartup.org/2026/01/26/bootstrapping-npm-provenance-github-actions.html) — practical bootstrapping guide
- [README Best Practices analysis](https://rivereditor.com/blogs/write-perfect-readme-github-repo) — structure recommendations based on 500+ trending repos
- [Top Claude Code Plugins 2026](https://composio.dev/blog/top-claude-code-plugins) — competitor distribution channel analysis

---
*Research completed: 2026-02-19*
*Ready for roadmap: yes*
