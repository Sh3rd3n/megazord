# Phase 15: npm Publication - Research

**Researched:** 2026-02-19
**Domain:** npm package publication, CLI distribution, Claude Code plugin installation
**Confidence:** HIGH

## Summary

Phase 15 publishes `megazord-cli` on npm and ensures it works end-to-end on a clean machine via `bunx megazord-cli install`. The codebase already has a built CLI (tsdown-bundled in `bin/`), a release workflow with OIDC provenance (Phase 14), and an install/update/uninstall command set. However, the CONTEXT decisions introduce significant changes to the file placement strategy (from Claude Code's plugin cache to `~/.claude/megazord/`) and the install UX (silent, no prompts). Additionally, there is a critical bin naming issue: the current package.json maps `"megazord"` as the bin entry, but `bunx megazord-cli` requires a bin entry named `"megazord-cli"` to resolve correctly.

The first publish MUST be done manually (`npm publish --access public`) because npm requires a package to exist before Trusted Publishing (OIDC) can be configured. After that, all subsequent publishes go through the existing release.yml workflow automatically.

**Primary recommendation:** Add `publishConfig` to package.json, fix the bin entry naming, refactor install.ts to use `~/.claude/megazord/` placement with Claude Code's marketplace registration, perform the manual first publish, then configure Trusted Publishing on npmjs.com.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Silent install -- no prompts, no confirmation, no wizard
- Minimal output: just the final result (e.g., "Megazord installed" with path)
- Subcommand-based CLI: `megazord-cli install`, `megazord-cli update`, `megazord-cli uninstall`, `megazord-cli version`
- On failure: full rollback -- undo everything, restore previous state, clear error message
- Dedicated directory: all Megazord files go in `~/.claude/megazord/` -- total isolation from user files
- Files are immutable -- users must NOT modify Megazord files directly. To customize, create their own skills/hooks in their own directories
- Updates overwrite Megazord directory cleanly since files are immutable
- Package name: `megazord-cli` (no scope)
- Command: `bunx megazord-cli install`
- `megazord-cli uninstall` exists -- full cleanup of `~/.claude/megazord/` and all references
- Automatic update check: when user launches Claude Code with Megazord, check for new version and show message if available
- Dual update channels: `megazord-cli update` (CLI, from terminal) AND `/mz:update` skill (from within Claude Code session)

### Claude's Discretion
- How to make Megazord files visible to Claude Code (symlink vs --plugin-dir vs other approach)
- Whether/how to touch user's CLAUDE.md
- npm description and keywords for discoverability
- README strategy (single vs dedicated npm README)
- Update flow details (changelog display, direct overwrite vs diff)
- Versioning strategy (semver starting point)
- Exact update check mechanism and frequency

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NPM-01 | Package `megazord-cli` published on npmjs.com | First manual publish workflow documented, release.yml already exists for subsequent publishes |
| NPM-02 | `bunx megazord-cli` installs and works on clean machine | Critical: bin entry must include `megazord-cli` name, install command must be refactored for `~/.claude/megazord/` placement |
| NPM-03 | `publishConfig` configured in package.json | Add `"publishConfig": { "access": "public" }` to package.json |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| npm CLI | 11+ (bundled with Node 24) | Publishing with OIDC provenance | Only npm supports `--provenance` flag; bun publish does not |
| commander | ^14.0.0 | CLI framework | Already in use, handles subcommands |
| picocolors | ^1.1.0 | Terminal colors | Already in use, zero-dependency |
| ora | ^8.0.0 | Spinner for progress feedback | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | - | All needed libraries already in dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| update-notifier | Manual fetch to registry.npmjs.org | update-notifier adds a dependency but handles caching, background checks, and interval management automatically. Manual fetch is simpler but needs more code. Recommend manual fetch since this is a minimal CLI. |
| symlinks for Claude Code visibility | Marketplace registration (current approach) | Symlinks are fragile and can break. Marketplace registration is the established pattern Claude Code supports. Keep marketplace registration. |

**Installation:**
No new packages required. All dependencies are already present.

## Architecture Patterns

### Recommended Changes to Project Structure

The current install command uses Claude Code's plugin cache at `~/.claude/plugins/cache/megazord-marketplace/mz/{version}/`. Per CONTEXT decisions, this must change to `~/.claude/megazord/`.

```
~/.claude/megazord/           # NEW dedicated directory (immutable, owned by Megazord)
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── init/SKILL.md
│   ├── go/SKILL.md
│   └── ...
├── agents/
│   ├── mz-executor.md
│   └── ...
├── hooks/
│   └── hooks.json
├── commands/
│   ├── init.md
│   └── ...
├── scripts/
│   └── enforce-ownership.sh
└── .version                  # Track installed version for update checks
```

### Pattern 1: Bin Entry Naming for bunx/npx Compatibility

**What:** Both bunx and npx resolve binaries by matching the package name. If package is `megazord-cli` but the bin entry is `megazord`, `bunx megazord-cli` fails.

**When to use:** Always -- this is a blocker for NPM-02.

**Fix:** Add `megazord-cli` as an additional bin entry pointing to the same file:

```json
{
  "bin": {
    "megazord": "bin/megazord.mjs",
    "megazord-cli": "bin/megazord.mjs"
  }
}
```

This allows both `bunx megazord-cli install` (user-facing command from CONTEXT) and `megazord install` (after global install) to work.

**Confidence:** HIGH -- verified via bunx and npx documentation.

### Pattern 2: Silent Install with Rollback

**What:** Refactor `install.ts` to remove all interactive prompts. On failure, clean up partial state.

**Current code issues:**
- `confirm()` and `selectOption()` functions exist (violate "no prompts" decision)
- `process.argv.includes("--yes")` check exists but should be the only mode
- Uses plugin cache path, not `~/.claude/megazord/`

**Recommended approach:**
```typescript
export async function install(): Promise<void> {
  // 1. Detect environment (Claude Code installed?)
  // 2. Copy plugin files to ~/.claude/megazord/
  // 3. Register with Claude Code marketplace system
  // 4. Write .version file
  // 5. Verify installation
  // On ANY failure: rm -rf ~/.claude/megazord/ + undo registry changes
  // Output: single line "Megazord installed" or error message
}
```

### Pattern 3: Marketplace Registration for Claude Code Visibility

**What:** Claude Code discovers plugins via its marketplace/plugin system. Even though files live in `~/.claude/megazord/`, Claude Code needs to know about them.

**Two approaches:**

1. **Register as local marketplace** (current approach, adapted): Write to `known_marketplaces.json` and `installed_plugins.json` pointing to `~/.claude/megazord/` instead of the cache directory. Claude Code's plugin system will discover skills, agents, hooks, and commands from the registered path.

2. **Try `claude plugin marketplace add` first** (current approach): Use `claude CLI` commands, fall back to manual registration if CLI fails.

**Recommendation:** Keep the current dual approach (try CLI, fall back to manual), but update all paths to point to `~/.claude/megazord/`. This is the safest approach since the `claude` CLI may or may not be available in PATH.

### Pattern 4: Update Check via npm Registry API

**What:** Check for newer version on npm registry, show non-intrusive notification.

**Mechanism:**
```typescript
// Fetch latest version from npm registry
const res = await fetch("https://registry.npmjs.org/megazord-cli/latest");
const { version } = await res.json();
// Compare with installed version from ~/.claude/megazord/.version
// If newer: show single-line message, no blocking
```

**Frequency:** Check at most once per 24 hours. Store last check timestamp in `~/.claude/megazord/.update-check`.

**Where to trigger:** In a hook script (SessionStart or similar) that runs when Claude Code launches.

### Pattern 5: publishConfig in package.json

**What:** Ensure `npm publish` always uses correct access level.

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Why:** For unscoped packages, `access: "public"` is technically the default, but `npm publish --provenance` has a known bug where it fails for new packages unless `access` is explicitly set to `public`. Adding `publishConfig` makes this explicit and prevents edge-case failures.

### Anti-Patterns to Avoid
- **Symlinks for plugin files:** Symlinks break when the npm package directory is garbage-collected by bunx. Copy files instead.
- **Interactive prompts in install:** CONTEXT explicitly forbids prompts. Remove all `confirm()` and `selectOption()` calls.
- **Storing files in npm cache directory:** bunx may garbage-collect the package after execution. All files MUST be copied to `~/.claude/megazord/` during install.
- **Touching user's CLAUDE.md:** Risky -- users may have custom content. Recommendation: do NOT modify CLAUDE.md. The plugin system handles discovery.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version comparison | Custom semver parser | Node.js built-in `process.versions` or string comparison | Semver comparison for "is A newer than B" is simple enough with string split+compare, but edge cases exist. For this use case (comparing two clean semver strings from npm), a simple split-compare is fine. |
| npm registry fetch | Full npm-registry-fetch client | Plain `fetch()` to `registry.npmjs.org/{pkg}/latest` | Single lightweight call, no auth needed for public package metadata |
| Directory copying | Custom recursive copy | `fs-extra` `copySync`/`copyDirSync` (already in deps) | Already using fs-extra in the project |
| CLI framework | Custom arg parser | `commander` (already in deps) | Already using commander, proven for subcommand CLIs |

**Key insight:** This phase mostly refactors existing code (install/update/uninstall paths) and adds a `publishConfig` field. The heavy lifting was done in Phases 12 and 14.

## Common Pitfalls

### Pitfall 1: First Publish Chicken-and-Egg
**What goes wrong:** Attempting to use GitHub Actions OIDC for the very first publish fails because npm requires the package to exist before Trusted Publishing can be configured.
**Why it happens:** npm's UI requires a package to exist before you can set up OIDC connections. PyPI solved this but npm has not.
**How to avoid:** First publish MUST be manual: `npm publish --provenance --access public` from a local machine with `npm login` and 2FA. After first publish, configure Trusted Publishing on npmjs.com.
**Warning signs:** Release workflow fails with 401/403 on first tag push.

### Pitfall 2: Bin Name vs Package Name Mismatch
**What goes wrong:** `bunx megazord-cli install` fails with "command not found" because the bin entry is `megazord`, not `megazord-cli`.
**Why it happens:** Both npx and bunx match binary name to package name by default. If the single bin entry has a different name, the package runner cannot find it without `--package` flag.
**How to avoid:** Add `"megazord-cli": "bin/megazord.mjs"` to the bin field in package.json.
**Warning signs:** `bunx megazord-cli` outputs an error about missing executable.

### Pitfall 3: bunx Garbage Collection
**What goes wrong:** After `bunx megazord-cli install` completes, bunx may clean up the cached package. If install only symlinked to the package directory (instead of copying), all plugin files disappear.
**Why it happens:** bunx caches packages temporarily and may garbage-collect them.
**How to avoid:** The install command must COPY all files to `~/.claude/megazord/`, not symlink or reference the npm cache.
**Warning signs:** Plugin works immediately after install but breaks after reboot or cache cleanup.

### Pitfall 4: npm Version Mismatch in release.yml
**What goes wrong:** `npm publish --provenance` requires npm >= 11.5.1 for OIDC Trusted Publishing.
**Why it happens:** Older npm versions don't support the OIDC token exchange.
**How to avoid:** Release workflow already uses Node.js 24 (which bundles npm 11). Verified in Phase 14.
**Warning signs:** 401 Unauthorized errors during CI publish.

### Pitfall 5: Repository URL Case Sensitivity for Provenance
**What goes wrong:** OIDC provenance fails because the repository owner in package.json doesn't match GitHub exactly.
**Why it happens:** npm OIDC is case-sensitive. GitHub shows `Sh3rd3n` (capital S) but the package.json may have `sh3rd3n`.
**How to avoid:** Ensure `repository.url` in package.json matches the GitHub URL exactly. Current package.json has `https://github.com/sh3rd3n/megazord.git` -- verify this matches GitHub's canonical casing.
**Warning signs:** OIDC token exchange fails with "repository mismatch" error.

### Pitfall 6: Missing `scripts/` in Plugin Copy
**What goes wrong:** After `bunx megazord-cli install`, hooks that reference `${CLAUDE_PLUGIN_ROOT}/scripts/enforce-ownership.sh` fail because `scripts/` wasn't copied to `~/.claude/megazord/`.
**Why it happens:** The current install.ts copies `.claude-plugin`, `hooks`, `skills`, `commands` but NOT `scripts/` or `agents/`.
**How to avoid:** The copy list must include ALL directories: `.claude-plugin`, `hooks`, `skills`, `commands`, `agents`, `scripts`.
**Warning signs:** PreToolUse hook errors in Claude Code console.

## Code Examples

### publishConfig Addition
```json
// In package.json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### Dual Bin Entry
```json
// In package.json
{
  "bin": {
    "megazord": "bin/megazord.mjs",
    "megazord-cli": "bin/megazord.mjs"
  }
}
```

### Manual First Publish Commands
```bash
# 1. Login to npm (requires 2FA)
npm login

# 2. Build the package
bun run build

# 3. Verify package contents
npm pack --dry-run

# 4. First publish (manual, with provenance from local machine)
npm publish --access public

# 5. Verify on registry
npm view megazord-cli

# 6. Configure Trusted Publishing on npmjs.com:
#    - Go to https://www.npmjs.com/package/megazord-cli/access
#    - Find "Publishing access" > "Trusted Publisher"
#    - Click "GitHub Actions" > "Set up connection"
#    - Fill: Owner=Sh3rd3n, Repo=megazord, Workflow=release.yml, Env=(empty)
#    - Click "Set up connection"
```

### Update Check (Lightweight Registry Fetch)
```typescript
// Source: npm registry API (https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md)
async function checkForUpdate(currentVersion: string): Promise<string | null> {
  const CHECK_FILE = join(homedir(), ".claude", "megazord", ".update-check");

  // Rate limit: once per 24 hours
  if (existsSync(CHECK_FILE)) {
    const lastCheck = parseInt(readFileSync(CHECK_FILE, "utf-8"), 10);
    if (Date.now() - lastCheck < 86_400_000) return null;
  }

  try {
    const res = await fetch("https://registry.npmjs.org/megazord-cli/latest", {
      signal: AbortSignal.timeout(3000), // 3s timeout, never block
    });
    const { version } = await res.json();
    writeFileSync(CHECK_FILE, String(Date.now()));

    return version !== currentVersion ? version : null;
  } catch {
    return null; // Network failure = silent skip
  }
}
```

### Silent Install Skeleton
```typescript
export async function install(): Promise<void> {
  const megazordDir = join(homedir(), ".claude", "megazord");

  // 1. Check Claude Code exists
  if (!existsSync(join(homedir(), ".claude"))) {
    console.log("Error: Claude Code not detected");
    process.exit(1);
  }

  // 2. Copy plugin files (atomic: copy to temp, then rename)
  const tempDir = `${megazordDir}.tmp.${Date.now()}`;
  try {
    const packageRoot = join(import.meta.dirname, "..");
    const dirsToCopy = [".claude-plugin", "hooks", "skills", "commands", "agents", "scripts"];

    mkdirSync(tempDir, { recursive: true });
    for (const dir of dirsToCopy) {
      const src = join(packageRoot, dir);
      if (existsSync(src)) copyDirSync(src, join(tempDir, dir));
    }
    writeFileSync(join(tempDir, ".version"), VERSION);

    // Atomic swap
    if (existsSync(megazordDir)) rmSync(megazordDir, { recursive: true });
    renameSync(tempDir, megazordDir);

  } catch (err) {
    // Rollback
    if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    console.log(`Error: Installation failed - ${err.message}`);
    process.exit(1);
  }

  // 3. Register with Claude Code
  registerWithClaudeCode(megazordDir);

  // 4. Output
  console.log(`Megazord v${VERSION} installed at ${megazordDir}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm tokens in CI secrets | OIDC Trusted Publishing (zero secrets) | npm 11.5.1 / 2025 | No static tokens to rotate |
| Manual `npm version` + push | Tag-triggered release workflows | Established pattern | Push tag, everything happens automatically |
| `npx` for package execution | `bunx` (100x faster, same API) | Bun 1.0+ / 2023 | Near-instant startup for CLI tools |
| Plugin files in user's `~/.claude/` | Plugin marketplace/cache system | Claude Code 1.0.33+ / 2025 | Proper isolation, namespacing, versioning |

**Deprecated/outdated:**
- `npm publish` with static automation tokens: Use OIDC Trusted Publishing instead
- `bun publish`: Does not support OIDC/provenance -- must use `npm publish` for CI

## Discretion Recommendations

### How to Make Files Visible to Claude Code
**Recommendation: Marketplace registration pointing to `~/.claude/megazord/`**

Claude Code discovers plugins via its marketplace system (`known_marketplaces.json` + `installed_plugins.json` + `settings.json`). The install command should register `~/.claude/megazord/` as the plugin install path. This is already the pattern used in the current fallback code -- just needs the path updated.

Do NOT use `--plugin-dir` (requires restarting Claude Code with flags). Do NOT use symlinks (fragile). Do NOT touch `.claude/CLAUDE.md` (invasive, user-owned file).

### Versioning Strategy
**Recommendation: Start at v1.1.0**

CHANGELOG.md already has v1.0 and v1.1 entries. The first npm publish should be v1.1.0 since this represents the distribution-ready version. Bump package.json version from 1.0.0 to 1.1.0 before first publish.

### Update Check Mechanism and Frequency
**Recommendation: Lightweight fetch, 24-hour interval, hook-triggered**

Use a SessionStart hook script that calls `https://registry.npmjs.org/megazord-cli/latest` with a 3-second timeout. Store last-check timestamp in `~/.claude/megazord/.update-check`. Display a single non-blocking line like "Update available: megazord-cli v1.2.0 (run: bunx megazord-cli update)". Never block the session.

### npm Description and Keywords
**Recommendation: Keep current, they are good**

Current description: "Claude Code framework unifying project management, code quality, and multi-agent coordination". Current keywords cover the key discovery terms. No changes needed.

### README Strategy
**Recommendation: Single README.md (already exists)**

The existing README.md from Phase 13 is comprehensive. npm will display it on the package page automatically since it's included in the `files` array (implicitly -- npm always includes README). No separate npm README needed.

## Open Questions

1. **Owner casing for Trusted Publishing**
   - What we know: GitHub shows `Sh3rd3n` (capital S), package.json has `sh3rd3n` (lowercase)
   - What's unclear: Which exact casing npm OIDC requires for the owner field
   - Recommendation: Try `Sh3rd3n` first (matches GitHub UI). If it fails, try `sh3rd3n`. Document the working value.

2. **`claude plugin` CLI availability on clean machines**
   - What we know: The fallback path (manual JSON registration) works without the `claude` CLI. The `claude` CLI is separate from Claude Code's desktop/VS Code installation.
   - What's unclear: Whether `claude` CLI is always in PATH when Claude Code is installed
   - Recommendation: Keep the try-CLI-then-fallback pattern. The fallback is robust.

3. **Plugin version field in installed_plugins.json**
   - What we know: Current code writes `VERSION` (from package.json) into the registry
   - What's unclear: Whether Claude Code uses this version field for anything (update prompts, compatibility checks)
   - Recommendation: Write the version. It costs nothing and future Claude Code versions may use it.

## Sources

### Primary (HIGH confidence)
- npm docs on publishConfig: https://docs.npmjs.com/cli/v8/configuring-npm/package-json/ -- publishConfig access and registry
- npm Trusted Publishing docs: https://docs.npmjs.com/trusted-publishers/ -- OIDC setup requirements
- Claude Code plugin docs: https://code.claude.com/docs/en/plugins -- plugin structure, --plugin-dir, marketplace system
- Claude Code discover plugins: https://code.claude.com/docs/en/discover-plugins -- marketplace add, plugin install
- bunx docs: https://bun.com/docs/pm/bunx -- bin resolution behavior, --package flag

### Secondary (MEDIUM confidence)
- npm OIDC first publish limitation: https://github.com/npm/cli/issues/8544 -- confirmed chicken-and-egg problem
- Trusted Publishing setup guide: https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/ -- step-by-step OIDC setup
- npm provenance bug with access flag: https://github.com/npm/cli/issues/7706 -- need explicit `--access public` with `--provenance`
- bunx bin resolution: https://blog.api2o.com/en/note/bun/2025/1.publish-executable-to-npm-and-bunx -- package name must match bin entry

### Tertiary (LOW confidence)
- Owner casing sensitivity: Mentioned in project's own 14-02-SUMMARY.md, needs empirical verification during publish

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all patterns verified against docs
- Architecture: HIGH -- file placement strategy is clear from CONTEXT, registration pattern is well-understood from codebase analysis
- Pitfalls: HIGH -- first-publish chicken-and-egg is well-documented, bin naming verified against bunx/npx docs
- Discretion items: MEDIUM -- recommendations are well-reasoned but some (versioning, update check) are judgment calls

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days -- stable domain, npm APIs don't change frequently)
