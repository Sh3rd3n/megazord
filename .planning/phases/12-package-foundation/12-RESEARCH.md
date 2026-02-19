# Phase 12: Package Foundation - Research

**Researched:** 2026-02-19
**Domain:** npm packaging, GitHub repository setup, license/changelog creation, package metadata
**Confidence:** HIGH

## Summary

Phase 12 makes the Megazord codebase publish-ready. The work spans seven concrete areas: (1) creating a GitHub repository, (2) renaming the npm package to `megazord-cli`, (3) fixing the `files` array to include `scripts/`, (4) replacing hardcoded `VERSION` constants with dynamic reads from package.json, (5) synchronizing versions between package.json and plugin.json, (6) adding an MIT LICENSE file, and (7) initializing a CHANGELOG.md. A language audit across all user-facing text completes the phase.

The codebase is already well-structured for packaging. The `files` array approach (versus `.npmignore`) is already in use and correctly excludes `.planning/`, `.git/`, dev configs, and `src/`. The main gaps are straightforward: a missing directory in the array, hardcoded version strings in two files, stale metadata in package.json and plugin.json, and missing LICENSE/CHANGELOG files. The GitHub repo creation is a single `gh` command.

**Primary recommendation:** Execute changes in dependency order: package.json metadata first (name, version, repository, author, files), then version deduplication in source, then LICENSE/CHANGELOG creation, then GitHub repo creation + push. Language audit can run in parallel with any step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- MIT license, copyright holder: Luca Derosas, copyright year: 2026
- LICENSE file at repo root must match `license` field in package.json
- GitHub repo: `sh3rd3n/megazord` (not megazord-cli)
- Start as **private** -- goes public only after Phase 15 (npm publish)
- Before going public: explicit verification checkpoint with user
- CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) format
- Sections: Added/Changed/Fixed/Removed as applicable
- Start at version **1.0.0**
- All user-facing text must be in English -- no Italian strings
- Audit scope: CLI output, skill prompts, agent descriptions, error messages, comments, docs
- Fix `scripts/` missing from `files` array (known showstopper)
- `npm pack --dry-run` must include: `scripts/`, `bin/`, `hooks/`, `skills/`, `agents/`, `commands/`
- Must exclude: `.planning/`, `.git/`, `.DS_Store`

