# Stack Research

**Domain:** Claude Code framework / npm-distributed AI developer tooling
**Researched:** 2026-02-17
**Confidence:** HIGH (core stack) / MEDIUM (some library versions evolving rapidly)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| TypeScript | ~5.8 (latest 5.x) | Language for all orchestration logic, CLI, state management | Type safety is non-negotiable for a framework others depend on. TS 5.8 has stable ESM support, erasable syntax for direct Node execution. TS 6.0 beta is out but 5.8 is the stable target. | HIGH |
| Node.js | >=22 (LTS) | Runtime requirement | Node 22 is current LTS (supported through 2027-04-30). Commander 14 requires >=20 anyway. Node 22 gives native `fs.cp()` for recursive copy, stable ESM, and is the ecosystem standard for 2026. | HIGH |
| Bun | >=1.2 | Package manager, script runner, test runner (secondary) | Per project constraint. Used for `bun install`, `bun run`, `bunx`. Not used as runtime target -- the npm package must work with Node.js since users may not have Bun. | HIGH |

### Build & Bundle

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| tsdown | ^0.20 | TypeScript bundler | Successor to tsup (which is no longer actively maintained). Built on Rolldown (Rust-based), ESM-first with proper CJS output, excellent `.d.ts` generation. From the void(0)/Vite ecosystem. Smooth migration path from tsup. | MEDIUM -- tsdown is pre-1.0 (0.20.3) but actively developed and the clear direction |
| tsc | (bundled with TS) | Type checking only | tsdown handles bundling; `tsc --noEmit` handles type-checking in CI. Separation of concerns. | HIGH |

### CLI Framework

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Commander.js | ^14.0 | CLI argument parsing, subcommands | 14.0.3 is current. 113k+ dependents, battle-tested, excellent TypeScript types, requires Node >=20. The `megazord` CLI only needs basic subcommand routing (not complex interactive prompts), which is Commander's sweet spot. | HIGH |

### Validation & Configuration

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Zod | ^4.3 | Schema validation for config files, STATE.md parsing, CLI input validation | Zod v4 is 14x faster than v3, 57% smaller core. Built-in `.toJSONSchema()`. Ecosystem dominance (every TS project uses it). For a CLI tool, bundle size is irrelevant vs. Valibot's advantage. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing from SKILL.md / agent .md files | Parsing all `.md` files with frontmatter (skills, agents, workflows). Battle-tested (used by Astro, Gatsby, VitePress, etc.). Note: original package last published 5 years ago but stable. Alternative: `@11ty/gray-matter` (2.0.1, more recent fork). | HIGH |
| picocolors | ^1.1 | Terminal color output | CLI output formatting. 7 kB vs chalk's 101 kB. Zero dependencies. Used by PostCSS, Vite, Browserslist. For a CLI tool distributed via npm, minimal footprint matters. | HIGH |
| fs-extra | ^11.0 | Filesystem operations (copy, move, mkdirs) | Installing files to `~/.claude/`. Native `fs.cp()` exists in Node 22 but fs-extra provides `ensureDir`, `copy` with filter, `move`, `remove` -- all needed for install/uninstall lifecycle. Worth the small dep for reliability. | MEDIUM |
| glob | ^11.0 | File globbing | Discovering skill/agent/workflow files in source tree during install. Native `fs.glob()` is still experimental in Node 22. | MEDIUM |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| Biome | Linting + formatting (replaces ESLint + Prettier) | v2.3 current. Single binary, 10-25x faster than ESLint+Prettier. Type-aware linting. One config file. Perfect for a new project -- no legacy ESLint config to migrate. | HIGH |
| Vitest | Unit/integration testing | v4.0.18 current. Used for testing TypeScript orchestration logic (CLI, state management, config parsing). NOT for testing .md skills (those are tested by running Claude). Bun's test runner is secondary -- Vitest has better ecosystem (mocking, coverage, watch mode). | MEDIUM -- `bun test` is simpler but Vitest has richer features |
| Changesets | Version management + changelog | Intent-based versioning. Developer writes a changeset describing the change; release PR aggregates them. Better for a single-maintainer project than semantic-release (which requires strict commit conventions). | HIGH |

