# Feature Research: Distribution & Publication

**Domain:** npm package launch, Claude Code marketplace listing, developer tool documentation, CI/CD for open source
**Researched:** 2026-02-19
**Confidence:** HIGH (official Anthropic docs, npm docs, established open-source patterns)

## Feature Landscape

This research covers what Megazord needs to go from "works locally" to "anyone can install and use it." The existing v1.0 features are built. This milestone is purely about distribution, documentation, discoverability, and automation.

### Table Stakes (Users Expect These)

Features users assume exist when they encounter a developer tool on npm/GitHub. Missing these = developers close the tab.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One-command install that works** | `bunx megazord` (or `npx megazord`) must work on first try for anyone with Node >= 22. The 5-minute quickstart benchmark is critical -- if setup takes longer, devs leave. | LOW | Already have `bin/megazord.mjs` with install command. Need: correct `files` field in package.json, proper shebang, test on clean machine. Dependency on existing install logic. |
| **README with instant value proposition** | First thing users see. Repos with comprehensive READMEs get 4x more stars and 6x more contributors. Must answer "what is this?" and "how do I use it?" in under 30 seconds. | MEDIUM | Need: hero description, one-liner install, feature list, command reference, usage examples. No README exists yet. |
| **LICENSE file** | Without a license, the project is not open source. npm warns about missing license. Users and companies check license before installing. | LOW | MIT already declared in package.json and plugin.json. Need actual LICENSE file in repo root. |
| **Working npm publication** | Package must be installable from npm registry. `bun add -g megazord` and `bunx megazord` must resolve correctly. Package name `megazord` must be available or scoped. | LOW | package.json already configured with bin, files, engines. Need: verify name availability on npm, publish with `npm publish` (or `bun publish`), test install from registry. |
| **GitHub repository** | Code must be publicly accessible. Users inspect source before installing CLI tools. GitHub is where developers discover, star, fork, and contribute. | LOW | Repo planned at sh3rd3n/megazord. Need: push code, set description, add topics/tags, configure repo settings. |
| **Correct package.json metadata** | npm listing page shows description, homepage, repository, keywords, license. Missing metadata = looks abandoned. | LOW | Partially done. Need: verify `repository`, `homepage`, `bugs` URLs point to real GitHub repo. Add `keywords` for discoverability. |
| **CHANGELOG** | Users need to know what changed between versions. npm shows changelogs. Required for trust signal. | LOW | No CHANGELOG exists yet. Start with v1.0.0 entry documenting initial release features. |
| **Shields.io badges in README** | Visual trust signals. Build status, npm version, downloads, license. Repos with badges look maintained and professional. | LOW | Add after CI and npm publish are live. Standard badges: npm version, license, build status, node version requirement. |
| **.npmignore or files whitelist** | Users should only download what they need. Source files, tests, planning docs, and dev configs should not be in the npm package. Bloated packages signal carelessness. | LOW | `files` field exists in package.json listing bin, dist, skills, agents, hooks, commands, .claude-plugin. Verify this excludes src/, tests/, .planning/, node_modules/. |

### Differentiators (Competitive Advantage)