### Claude's Discretion
- GitHub repo description text
- GitHub topics/tags selection
- CHANGELOG v1.0.0 detail level
- Semver strategy for future releases
- Exact package.json metadata fixes beyond the known `scripts/` gap

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REPO-01 | GitHub repo `sh3rd3n/megazord` created with full code push | Use `gh repo create sh3rd3n/megazord --private --source=. --remote=origin --push`. Auth verified: `gh auth status` shows logged in as `Sh3rd3n` with `repo` scope. No remote currently configured. |
| REPO-02 | Package name changed to `megazord-cli` in package.json and all references | Current `package.json` has `"name": "megazord"`. The `bin` field key should stay `"megazord"` (CLI command name). Only the npm package name changes. Plugin name in `.claude-plugin/plugin.json` stays `"mz"`. |
| REPO-03 | `scripts/` added to `files` array in package.json | Currently missing. Contains `enforce-ownership.sh`. Add `"scripts"` to the `files` array. Verified it's not in current `npm pack --dry-run` output. |
| REPO-04 | Hardcoded versions in `install.ts` and `update.ts` replaced with dynamic read from package.json | Both files have `const VERSION = "0.1.0"`. The `findPackageJson()` pattern from `index.ts` can be extracted to a shared utility and imported. |
| REPO-05 | Versions synchronized between package.json and .claude-plugin/plugin.json | Currently both at `0.1.0`. Both need `1.0.0`. Plugin.json also has stale `homepage` and `repository` URLs pointing to `github.com/megazord/megazord` instead of `github.com/sh3rd3n/megazord`. |
| REPO-06 | MIT LICENSE file added to project root | Does not exist yet. Standard MIT text with `Copyright (c) 2026 Luca Derosas`. npm auto-includes LICENSE in tarball. |
| REPO-07 | `.npmignore` or `files` array configured to exclude `.planning/`, `.git/`, dev files | Already working via `files` array. Verified: `.planning/`, `.git/`, `.DS_Store`, `src/`, `node_modules/`, dev configs all excluded from `npm pack --dry-run`. The `files` array approach is preferred over `.npmignore` -- no `.npmignore` needed. |
| DOCS-04 | CHANGELOG.md initialized with v1.0 and v1.1 entries | Does not exist yet. Must follow Keep a Changelog format. CHANGELOG is NOT auto-included by npm when using `files` array (confirmed via npm/cli#8434), so it may need to be added to `files`. |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| npm | 10.9.4 | Package management/publishing | Already installed, required for `npm pack --dry-run` verification |
| gh CLI | (installed) | GitHub repo creation | Already authenticated as `Sh3rd3n` with `repo` scope |
| Node.js | 22.22.0 | Runtime | Already in use, matches `engines.node >= 22` |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| tsdown | 0.20.0+ | Bundle CLI to bin/ | Already configured, run after source changes to regenerate bin/ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `files` array | `.npmignore` | `files` is already in use and is a whitelist (safer). No reason to switch. |
| Manual LICENSE creation | `gh repo create --license MIT` | gh flag only works during repo creation, doesn't give control over copyright holder text. Manual creation is better. |

**Installation:**
No new dependencies needed. All tools are already available.

## Architecture Patterns

### Current Package Structure (post-build)
```
megazord/
 bin/                  # Built CLI bundle (tsdown output)
   megazord.mjs          # Entry point (shebang + commander)
   install-*.mjs         # Lazy-loaded command chunks
   update-*.mjs
   ...
 scripts/              # Plugin hook scripts (MISSING from files array)
   enforce-ownership.sh
 hooks/                # Plugin hook definitions
   hooks.json
 skills/               # 15 skill directories with SKILL.md files
 agents/               # 6 agent definitions (.md files)
 commands/             # 15 command definitions (.md files)
 .claude-plugin/       # Plugin manifest
   plugin.json
 package.json
 LICENSE               # TO CREATE
 CHANGELOG.md          # TO CREATE
```

### Pattern 1: Dynamic Version Reading
**What:** Replace hardcoded `const VERSION = "0.1.0"` with a dynamic read from package.json
**When to use:** Everywhere the version is needed at runtime
**Current state:** `src/cli/index.ts` already has `findPackageJson()` that walks up directories. Both `install.ts` and `update.ts` hardcode `const VERSION = "0.1.0"` instead.

**Recommended approach:** Extract `findPackageJson()` to a shared module (e.g., `src/cli/utils/version.ts` or reuse from `index.ts`) and import the version in `install.ts` and `update.ts`. The bundler (tsdown) will handle code splitting.

```typescript
// src/cli/utils/version.ts (or inline in existing module)
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findPackageJson(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== dirname(dir)) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error("Could not find package.json");
}

const pkg = JSON.parse(readFileSync(findPackageJson(), "utf-8"));
export const VERSION: string = pkg.version;
```

Then in `install.ts` and `update.ts`:
```typescript
import { VERSION } from "../utils/version.js";
// Remove: const VERSION = "0.1.0";
```

**Important:** After modifying source, `bun run build` must be run to regenerate `bin/` files. The build step is required before `npm pack` or testing.

### Pattern 2: Keep a Changelog Format
**What:** Standard CHANGELOG format from keepachangelog.com
**When to use:** CHANGELOG.md file
**Source:** https://keepachangelog.com/en/1.1.0/

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-19

### Added
- Feature descriptions here

[Unreleased]: https://github.com/sh3rd3n/megazord/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sh3rd3n/megazord/releases/tag/v1.0.0
```

### Pattern 3: MIT License File
**What:** Standard MIT license text
**Source:** https://opensource.org/license/mit

```
MIT License

Copyright (c) 2026 Luca Derosas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Anti-Patterns to Avoid
- **Hardcoding version in multiple places:** The VERSION constant in install.ts and update.ts is exactly this anti-pattern. Single source of truth should be package.json.
- **Using `.npmignore` alongside `files` array:** The `files` array is a whitelist and takes precedence. Adding `.npmignore` creates confusion about which mechanism is authoritative. Stick with `files` only.
- **Leaving `dist` in files array:** The `files` array currently includes `"dist"` but no `dist/` directory exists (build output goes to `bin/`). Dead entries cause confusion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub repo creation | Manual git remote + GitHub UI | `gh repo create --private --source=. --remote=origin --push` | One command handles remote creation, origin setup, and initial push |
| Package content verification | Manual file checking | `npm pack --dry-run` | Authoritative list of what npm will actually publish |
| Version synchronization | Custom script to sync versions | Read from package.json at runtime + build-time plugin.json update | Runtime read eliminates the sync problem entirely |

**Key insight:** The hardcoded VERSION pattern is the root cause of the version sync problem. Fixing REPO-04 (dynamic version) partially solves REPO-05 (sync). The plugin.json version still needs manual update at release time, but the CLI commands will always be in sync with package.json.

## Common Pitfalls

### Pitfall 1: npm Package Name vs. CLI Binary Name
**What goes wrong:** Changing `"name": "megazord"` to `"name": "megazord-cli"` in package.json but also changing the `bin` field key, breaking the `megazord` CLI command.
**Why it happens:** The `name` field (npm registry name) and the `bin` key (installed CLI command name) serve different purposes but look related.
**How to avoid:** Change ONLY the `name` field. Keep `"bin": { "megazord": "bin/megazord.mjs" }` unchanged. Users will `bunx megazord-cli` to install but run `megazord` as the command.
**Warning signs:** `megazord --version` stops working after package name change.

### Pitfall 2: CHANGELOG Not Auto-Included with `files` Array
**What goes wrong:** Creating CHANGELOG.md but it doesn't appear in `npm pack --dry-run` output.
**Why it happens:** When using the `files` array in package.json, npm does NOT auto-include CHANGELOG (confirmed in npm/cli#8434, closed July 2025). Only package.json, README, and LICENSE/LICENCE are auto-included.
**How to avoid:** Either add `"CHANGELOG.md"` to the `files` array, or accept that CHANGELOG won't be in the published tarball (it's still in the git repo and on GitHub).
**Warning signs:** `npm pack --dry-run` output doesn't list CHANGELOG.md.

### Pitfall 3: Build Step Forgotten After Source Changes
**What goes wrong:** Modifying `src/cli/commands/install.ts` or `update.ts` to use dynamic version but forgetting to run `bun run build`, so the old hardcoded version remains in `bin/`.
**Why it happens:** The `bin/` directory contains bundled output from tsdown, not the source files directly. Source changes don't propagate until a build runs.
**How to avoid:** Run `bun run build` after ALL source changes. Verify with `node bin/megazord.mjs --version` which should output `1.0.0`.
**Warning signs:** `bin/install-*.mjs` still contains `const VERSION = "0.1.0"` after source was changed.

### Pitfall 4: Stale `.megazord-marketplace/` Directory
**What goes wrong:** The `.megazord-marketplace/` directory at the repo root contains a copy of `.claude-plugin/plugin.json` with old version `0.1.0`. It gets pushed to GitHub even though it's excluded from npm pack.
**Why it happens:** The marketplace directory is created by `install.ts` during local development and is gitignored in practice (currently untracked per `git status`).
**How to avoid:** Add `.megazord-marketplace/` to `.gitignore` to prevent it from ever being committed. It's a generated artifact.
**Warning signs:** Git status shows `.megazord-marketplace/` as untracked.

### Pitfall 5: Plugin.json Metadata Stale
**What goes wrong:** `.claude-plugin/plugin.json` has `homepage` and `repository` pointing to `github.com/megazord/megazord` (doesn't exist) instead of `github.com/sh3rd3n/megazord`.
**Why it happens:** Placeholder URLs from initial development were never updated.
**How to avoid:** Update all metadata fields in plugin.json during this phase: version, homepage, repository, author.
**Warning signs:** Links in plugin metadata 404.

### Pitfall 6: Italian Strings in Published Files
**What goes wrong:** Italian text in user-facing files gets published to npm.
**Why it happens:** Developer communicates in Italian; strings may leak into code comments or messages.
**How to avoid:** Systematic audit of all files in the `files` array directories. The file `superpowers-vs-gsd-analysis.md` at repo root contains Italian text but is NOT in the published package (not in `files` array). No Italian found in `src/`, `skills/`, `agents/`, `commands/`, `hooks/`, `scripts/`, or `bin/` during research.
**Warning signs:** grep for common Italian words in published directories returns hits.

## Code Examples

### package.json After Updates
```json
{
  "name": "megazord-cli",
  "version": "1.0.0",
  "type": "module",
  "description": "Claude Code framework unifying project management, code quality, and multi-agent coordination",
  "license": "MIT",
  "author": {
    "name": "Luca Derosas",
    "url": "https://github.com/sh3rd3n"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/sh3rd3n/megazord.git"
  },
  "homepage": "https://github.com/sh3rd3n/megazord",
  "bugs": {
    "url": "https://github.com/sh3rd3n/megazord/issues"
  },
  "keywords": [
    "claude-code",
    "claude-code-plugin",
    "ai-agent",
    "project-management",
    "code-quality",
    "multi-agent",
    "workflow",
    "cli"
  ],
  "engines": {
    "node": ">=22"
  },
  "bin": {
    "megazord": "bin/megazord.mjs"
  },
  "files": [
    "bin",
    "scripts",
    "skills",
    "agents",
    "hooks",
    "commands",
    ".claude-plugin"
  ],
  "scripts": { "..." : "..." },
  "dependencies": { "..." : "..." },
  "devDependencies": { "..." : "..." }
}
```

**Key changes from current:**
1. `name`: `"megazord"` -> `"megazord-cli"`
2. `version`: `"0.1.0"` -> `"1.0.0"`
3. `author`: Added with name and URL
4. `repository`: Added in full object format
5. `homepage`: Added
6. `bugs`: Added
7. `keywords`: Updated for discoverability (added `claude-code`, `claude-code-plugin`, `ai-agent`, `multi-agent`, `cli`)
8. `files`: Added `"scripts"`, removed `"dist"` (directory doesn't exist; build output is `bin/`)

### plugin.json After Updates
```json
{
  "name": "mz",
  "version": "1.0.0",
  "description": "Unified framework for project management, code quality, and multi-agent coordination",
  "author": {
    "name": "Luca Derosas"
  },
  "homepage": "https://github.com/sh3rd3n/megazord",
  "repository": "https://github.com/sh3rd3n/megazord",
  "license": "MIT",
  "keywords": [
    "project-management",
    "code-quality",
    "agent-teams",
    "claude-code-plugin",
    "workflow"
  ]
}
```

### GitHub Repo Creation Command
```bash
# Create private repo from existing local code
gh repo create sh3rd3n/megazord \
  --private \
  --source=. \
  --remote=origin \
  --push \
  --description "Claude Code framework for project management, code quality, and multi-agent coordination"
```

### .gitignore Updates
```gitignore
node_modules/
dist/
bin/
.DS_Store
.megazord-marketplace/
```

### Verification Command
```bash
# Verify package contents include required directories
npm pack --dry-run 2>&1 | grep -E "scripts/|bin/|hooks/|skills/|agents/|commands/"

# Verify version reads from package.json (not hardcoded)
node bin/megazord.mjs --version
# Should output: 1.0.0
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.npmignore` for exclusion | `files` array for inclusion (whitelist) | npm best practice since v7+ | Safer default; only listed items publish |
| CHANGELOG auto-included | CHANGELOG NOT auto-included with `files` | npm v11 (docs corrected mid-2025) | Must explicitly add to `files` if wanted in tarball |
| `"repository": "github:user/repo"` | `"repository": { "type": "git", "url": "..." }` | npm v10+ publishes warnings for shorthand | Use full object format to avoid warnings |

**Deprecated/outdated:**
- `"dist"` in `files` array: The `dist/` directory doesn't exist in this project. Build output goes to `bin/` via tsdown. Remove from `files`.
- `homepage: "https://github.com/megazord/megazord"` in plugin.json: Points to a nonexistent repository. Must update to `sh3rd3n/megazord`.

## Discretion Recommendations

### GitHub Repo Description
**Recommendation:** "Claude Code framework for project management, code quality, and multi-agent coordination"
**Rationale:** Matches the package.json description closely. Leads with "Claude Code" for discoverability. Under 100 characters.

### GitHub Topics
**Recommendation:** `claude-code`, `claude-code-plugin`, `ai-agent`, `project-management`, `code-quality`, `multi-agent`, `workflow-automation`, `cli`, `typescript`, `nodejs`
**Rationale:** Based on research of existing Claude Code plugins on GitHub (topics `claude-code-plugin`, `claude-code` are actively used). Adding `ai-agent`, `multi-agent` for the coordination features. `typescript` and `nodejs` for language discoverability.

### CHANGELOG v1.0.0 Detail Level
**Recommendation:** Moderate detail -- list the major feature areas as bullet points under `### Added`, without exhaustive sub-features. The changelog serves as a release overview, not documentation.
**Suggested sections:**
- `### Added` -- List major features: CLI installer, 15 skills/commands, 6 specialized agents, agent teams with worktree isolation, hook-based ownership enforcement, configuration presets, state management across sessions
- No `### Changed`, `### Fixed`, `### Removed` for v1.0.0 (it's the initial release)

### Semver Strategy
**Recommendation:** Standard semver with these conventions:
- **Patch (1.0.x):** Bug fixes, documentation updates, non-breaking changes
- **Minor (1.x.0):** New skills, new commands, new agent types, non-breaking feature additions
- **Major (x.0.0):** Breaking changes to CLI interface, config schema, plugin API, or skill format
- Pre-release: `-beta.N` suffix for npm publish testing before stable release
- v1.1.0 will be the next minor (documentation + CI/CD + npm publish phases)

## Open Questions

1. **Should CHANGELOG.md be in the `files` array?**
   - What we know: npm does NOT auto-include CHANGELOG.md when `files` is specified. It will not be in the published tarball unless explicitly added.
   - What's unclear: Whether it's important for CHANGELOG to be in the npm tarball (users can read it on GitHub).
   - Recommendation: Add it to `files`. It's small and users expect it in the installed package. Most published packages include it.

2. **Should `superpowers-vs-gsd-analysis.md` be deleted or just gitignored?**
   - What we know: Contains Italian text, is NOT in the published package (not in `files` array), but IS in the git repo. It's an untracked file per git status.
   - What's unclear: Whether the user wants to keep it for reference.
   - Recommendation: Leave it alone -- it's not in scope for Phase 12 (not published, just a local reference file).

3. **Should the `.claude/settings.local.json` be committed?**
   - What we know: Contains local Claude Code settings. Currently exists in the repo at `.claude/settings.local.json`.
   - What's unclear: Whether it should be in the published package or git repo.
   - Recommendation: Should NOT be in the published package (it's not in `files` array, so it won't be). Consider adding `.claude/` to `.gitignore` for the public repo if it contains personal settings.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: package.json, plugin.json, install.ts, update.ts, index.ts, tsdown.config.ts, .gitignore
- `npm pack --dry-run` output: verified actual package contents (61 files, 100.2 kB)
- `gh auth status`: verified GitHub CLI authentication as `Sh3rd3n` with `repo` scope
- `npm --version` (10.9.4) / `node --version` (22.22.0): verified runtime versions

### Secondary (MEDIUM confidence)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) -- changelog format specification
- [npm/cli#8434](https://github.com/npm/cli/issues/8434) -- CHANGELOG not auto-included with files array (closed July 2025)
- [npm docs: package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- files, repository, author, bugs fields
- [gh repo create manual](https://cli.github.com/manual/gh_repo_create) -- repo creation flags
- [MIT License (OSI)](https://opensource.org/license/mit) -- license text template
- [GitHub Topics: claude-code-plugin](https://github.com/topics/claude-code-plugin) -- topic naming conventions

### Tertiary (LOW confidence)
- None. All findings verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed and verified locally
- Architecture: HIGH -- based on direct codebase inspection, all patterns verified
- Pitfalls: HIGH -- each pitfall verified against actual codebase state (e.g., missing scripts/, hardcoded versions, stale URLs)

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable domain, no fast-moving dependencies)