## Distribution Architecture

### The Dual Distribution Problem

Megazord has two distinct artifact types that must be distributed:

1. **Markdown files** (skills, agents, workflows) -- installed to `~/.claude/` or project `.claude/`
2. **TypeScript code** (CLI, orchestration) -- compiled to JS, runs as `megazord` binary

### Recommended Approach: Claude Code Plugin + npm bin

**Primary: Claude Code Plugin format**

Structure the package as a proper Claude Code plugin:

```
megazord/
  .claude-plugin/
    plugin.json          # Plugin manifest (name, version, description)
  skills/
    mz-init/SKILL.md
    mz-plan/SKILL.md
    mz-go/SKILL.md
    mz-quick/SKILL.md
    mz-review/SKILL.md
    mz-debug/SKILL.md
    mz-verify/SKILL.md
    mz-discuss/SKILL.md
    mz-pause/SKILL.md
    mz-resume/SKILL.md
    mz-status/SKILL.md
    mz-map/SKILL.md
  agents/
    mz-executor.md
    mz-planner.md
    mz-reviewer.md
    mz-debugger.md
    mz-verifier.md
    mz-researcher.md
  hooks/
    hooks.json           # Hook definitions for commit quality, etc.
  bin/
    megazord.mjs         # Compiled CLI entrypoint
  dist/
    index.mjs            # Compiled orchestration library
    index.d.mts          # Type declarations
```

**Why plugin format over GSD's approach:**
- GSD copies files to `~/.claude/` via a postinstall script -- this is fragile, creates version conflicts, and makes uninstall messy
- Claude Code's native plugin system (`--plugin-dir`, marketplace install) handles discovery, namespacing (`/megazord:init`), and lifecycle
- Plugin skills get namespaced (`/megazord:go` not `/go`), preventing conflicts with other frameworks
- Users can install via marketplace OR `--plugin-dir` for local dev

**Secondary: npm bin for orchestration CLI**

The `megazord` CLI (state management, team orchestration, context tools) is distributed as a normal npm binary:

```json
{
  "bin": { "megazord": "bin/megazord.mjs" },
  "type": "module"
}
```

Skills invoke this CLI via `!`megazord state read`` (dynamic context injection) or `Bash(megazord *)` (allowed-tools).

### package.json Shape

```json
{
  "name": "megazord",
  "version": "0.1.0",
  "type": "module",
  "description": "Claude Code framework unifying project management, code quality, and multi-agent coordination",
  "license": "MIT",
  "engines": { "node": ">=22" },
  "bin": { "megazord": "bin/megazord.mjs" },
  "main": "dist/index.mjs",
  "types": "dist/index.d.mts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.mts"
    }
  },
  "files": [
    "dist",
    "bin",
    "skills",
    "agents",
    "hooks",
    ".claude-plugin"
  ]
}
```

## Installation