Features that go beyond table stakes and make Megazord stand out during discovery and adoption.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Claude Code marketplace listing** | The official Anthropic plugin directory (`claude-plugins-official`) is where Claude Code users discover plugins. Listing here puts Megazord in front of the exact target audience. Superpowers is already listed. | MEDIUM | Two paths: (1) Submit via [plugin directory submission form](https://clau.de/plugin-directory-submission) for official Anthropic directory, (2) Create own marketplace repo. Submission requires quality review. Already have proper plugin.json structure. |
| **Demo GIF/video in README** | Repos with screenshots/GIFs get 42% more stars. For a CLI framework with 15 commands, showing a real workflow (init -> plan -> go -> verify) in a GIF is more convincing than any description. | MEDIUM | Record terminal session showing Megazord workflow. Tools: asciinema, terminalizer, or vhs. Place at top of README below badges. |
| **Quickstart that delivers a "first win"** | Not just "how to install" but "here's your first successful task in 60 seconds." Users who experience value immediately are 3x more likely to adopt. | LOW | README section: Install, run `/mz:init`, run `/mz:quick "add a hello world route"`, see the result. Minimal steps to value. |
| **GitHub Actions CI/CD pipeline** | Automated testing on PR + automated publish on tag. Signals maturity. Prevents broken releases. Enables trusted publishing (provenance). | MEDIUM | Two workflows: (1) `ci.yml` -- lint + typecheck + test on PR, (2) `release.yml` -- build + publish to npm on version tag. Use OIDC trusted publishing for security (no long-lived npm tokens). |
| **npm provenance attestation** | Cryptographic proof of where and how the package was built. Trust signal on npm listing page. Enabled automatically with trusted publishing (OIDC). | LOW | Add `--provenance` flag to publish command in CI, or use trusted publishing which generates it automatically. Requires npm CLI >= 11.5.1 and `id-token: write` permission in GitHub Actions. |
| **Semantic versioning with automated releases** | Conventional commits -> automated version bumps -> automated changelog -> automated publish. Removes human error from release process. | MEDIUM | Use `semantic-release` or `changesets`. semantic-release is more automated (zero manual steps), changesets gives more control. Recommend semantic-release for solo maintainer. |
| **Own marketplace repository** | Self-hosted marketplace.json for users who prefer `/plugin install megazord@marketplace-name` over npm install. Provides alternative discovery channel. | LOW | Create repo with `.claude-plugin/marketplace.json` listing Megazord with GitHub source. Users add with `/plugin marketplace add sh3rd3n/megazord-marketplace`. |
| **CONTRIBUTING.md** | Signals the project welcomes contributions. Explains how to set up dev environment, run tests, submit PRs. Open source projects with CONTRIBUTING.md get more contributors. | LOW | Document: clone, bun install, bun test, bun run build, how to add a skill, PR process. |
| **Command reference documentation** | All 15 `/mz:` commands documented with description, usage, examples, and options. In README or separate docs page. | MEDIUM | Table format in README: command, description, when to use. Detailed examples for the 5 most-used commands (init, plan, go, quick, status). |

### Anti-Features (Do NOT Build for This Milestone)

Features that seem relevant to a "distribution milestone" but would waste time or create problems.

| Anti-Feature | Why It Seems Relevant | Why Problematic | What to Do Instead |
|--------------|----------------------|-----------------|-------------------|
| **Documentation website (docs site)** | Big projects have dedicated docs sites (Docusaurus, VitePress). Looks professional. | Massive effort to build and maintain. For a v1.0 launch, a great README is more valuable than a mediocre docs site. The README is where 95% of initial users will look. A docs site with thin content is worse than a comprehensive README. | Write an excellent README. Add a docs site when the README exceeds ~500 lines and needs navigation, or when there are enough users asking questions that a FAQ/guide structure is warranted. |
| **Logo and brand identity** | Open source projects with logos look established. Design work makes a project feel real. | Time sink. Logo design is a procrastination trap. Users install tools that solve their problems, not tools with pretty logos. The Deep Trilogy, Ralph, and many successful plugins have no logo. | Use the project name as text. If a logo matters later, commission one after the project has traction. A monospace "MEGAZORD" in the README is fine. |
| **npm scope (@sh3rd3n/megazord)** | Scoped packages prevent name conflicts. Recommended in enterprise best practices. | The package name `megazord` is almost certainly available as an unscoped name. Unscoped names are shorter to type (`bunx megazord` vs `bunx @sh3rd3n/megazord`). Scoping is for organizations with many packages, not solo projects. | Claim `megazord` as unscoped. If taken, use `@megazord/cli` or similar. Check availability first with `npm view megazord`. |
| **Multi-registry publishing (GitHub Packages + npm)** | Publishing to GitHub Packages in addition to npm seems thorough. | Doubles CI complexity for near-zero benefit. npm is where 99% of JS packages are discovered and installed. GitHub Packages is for private org packages. | Publish to npm only. GitHub Packages adds nothing for a public CLI tool. |
| **Interactive onboarding wizard in CLI** | Modern CLI tools have guided first-run experiences. Seems like good UX. | Megazord's onboarding IS Claude Code. The `/mz:init` command guides users through project setup inside Claude's context. A separate CLI wizard would duplicate this. The install command is `megazord install` -- it should work silently and correctly, not ask questions. | Keep `megazord install` as the non-interactive installer. Keep `/mz:init` as the interactive onboarding (inside Claude). |
| **Monorepo structure** | Some projects restructure into packages/ directory when publishing. Seems cleaner. | Megazord is a single package. Monorepo tooling (turborepo, nx) adds complexity for no benefit. The current flat structure with bin/, dist/, skills/, agents/ is exactly what a Claude Code plugin needs. | Keep flat structure. The repo root IS the plugin, which is a key architectural decision from v1.0. |
| **Homebrew tap or other non-npm distribution** | Wider distribution seems good. | Megazord requires Claude Code which requires Node.js. Every target user already has npm/bun. A Homebrew tap adds a maintenance burden for a distribution channel that adds zero new users. | npm only. If users request Homebrew later, consider it then. |
| **GitHub Discussions / Discord server** | Community channels seem important for launch. | Community infrastructure before community exists is empty and discouraging. An empty Discord is worse than no Discord. GitHub Issues is sufficient for early feedback and bug reports. | Use GitHub Issues for everything initially. Add Discussions when issues become conversational. Add Discord when there are >50 active users who want real-time chat. |

## Feature Dependencies

```
[GitHub Repository]
    +-- enables --> [CI/CD Pipeline]
    +-- enables --> [README with badges (build status)]
    +-- enables --> [CONTRIBUTING.md (links to repo)]
    +-- enables --> [Marketplace listing (source reference)]

[npm Publication]
    +-- enables --> [README badges (npm version, downloads)]
    +-- enables --> [Marketplace listing (npm source type)]
    +-- requires --> [Correct package.json metadata]
    +-- requires --> [.npmignore / files whitelist verified]

[CI/CD Pipeline]
    +-- requires --> [GitHub Repository]
    +-- enables --> [Automated releases (semantic-release)]
    +-- enables --> [npm provenance attestation]
    +-- enables --> [Build status badge]

[Marketplace Listing]
    +-- requires --> [GitHub Repository (for source)]
    +-- requires --> [Working plugin.json (already exists)]
    +-- enhances --> [Discoverability (Claude Code users find it)]

[README]
    +-- requires --> [npm publication (for install commands)]
    +-- requires --> [GitHub repo (for badge URLs)]
    +-- enhanced by --> [Demo GIF]
    +-- enhanced by --> [Badges]
    +-- enhanced by --> [Command reference]

[CHANGELOG]
    +-- enhanced by --> [Automated releases (auto-generate)]
    +-- standalone for v1.0.0 --> [Manual initial entry]

[LICENSE file]
    +-- standalone --> [No dependencies, do first]
```

### Dependency Notes

- **GitHub repo is the foundation.** Almost everything depends on having a public repository. Push code first, then build on top.
- **npm publication and GitHub repo are independent.** Can publish to npm before or after making the repo public, but badges and README links work best when both exist.
- **CI/CD depends on GitHub repo.** GitHub Actions workflows live in the repo. Can't set up CI before the repo exists.
- **Marketplace listing depends on both.** The submission form asks for a GitHub repo URL and the plugin must be installable. Both must exist first.
- **README is iterative.** Start with a basic version, add badges and GIF after CI and npm are live.

## Critical Path (Recommended Order)

1. **LICENSE file** -- 5 minutes, no dependencies, required for everything else
2. **GitHub repo creation + code push** -- enables everything else
3. **Clean up package.json metadata** -- homepage, repository, bugs URLs pointing to real repo
4. **npm publication** -- verify name, publish, test install on clean machine
5. **README v1** -- hero, install, features, command reference (no badges yet, no GIF yet)
6. **CI/CD pipeline** -- ci.yml for PRs, release.yml for tags
7. **Badges in README** -- now that CI and npm exist, add shields.io badges
8. **CHANGELOG v1** -- document v1.0.0 features
9. **Demo GIF** -- record terminal session showing real workflow
10. **Marketplace submission** -- submit to Anthropic official directory
11. **CONTRIBUTING.md** -- document dev setup and PR process

## Marketplace-Specific Requirements

Based on [official Anthropic plugin directory](https://github.com/anthropics/claude-plugins-official) and [marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces):

### For Official Directory (claude-plugins-official)

| Requirement | Status | Notes |
|-------------|--------|-------|
| `.claude-plugin/plugin.json` manifest | DONE | Already exists at correct path |
| Quality standards review | PENDING | Submit via [submission form](https://clau.de/plugin-directory-submission). Exact criteria not public, but must meet quality and security standards. |
| README explaining structure and install | NOT DONE | Need clear documentation |
| Plugin structure (commands/, skills/, agents/) | DONE | Standard structure already in place |
| Safety documentation for hooks | SHOULD DO | Document what hooks do and why (session-start, user-prompt) |
| Public GitHub repository | NOT DONE | Required as source reference |

### For Self-Hosted Marketplace

| Requirement | Status | Notes |
|-------------|--------|-------|
| marketplace.json with schema | NOT DONE | Create `.claude-plugin/marketplace.json` in a marketplace repo |
| Plugin source pointing to GitHub repo | NOT DONE | `"source": { "source": "github", "repo": "sh3rd3n/megazord" }` |
| Category assignment | NOT DONE | Recommend "development" (7 of 15 official plugins use this) |
| Version tracking | DONE | Already in plugin.json |

### Marketplace Plugin Entry Template

Based on official Anthropic marketplace structure:

```json
{
  "name": "megazord",
  "description": "Development lifecycle framework with multi-agent coordination, project management, and code quality discipline",
  "version": "1.0.0",
  "author": {
    "name": "sh3rd3n"
  },
  "source": {
    "source": "github",
    "repo": "sh3rd3n/megazord"
  },
  "category": "development",
  "keywords": [
    "project-management",
    "code-quality",
    "agent-teams",
    "tdd",
    "workflow",
    "lifecycle"
  ],
  "license": "MIT",
  "homepage": "https://github.com/sh3rd3n/megazord"
}
```

## README Structure (Evidence-Based)

Based on analysis of 10K+ star repos and README best practices research, the README should follow this structure:

### Must-Have Sections (in order)

1. **Title + one-line description** -- "Megazord -- Claude Code framework for the full development lifecycle"
2. **Badges row** -- npm version, license, build status, node version
3. **Hero paragraph** (3 sentences max) -- What it is, what problem it solves, why it's different
4. **Demo GIF** -- 15-20 second recording of a real workflow
5. **Quickstart** -- Install (`bunx megazord`) + first command (`/mz:init`) + first result
6. **Features list** -- Bulleted, scannable, grouped by category
7. **Commands reference** -- Table with all 15 commands, description, and when to use
8. **Configuration** -- How to customize quality settings
9. **Requirements** -- Node >= 22, Claude Code
10. **Contributing** -- Link to CONTRIBUTING.md
11. **License** -- MIT with link

### What NOT to Put in README

- Architecture diagrams (put in separate ARCHITECTURE.md if needed)
- Detailed API reference (the commands ARE the API, keep the table concise)
- Comparison tables with competitors (comes across as defensive; let the features speak)
- Roadmap (put in GitHub Issues/Milestones)

## CI/CD Pipeline Design

### Workflow 1: CI (on every PR)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

### Workflow 2: Release (on version tag)

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
permissions:
  contents: write
  id-token: write  # for npm provenance
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: bun install
      - run: bun run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

**Note on trusted publishing:** npm's OIDC trusted publishing eliminates the need for `NPM_TOKEN` secrets. Configure on npmjs.com under package settings. Requires npm CLI >= 11.5.1. If using trusted publishing, remove the `NODE_AUTH_TOKEN` env var and the setup-node registry-url, and npm will auto-detect the OIDC environment.

## npm Publication Checklist

| Item | Status | Action |
|------|--------|--------|
| Package name available | CHECK | Run `npm view megazord` -- if 404, name is available |
| `files` field correct | VERIFY | Ensure only runtime files are included (bin, dist, skills, agents, hooks, commands, .claude-plugin) |
| `bin` field correct | DONE | `"megazord": "bin/megazord.mjs"` |
| `engines` field set | DONE | `"node": ">=22"` |
| Shebang in bin file | DONE | `#!/usr/bin/env node` in megazord.mjs |
| `type: "module"` | DONE | ESM package |
| `description` present | DONE | In package.json |
| `license` present | DONE | MIT |
| `repository` URL correct | UPDATE | Must point to actual GitHub repo URL |
| `homepage` URL correct | UPDATE | Must point to actual GitHub repo URL |
| `bugs` URL present | ADD | `"bugs": { "url": "https://github.com/sh3rd3n/megazord/issues" }` |
| `keywords` for discovery | UPDATE | Add more: "claude-code", "plugin", "framework", "development-workflow", "multi-agent" |
| Test install from tarball | DO | `bun run build && npm pack && npm install megazord-1.0.0.tgz -g` |
| Test install via bunx | DO | After publish: `bunx megazord` on clean machine |
| No secrets in package | VERIFY | Check tarball contents: `npm pack --dry-run` |

## Competitor Distribution Analysis

How competing Claude Code frameworks distribute:

| Framework | Distribution | Install Command | Marketplace | README Quality |
|-----------|-------------|-----------------|-------------|---------------|
| **Superpowers** | Plugin marketplace | `/plugin install superpowers@claude-code-plugins` | Official Anthropic directory | Excellent -- hero GIF, clear quickstart, comprehensive feature list |
| **GSD** | npm package | `npx get-shit-done` | Not listed | Good -- clear structure, badges, quickstart |
| **Claude Flow** | npm package | `npx claude-flow` | Not listed | Extensive -- full docs, architecture diagrams, comparison tables |
| **Deep Trilogy** | Plugin marketplace | `/plugin install` | Community marketplace | Minimal -- 3 separate READMEs |
| **CCPM** | npm package | `npx ccpm` | Not listed | Good -- clear install, feature table |
| **RIPER-5** | Manual skill copy | Copy SKILL.md files | Not listed | Minimal -- just the methodology docs |

### Key Insight

Superpowers is the only major framework in the official Anthropic directory. Getting Megazord listed there is a significant competitive advantage. npm + marketplace provides dual distribution channels.

## MVP Recommendation

### Phase 1: Ship It (Minimum Viable Distribution)

Priority: get installable and usable by anyone.

1. LICENSE file (5 min)
2. GitHub repo + push (30 min)
3. Fix package.json metadata (15 min)
4. npm publish (15 min)
5. README v1 -- hero, install, features, commands (2-3 hours)
6. CHANGELOG v1.0.0 (30 min)

### Phase 2: Polish It (Professional Quality)

Priority: look like a maintained, serious project.

7. CI/CD pipeline (1-2 hours)
8. Badges in README (15 min after CI is green)
9. Demo GIF (1 hour)
10. CONTRIBUTING.md (30 min)

### Phase 3: Amplify It (Discovery)

Priority: reach the target audience.

11. Marketplace submission to Anthropic official directory
12. Own marketplace repo (optional, for `/plugin install` path)

### Defer: After Traction

- Documentation website -- only when README exceeds 500 lines
- Homebrew tap -- only if users request it
- GitHub Discussions -- only when issue volume justifies it
- Logo/brand identity -- only when project has traction

## Sources

- [Claude Code Plugin Marketplaces Documentation](https://code.claude.com/docs/en/plugin-marketplaces) -- HIGH confidence (official Anthropic docs, verified 2026-02-19)
- [Anthropic Official Plugin Directory](https://github.com/anthropics/claude-plugins-official) -- HIGH confidence (official Anthropic repo)
- [Anthropic claude-code marketplace.json](https://github.com/anthropics/claude-code/blob/main/.claude-plugin/marketplace.json) -- HIGH confidence (official source, 15 plugins listed)
- [Plugin Directory Submission Form](https://clau.de/plugin-directory-submission) -- HIGH confidence (official Anthropic)
- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) -- HIGH confidence (official npm docs)
- [npm Provenance Statements](https://docs.npmjs.com/generating-provenance-statements/) -- HIGH confidence (official npm docs)
- [npm package.json Documentation](https://docs.npmjs.com/cli/v7/configuring-npm/package-json/) -- HIGH confidence (official npm docs)
- [GitHub Actions: Publishing Node.js Packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) -- HIGH confidence (official GitHub docs)
- [Shields.io Badge Service](https://shields.io/) -- HIGH confidence (standard tooling)
- [npm Module Checklist](https://github.com/bahmutov/npm-module-checklist) -- MEDIUM confidence (community best practice, widely referenced)
- [README Best Practices: 10K-Star Format](https://rivereditor.com/blogs/write-perfect-readme-github-repo) -- MEDIUM confidence (analysis of 500+ trending repos)
- [Open Source Checklist Template](https://github.com/cfpb/open-source-project-template/blob/main/opensource-checklist.md) -- MEDIUM confidence (government open source best practice)
- [What 202 Developers Taught About Tool Adoption](https://www.catchyagency.com/post/what-202-open-source-developers-taught-us-about-tool-adoption) -- MEDIUM confidence (survey data, single source)
- [Top Claude Code Plugins 2026](https://composio.dev/blog/top-claude-code-plugins) -- MEDIUM confidence (curated list, commercial blog)
- [semantic-release Guide 2025](https://merginit.com/blog/29062025-automated-multi-platform-releases) -- MEDIUM confidence (tutorial, verified against official docs)

---
*Feature research for: Distribution & Publication (Megazord v1.1)*
*Researched: 2026-02-19*