```bash
# Core dependencies
bun add commander@^14 zod@^4 gray-matter@^4 picocolors@^1 fs-extra@^11 glob@^11

# Dev dependencies
bun add -D typescript@~5.8 tsdown@^0.20 vitest@^4 @biomejs/biome@^2.3 @changesets/cli@^2
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| tsdown | tsup (^8.5) | tsup is no longer actively maintained. tsdown is its spiritual successor from the Rolldown/Vite ecosystem, built on Rust, ESM-first. Migration is smooth (similar config). |
| tsdown | tsc only (no bundler) | tsc emits verbose output, no tree-shaking, no bundling. A CLI tool benefits from single-file output. |
| Commander.js | citty / clerc / yargs | Yargs has inferior TS types. Citty and Clerc are newer with smaller ecosystems. Commander has 113k dependents and proven stability. For ~12 subcommands, Commander is the right weight class. |
| Zod | Valibot | Valibot is 90% smaller in bundle size -- irrelevant for a CLI (not browser). Zod v4 closed the performance gap. Zod's ecosystem (integration with everything) and developer familiarity are decisive for adoption. |
| Biome | ESLint + Prettier | For a greenfield project in 2026, there is no reason to set up 4+ config files and 127+ npm packages when Biome does the same thing in one binary, 25x faster. Biome v2.3 covers ~85% of typescript-eslint rules. |
| Vitest | bun test | `bun test` is faster but lacks Vitest's mocking, coverage reporting, watch mode with HMR, and IDE integration. For a framework that enforces TDD, the test runner needs to be feature-rich. |
| Vitest | Jest | Jest requires babel/ts-jest transforms, slower startup, no native ESM. Vitest is the 2026 standard for TS projects. |
| gray-matter | Custom YAML parser | gray-matter handles edge cases (TOML, JSON frontmatter, custom delimiters) that a hand-rolled parser would miss. The entire Claude Code skill ecosystem uses this format. |
| Changesets | semantic-release | semantic-release requires strict commit message conventions (Conventional Commits). Changesets is more flexible -- you write a changeset per PR, not per commit. Better for solo/small team workflows. |
| picocolors | chalk | Chalk 5 is ESM-only (good) but 14x larger. For a CLI that prints status messages, picocolors covers 100% of needs at 1/14th the size. |
| fs-extra | native fs.cp | native `fs.cp()` handles recursive copy but fs-extra adds `ensureDir`, `move`, `remove`, `pathExists` -- all needed for install/uninstall lifecycle. Worth one dependency. |
| Plugin format | GSD-style postinstall copy | Claude Code has a native plugin system now. Postinstall scripts that copy to `~/.claude/` are fragile (path issues, permission errors, no uninstall, version conflicts). Plugin format is the official distribution path. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| npm / npx / yarn / pnpm | Project constraint: always use bun | `bun`, `bunx` |
| tsup | No longer actively maintained (2025). ESM support has holes. | tsdown (same API shape, Rust-based, actively maintained) |
| Jest | Requires transforms for TS/ESM, slow startup, heavy config | Vitest (native ESM, zero-config for TS) |
| ESLint + Prettier | 4+ config files, 127+ npm packages, slow. Outdated approach for greenfield 2026 projects. | Biome (single binary, single config, 25x faster) |
| chalk | 101 kB for terminal colors in a CLI. Overkill. | picocolors (7 kB, same API surface needed) |
| postinstall copy scripts | Fragile cross-platform, no uninstall story, path resolution bugs with different package managers | Claude Code plugin format (native discovery, namespace, lifecycle) |
| Webpack / Rollup directly | Over-engineered for a library/CLI bundle. Requires extensive config. | tsdown (zero-config, purpose-built for libraries) |
| CJS-only package | ESM is the standard. CJS causes issues with modern tooling. | ESM-first (`"type": "module"`) with CJS shim only if needed |
| Agent Teams for everything | Agent Teams are experimental, high token cost, coordination overhead | Hybrid: Agent Teams for coordination-heavy work, subagents (Task tool) for fire-and-forget |

## Stack Patterns by Variant

**If Agent Teams proves too unstable (experimental feature):**
- Fall back to Task tool (subagent) orchestration only
- Skills still work identically
- The TS orchestration layer becomes the coordinator (like GSD's approach)
- Agent-to-agent communication simulated via file system (STATE.md pattern)

**If distributing as plugin is blocked (marketplace requirements):**
- Fall back to GSD-style `bin/install.js` that copies to `~/.claude/`
- Use `megazord install` CLI command instead of postinstall
- Explicit `megazord uninstall` for cleanup
- Less elegant but works everywhere

**If tsdown 0.x proves too unstable:**
- Fall back to tsup ^8.5 (still works, just not maintained)
- Or use tsc + a simple esbuild script for bundling
- tsdown API is compatible with tsup, so switching is trivial

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| TypeScript ~5.8 | tsdown ^0.20 | tsdown uses its own TS transforms; project tsc is for type-checking only |
| Commander ^14 | Node >=20 | Commander 14 dropped Node 18 support |
| Zod ^4.3 | TypeScript >=5.0 | Zod v4 has full TS 5.x support |
| Vitest ^4.0 | Node >=22, TypeScript ~5.8 | Vitest 4 requires modern Node |
| Biome ^2.3 | TypeScript (built-in parser) | Biome has its own TS parser, no tsc dependency |
| tsdown ^0.20 | Node >=18, Rolldown (bundled) | Rolldown is bundled inside tsdown, not a peer dep |
| gray-matter ^4.0 | Node >=6 (very permissive) | Stable, no breaking changes expected |

## Key Architectural Decision: Plugin vs. Standalone

The most consequential stack decision is **distributing as a Claude Code plugin** rather than GSD's approach of copying files to `~/.claude/`.

**Evidence supporting plugin format:**
- Official Claude Code docs (2026-02-17) explicitly describe the plugin system with `plugin.json`, namespaced skills, `--plugin-dir` for dev, and marketplace distribution
- Plugin skills are namespaced (`/megazord:go`), preventing conflicts with GSD, Superpowers, or other frameworks
- Plugins support agents, hooks, MCP servers, and LSP servers in one package
- Plugin lifecycle is managed by Claude Code itself (install, update, uninstall)
- The `--plugin-dir` flag enables local development without installation

**Risk:**
- Plugin marketplace is relatively new
- Users must install the plugin (not just `bunx megazord`)
- Plugin system may evolve in breaking ways

**Mitigation:**
- Support both: `bunx megazord install` as CLI fallback + plugin format for native integration
- The file structure is compatible with both approaches (skills/, agents/ directories work standalone or as plugin)

## Sources

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- Official docs, verified 2026-02-17 (HIGH confidence)
- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams) -- Official docs, verified 2026-02-17 (HIGH confidence)
- [Claude Code Plugins Documentation](https://code.claude.com/docs/en/plugins) -- Official docs, verified 2026-02-17 (HIGH confidence)
- [tsdown documentation](https://tsdown.dev/guide/) -- Official site (MEDIUM confidence, pre-1.0)
- [tsup npm page](https://www.npmjs.com/package/tsup) -- v8.5.1, confirmed no longer actively maintained (HIGH confidence)
- [Commander.js npm page](https://www.npmjs.com/package/commander) -- v14.0.3 (HIGH confidence)
- [Zod v4 release notes](https://zod.dev/v4) -- v4.3.6 (HIGH confidence)
- [Vitest npm page](https://www.npmjs.com/package/vitest) -- v4.0.18 (HIGH confidence)
- [Biome migration guide](https://biomejs.dev/guides/migrate-eslint-prettier/) -- v2.3 (HIGH confidence)
- [Changesets documentation](https://changesets-docs.vercel.app/) -- (HIGH confidence)
- [Node.js releases](https://nodejs.org/en/about/previous-releases) -- Node 22 LTS through 2027 (HIGH confidence)
- [TypeScript 5.8 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) -- (HIGH confidence)
- [GSD package.json](https://github.com/gsd-build/get-shit-done/blob/main/package.json) -- v1.20.3, reference implementation (HIGH confidence)
- [gray-matter npm page](https://www.npmjs.com/package/gray-matter) -- v4.0.3 (HIGH confidence)
- [picocolors npm page](https://www.npmjs.com/package/picocolors) -- v1.1.1 (HIGH confidence)
- [TypeScript in 2025 ESM/CJS publishing](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) -- ESM-first best practices (MEDIUM confidence)
- [tsdown migration from tsup](https://tsdown.dev/guide/migrate-from-tsup) -- Official migration guide (MEDIUM confidence)
- [Switching from tsup to tsdown](https://alan.norbauer.com/articles/tsdown-bundler/) -- Real-world migration report (MEDIUM confidence)

---
*Stack research for: Claude Code framework (Megazord)*
*Researched: 2026-02-17*
