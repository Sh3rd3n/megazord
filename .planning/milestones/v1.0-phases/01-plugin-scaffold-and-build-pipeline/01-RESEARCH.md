# Phase 1: Plugin Scaffold and Build Pipeline - Research

**Researched:** 2026-02-17
**Domain:** Claude Code plugin system, npm distribution, TypeScript bundling, context budget management
**Confidence:** HIGH

## Summary

Phase 1 establishes Megazord as a working Claude Code plugin that installs via `bunx megazord`, registers skills under the `/mz:` namespace, coexists with GSD and Superpowers, and stays within a 15% context budget. The technical path is well-documented: Claude Code's plugin system provides native namespacing, automatic component discovery, and a caching layer that copies plugin files to `~/.claude/plugins/cache/`. The `bunx megazord` command acts as a setup script that creates a self-hosted marketplace and installs the plugin programmatically. The TypeScript CLI (`mz-tools`) is built with tsdown and provides state management, config parsing, and git operations that pure Markdown skills cannot handle.

The verified Superpowers plugin (v4.3.0, installed on this machine) confirms the plugin structure: `.claude-plugin/plugin.json` at root, `skills/` directories with `SKILL.md` files, `agents/` with `.md` files, `hooks/hooks.json` with shell scripts, and `commands/` as a legacy alternative. Skill descriptions consume context budget at 2% of the context window (default fallback: 16,000 characters). With ~12 skills, each description averaging ~100-150 characters, Megazord's skill catalog would consume roughly 1,200-1,800 characters of the budget -- well within limits. The main context risk comes from SessionStart hooks that inject content (Superpowers injects its entire `using-superpowers` skill via SessionStart hook), which Megazord should avoid.

**Primary recommendation:** Build as a Claude Code plugin with a self-hosted npm marketplace. The `bunx megazord` command creates the marketplace, installs the plugin, and verifies coexistence -- all in one interactive flow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Installation flow
- `bunx megazord` triggers an interactive setup focused on **installation only** (not project configuration -- that's `/mz:init` in Phase 2)
- Interactive prompts cover: install location confirmation, existing plugin detection, installation verification
- If already installed: prompt asking whether to update, reinstall, or uninstall
- Feedback: minimal with spinner -- short messages ("Installing...", "Done!"), no step-by-step details

#### Skill naming scheme
- All slash commands use the `/mz:` prefix -- short and fast to type
- No alias shortcuts -- full names only (`/mz:status`, not `/mz:s`) for clarity
- `/mz:help` provides a complete listing of all skills with descriptions and usage examples

#### Coexistence strategy
- **Megazord is the successor to GSD and Superpowers** -- coexistence is a temporary migration state, not permanent
- During migration: each plugin keeps its own namespace (`/mz:plan` and `/gsd:plan` both exist)
- Megazord is **completely standalone** -- zero dependencies on other plugins, all functionality self-contained
- No namespace conflicts: `/mz:` prefix ensures no collisions with `/gsd:` or `/superpowers:`

#### CLI output style
- Tone: friendly and informative -- like Vercel CLI or Railway, not dry like git
- Emoji: yes, with moderation -- for section headers and status indicators, not excessive
- Colors: yes -- green/success, red/error, yellow/warning, cyan/info

### Claude's Discretion
- Skill grouping strategy (flat vs sub-namespace under `/mz:`)
- Auto-detection of existing plugins during install
- Redundancy warnings when GSD/Superpowers have overlapping skills
- Plugin manifest format (standard Claude Code + any extensions needed)
- Context budget loading strategy (eager vs lazy skill loading)
- Error message format (with/without suggested actions)
- Migration tooling from GSD config (whether to offer import)
- Project directory choice (`.planning/` reuse vs separate directory)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-01 | Framework distributed as Claude Code plugin with `plugin.json` manifest and namespaced skills (`/mz:command`) | Verified: Claude Code plugin system provides automatic namespacing via `plugin.json` `name` field. Superpowers confirmed as reference implementation at `~/.claude/plugins/cache/claude-plugins-official/superpowers/4.3.0/`. Plugin name "megazord" yields `/mz:command` when skills are named `command/SKILL.md`. **Note:** The plugin `name` field in `plugin.json` determines the namespace prefix. Setting `"name": "mz"` produces `/mz:command`. |
| DIST-03 | npm fallback installation via `bunx megazord` for environments without plugin marketplace | Verified: Claude Code supports npm plugin sources in marketplace.json (`"source": {"source": "npm", "package": "megazord"}`). The `bunx megazord` command runs a setup script that: (1) creates a local marketplace pointing to the npm package, (2) runs `claude plugin install megazord@megazord-marketplace`, (3) verifies installation. Alternatively, the setup script can use `--plugin-dir` to point directly at the npm package directory for dev mode. |
| DIST-04 | Plugin coexists safely with other installed frameworks (no conflicts with GSD, Superpowers) | Verified: Claude Code's plugin namespacing prevents skill collisions. Superpowers uses `superpowers:` prefix, GSD uses `gsd:` prefix (via `~/.claude/commands/gsd/`), Megazord uses `mz:` prefix. Confirmed on this machine: both GSD (commands in `~/.claude/commands/gsd/`) and Superpowers (plugin v4.3.0) are installed simultaneously without conflicts. Megazord adds a third namespace with zero overlap. |
| DIST-05 | TypeScript orchestration CLI (`mz-tools`) compiled and bundled for state management, git operations, config parsing | Verified: tsdown v0.20.3 bundles TypeScript to single-file ESM output. Commander.js v14 provides CLI subcommand routing. Zod v4.3 validates config schemas. The compiled CLI is included in the npm package's `bin/` directory and called from skills via `Bash` tool. |
| PROJ-12 | Framework overhead stays under 15% of context window at session start | Verified: Skill descriptions consume context at 2% of context window (fallback: 16,000 chars). With Opus 4.6's context window, that's approximately 20,000 characters for skill descriptions. ~12 Megazord skills at ~150 chars each = ~1,800 chars -- well within budget. Key risk: SessionStart hooks that inject content (Superpowers injects ~2KB via hook). Megazord should NOT use SessionStart for content injection. Lazy loading via skill invocation keeps overhead near zero at session start. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.8 | Language for CLI and orchestration logic | Type safety for a framework others depend on. TS 5.8 is current stable. |
| Node.js | >=22 | Runtime requirement | Node 22 LTS (through 2027-04-30). Commander 14 requires >=20. |
| Bun | >=1.2 | Package manager and script runner | Per project constraint. `bun install`, `bun run`, `bunx`. |

### Build & Distribution

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsdown | ^0.20 | TypeScript bundler (ESM output) | Successor to tsup, built on Rolldown (Rust). ESM-first, single-file output for CLI. Pre-1.0 but actively maintained. |
| tsc | (bundled) | Type checking only | `tsc --noEmit` for CI. tsdown handles bundling. |

### CLI Framework

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Commander.js | ^14.0 | CLI argument parsing and subcommands | 113k+ dependents. Excellent TS types. Requires Node >=20. |
| picocolors | ^1.1 | Terminal color output | 7 kB. Zero deps. Used by PostCSS, Vite. |
| ora | ^8.0 | Terminal spinner | Lightweight spinner for installation feedback. ESM-only. |

### Validation

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | ^4.3 | Schema validation for config and CLI input | 14x faster than v3. Built-in `.toJSONSchema()`. Ecosystem standard. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | ^11.0 | Filesystem operations (ensureDir, copy, remove) | Plugin installation file operations. |
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Parsing SKILL.md and agent .md files during validation. |

### Development

| Tool | Version | Purpose | Notes |
|------|---------|-------|-------|
| Biome | ^2.3 | Linting + formatting | Single binary, 25x faster than ESLint+Prettier. |
| Vitest | ^4.0 | Unit testing | Rich mocking, coverage, watch mode. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsdown | tsup ^8.5 | tsup no longer actively maintained. tsdown migration is smooth. Fall back to tsup if tsdown 0.x proves unstable. |
| picocolors | chalk ^5 | chalk is 14x larger. For status messages, picocolors covers 100% of needs. |
| ora | nanospinner | ora is more mature with broader adoption. nanospinner is lighter but less feature-rich. |
| Commander.js | citty / yargs | Yargs has inferior TS types. Citty has smaller ecosystem. Commander is proven for ~12 subcommands. |

**Installation:**
```bash
# Core dependencies
bun add commander@^14 zod@^4 picocolors@^1 ora@^8 fs-extra@^11 gray-matter@^4

# Dev dependencies
bun add -D typescript@~5.8 tsdown@^0.20 vitest@^4 @biomejs/biome@^2.3
```

## Architecture Patterns

### Recommended Project Structure

```
megazord/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest: name "mz", version, description
│
├── skills/                      # All skill directories (auto-discovered)
│   ├── help/
│   │   └── SKILL.md             # /mz:help -- skill catalog with descriptions
│   ├── init/
│   │   └── SKILL.md             # /mz:init -- stub: "Phase 2 will implement this"
│   ├── plan/
│   │   └── SKILL.md             # /mz:plan -- stub
│   ├── go/
│   │   └── SKILL.md             # /mz:go -- stub
│   ├── status/
│   │   └── SKILL.md             # /mz:status -- stub
│   ├── pause/
│   │   └── SKILL.md             # /mz:pause -- stub
│   ├── resume/
│   │   └── SKILL.md             # /mz:resume -- stub
│   ├── quick/
│   │   └── SKILL.md             # /mz:quick -- stub
│   ├── review/
│   │   └── SKILL.md             # /mz:review -- stub
│   ├── debug/
│   │   └── SKILL.md             # /mz:debug -- stub
│   ├── verify/
│   │   └── SKILL.md             # /mz:verify -- stub
│   ├── discuss/
│   │   └── SKILL.md             # /mz:discuss -- stub
│   └── map/
│       └── SKILL.md             # /mz:map -- stub
│
├── agents/                      # Subagent definitions (auto-discovered)
│   └── (empty in Phase 1, agents added in later phases)
│
├── hooks/
│   └── hooks.json               # Empty/minimal hooks for Phase 1
│
├── src/                         # TypeScript source for CLI
│   ├── cli/
│   │   ├── index.ts             # CLI entry point (commander setup)
│   │   ├── commands/
│   │   │   ├── install.ts       # bunx megazord install logic
│   │   │   ├── uninstall.ts     # bunx megazord uninstall logic
│   │   │   ├── version.ts       # bunx megazord --version
│   │   │   └── help.ts          # bunx megazord help
│   │   └── utils/
│   │       ├── detect-plugins.ts    # Detect GSD/Superpowers installations
│   │       ├── marketplace.ts       # Create/manage local marketplace
│   │       ├── spinner.ts           # Ora wrapper with project style
│   │       └── colors.ts            # Picocolors wrapper with project palette
│   └── lib/
│       ├── config.ts            # Config schema (Zod) and parsing
│       ├── state.ts             # STATE.md read/write helpers
│       └── paths.ts             # Path resolution for plugin, project, etc.
│
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json         # Self-hosted marketplace for npm source
│
├── bin/
│   └── megazord.mjs             # Compiled CLI entry point
│
├── dist/
│   └── (compiled output from tsdown)
│
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── biome.json
└── README.md
```

### Pattern 1: Plugin Name Determines Namespace Prefix

**What:** The `name` field in `.claude-plugin/plugin.json` determines the slash command prefix. Setting `"name": "mz"` means all skills become `/mz:skill-name`.

**When to use:** Always. This is how Claude Code plugins work.

**Critical detail:** The plugin name must be `"mz"`, NOT `"megazord"`. If the plugin name were `"megazord"`, skills would be `/megazord:init` -- too long. The npm package name is `megazord`, but the plugin name is `mz`.

**Example:**
```json
// .claude-plugin/plugin.json
{
  "name": "mz",
  "version": "0.1.0",
  "description": "Unified framework for project management, code quality, and multi-agent coordination",
  "author": {
    "name": "Megazord"
  },
  "homepage": "https://github.com/megazord/megazord",
  "repository": "https://github.com/megazord/megazord",
  "license": "MIT",
  "keywords": ["project-management", "code-quality", "agent-teams", "tdd", "workflow"]
}
```
**Source:** Verified against Claude Code plugins reference (https://code.claude.com/docs/en/plugins-reference) -- "This name is used for namespacing components."

### Pattern 2: Skill Stubs for Future Phases

**What:** Phase 1 registers all ~12 skills as stub SKILL.md files that inform the user the skill is not yet implemented. This ensures the full skill catalog is discoverable via `/mz:help` from day one, and the context budget can be measured with all skills present.

**When to use:** For skills not implemented until Phases 2-8.

**Example:**
```yaml
---
name: init
description: Initialize a Megazord project with configuration and planning structure
disable-model-invocation: true
---

# /mz:init

This skill will be available in a future update.

**What it will do:** Create `.planning/` directory with PROJECT.md, STATE.md, and `megazord.config.json` with your preferred quality and workflow settings.

**Current status:** Phase 2 (not yet implemented)
```

**Rationale:** Stub skills with `disable-model-invocation: true` prevent Claude from trying to use them, but they still appear in `/mz:help` and count against the context budget -- enabling accurate measurement for PROJ-12.

### Pattern 3: bunx Setup Script Pattern

**What:** The `bunx megazord` command runs a TypeScript CLI that handles plugin installation interactively. It does NOT use npm postinstall scripts (fragile, non-interactive). Instead, the `bin` entry in package.json points to a compiled CLI.

**When to use:** For first-time installation and updates.

**Flow:**
```
User runs: bunx megazord
    |
    v
CLI starts (Commander.js)
    |
    v
Detect environment:
  - Claude Code installed? (check for 'claude' binary)
  - Existing plugins? (check ~/.claude/plugins/installed_plugins.json)
  - GSD installed? (check ~/.claude/commands/gsd/)
  - Superpowers installed? (check enabled plugins in settings.json)
    |
    v
Interactive prompts:
  - "Install Megazord?" / "Update?" / "Reinstall?" / "Uninstall?"
  - If GSD/Superpowers detected: info message about coexistence
    |
    v
Installation:
  Option A: Create local marketplace + claude plugin install
  Option B: Use --plugin-dir to register the npm package directory
  Option C: Copy plugin files to a known directory + register
    |
    v
Verification:
  - Check plugin appears in installed_plugins.json
  - Check /mz:help is accessible
  - Print success message
```

**Recommendation for Installation Mechanism:** Use Option A (local marketplace). The `bunx megazord` CLI creates a `~/.claude/marketplaces/megazord/` directory with a `marketplace.json` that points to the npm package via `"source": {"source": "npm", "package": "megazord"}`, then runs `claude plugin install mz@megazord-marketplace`. This leverages Claude Code's native plugin lifecycle (caching, updates, uninstall) rather than reinventing it.

**Confidence: MEDIUM** -- The npm source type is documented in the marketplace schema but less commonly used than GitHub sources. Needs validation during implementation. Fallback: copy plugin directory to `~/.claude/plugins/cache/` manually and register in `installed_plugins.json`.

### Pattern 4: Minimal SessionStart Footprint

**What:** Do NOT inject skill content via SessionStart hooks (like Superpowers does). Instead, rely on Claude Code's native skill description loading and let skills load on-demand when invoked.

**When to use:** Always. This is critical for PROJ-12.

**Why:** Superpowers uses a SessionStart hook to inject its entire `using-superpowers` skill (~2KB) into every session's context. This works for a single plugin but does not scale. Megazord should have zero SessionStart content injection. Skill descriptions (loaded natively by Claude Code at 2% of context budget) are sufficient for discoverability.

**Measured budget impact:**
- 12 skill descriptions at ~150 chars each = ~1,800 chars
- 2% of Opus 4.6 context = ~20,000 chars available for skill descriptions
- Megazord consumes ~9% of the skill description budget
- With other plugins (Superpowers ~14 skills, commit-commands, etc.), total might reach ~60-70% of budget
- Well within the 15% overall context overhead target

### Anti-Patterns to Avoid

- **Anti-pattern: SessionStart content injection.** Superpowers injects skill content via SessionStart hook. This adds ~2KB to EVERY session. Megazord must not do this. Instead, use `disable-model-invocation: true` on stubs and rely on native skill loading.

- **Anti-pattern: Postinstall scripts for plugin installation.** GSD uses npm postinstall to copy files to `~/.claude/`. This is fragile (permissions, path issues, no interactive prompts). Use `bunx` CLI with explicit user interaction instead.

- **Anti-pattern: Plugin name same as package name.** If plugin.json has `"name": "megazord"`, skills become `/megazord:init` (12 chars to type). Use `"name": "mz"` for `/mz:init` (8 chars).

- **Anti-pattern: Agents in Phase 1.** No agents should be defined yet. Agent definitions add to context budget without providing value until execution skills exist (Phase 4+).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin installation lifecycle | Custom file copy to `~/.claude/` | Claude Code's `claude plugin install` command | Native caching, versioning, update detection, uninstall support |
| CLI argument parsing | Manual `process.argv` parsing | Commander.js ^14 | Battle-tested, TS types, help generation, subcommand routing |
| Config validation | Manual if/else checks | Zod ^4.3 schemas | Type inference, error messages, JSON schema generation |
| Terminal colors | ANSI escape sequences | picocolors ^1.1 | Cross-platform, auto-detects color support |
| Terminal spinners | Custom console.log animations | ora ^8.0 | Handles terminal width, cleanup on exit, color integration |
| Frontmatter parsing | Regex on YAML headers | gray-matter ^4.0 | Handles edge cases (TOML, JSON, custom delimiters) |
| TypeScript bundling | tsc emit + manual bundling | tsdown ^0.20 | Single-file output, tree-shaking, declaration files |
| Skill namespacing | Custom prefix logic | Claude Code plugin system `name` field | Native, automatic, conflict-free |

**Key insight:** Claude Code's plugin system handles most of the hard problems (namespacing, discovery, caching, lifecycle). The installer's job is to get the plugin registered correctly, not to reimplement plugin management.

## Common Pitfalls

### Pitfall 1: Context Budget Blown by SessionStart Hook
**What goes wrong:** A SessionStart hook injects framework content into every session, consuming context before the user types anything. Superpowers does this with ~2KB of content.
**Why it happens:** Desire to have the framework "always available" without explicit invocation.
**How to avoid:** No SessionStart content injection. Zero framework overhead at session start beyond native skill description loading (~1,800 chars). Skills load on-demand only when invoked.
**Warning signs:** Running `/context` shows Megazord consuming significant space. Sessions feel slower. Claude starts ignoring framework instructions.

### Pitfall 2: Plugin Name vs Package Name Confusion
**What goes wrong:** Setting `"name": "megazord"` in plugin.json makes all skills long: `/megazord:init`, `/megazord:status`, etc.
**Why it happens:** Natural assumption that plugin name should match npm package name.
**How to avoid:** Set `"name": "mz"` in plugin.json. The npm package is `megazord` but the plugin is `mz`. This is the same pattern as Superpowers (npm: `superpowers`, plugin name: `superpowers` -- they chose to keep them the same, but they have short names).
**Warning signs:** Users complaining about long command names. Typing friction.

### Pitfall 3: GSD Namespace Collision in ~/.claude/commands/
**What goes wrong:** GSD installs commands in `~/.claude/commands/gsd/` as standalone commands (not a plugin). If Megazord tried to use `~/.claude/commands/mz/`, there's no plugin namespacing -- both would be at the global level.
**Why it happens:** Mixing the plugin system with the legacy commands system.
**How to avoid:** Megazord MUST be a plugin (`.claude-plugin/plugin.json`), not standalone commands. This ensures the `mz:` prefix is applied automatically by Claude Code. GSD's `gsd:` prefix is applied via the `commands/gsd/` directory name convention, which is a different mechanism.
**Warning signs:** Skills appearing without the `mz:` prefix. Skills conflicting with other installed commands.

### Pitfall 4: bunx Postinstall Script Failures
**What goes wrong:** Bun doesn't run postinstall scripts by default for security. If the plugin relies on npm postinstall to set up files, installation silently fails.
**Why it happens:** Bun security model differs from npm/yarn.
**How to avoid:** Never use postinstall scripts. The `bunx megazord` command IS the installer -- it runs explicitly, not implicitly. The `bin` entry in package.json ensures the CLI runs when `bunx megazord` is invoked.
**Warning signs:** Users report "bunx megazord" succeeds but the plugin isn't installed.

### Pitfall 5: Skill Stubs Loading Full Content
**What goes wrong:** Stub skills without `disable-model-invocation: true` get loaded by Claude when it thinks they might be relevant, consuming context for non-functional skills.
**Why it happens:** Default skill behavior is for Claude to load them automatically based on task context.
**How to avoid:** All stub skills MUST have `disable-model-invocation: true` in frontmatter. Only `/mz:help` should be model-invocable in Phase 1 (so Claude can suggest it to users asking about Megazord).
**Warning signs:** Claude attempting to use `/mz:plan` or `/mz:go` before those skills are implemented.

### Pitfall 6: Plugin Cache Invalidation on Update
**What goes wrong:** User runs `bunx megazord` to update, but Claude Code serves the cached old version from `~/.claude/plugins/cache/`.
**Why it happens:** Claude Code caches plugins by version. If the npm package version wasn't bumped, the cache thinks it's current.
**How to avoid:** Always bump version in plugin.json when publishing updates. The installer should explicitly run `claude plugin update mz@megazord-marketplace` which forces re-download. Clear instructions to users.
**Warning signs:** Users report changes aren't taking effect after update.

## Code Examples

### plugin.json Manifest
```json
// .claude-plugin/plugin.json
// Source: verified against Superpowers v4.3.0 manifest + Claude Code plugins-reference docs
{
  "name": "mz",
  "version": "0.1.0",
  "description": "Unified framework for project management, code quality, and multi-agent coordination",
  "author": {
    "name": "Megazord"
  },
  "homepage": "https://github.com/megazord/megazord",
  "repository": "https://github.com/megazord/megazord",
  "license": "MIT",
  "keywords": ["project-management", "code-quality", "agent-teams", "tdd", "workflow"]
}
```

### Skill SKILL.md (help - functional)
```yaml
---
name: help
description: Show all available Megazord skills with descriptions and usage examples
disable-model-invocation: false
---

# Megazord Help

Display the complete skill reference for Megazord.

## Available Skills

| Skill | Description | Status |
|-------|-------------|--------|
| `/mz:help` | Show this help listing | Available |
| `/mz:init` | Initialize project with config and planning structure | Coming soon |
| `/mz:plan` | Plan a phase into tasks with dependencies | Coming soon |
| `/mz:go` | Execute the current phase plan | Coming soon |
| `/mz:status` | Show project progress and next actions | Coming soon |
| `/mz:pause` | Save context for session handoff | Coming soon |
| `/mz:resume` | Restore context from previous session | Coming soon |
| `/mz:quick` | Run a quick task without project ceremony | Coming soon |
| `/mz:review` | Two-stage code review (spec + quality) | Coming soon |
| `/mz:debug` | Systematic four-phase debugging | Coming soon |
| `/mz:verify` | Verify phase deliverables match criteria | Coming soon |
| `/mz:discuss` | Socratic brainstorming before implementation | Coming soon |
| `/mz:map` | Analyze existing codebase for brownfield support | Coming soon |

## About Megazord

Megazord unifies project management, code quality discipline, and multi-agent coordination into one Claude Code framework.

**Version:** 0.1.0
**Phase:** 1 of 8 (Plugin Scaffold and Build Pipeline)
```

### Skill SKILL.md (stub template)
```yaml
---
name: init
description: Initialize a Megazord project with configuration and planning structure
disable-model-invocation: true
---

# /mz:init

This skill is not yet available. It will be implemented in Phase 2.

**What it will do:** Create `.planning/` directory with PROJECT.md, STATE.md, and `megazord.config.json` with your preferred quality and workflow settings.

Run `/mz:help` to see all available skills and their status.
```

### CLI Entry Point (src/cli/index.ts)
```typescript
// Source: Commander.js v14 docs + project conventions
import { Command } from "commander";
import { version } from "../../package.json";

const program = new Command()
  .name("megazord")
  .description("Megazord CLI - install and manage the Megazord plugin")
  .version(version);

program
  .command("install")
  .description("Install Megazord as a Claude Code plugin")
  .action(async () => {
    // Import dynamically to keep startup fast
    const { install } = await import("./commands/install.js");
    await install();
  });

program
  .command("uninstall")
  .description("Remove Megazord plugin")
  .action(async () => {
    const { uninstall } = await import("./commands/uninstall.js");
    await uninstall();
  });

program
  .command("version")
  .description("Show installed version")
  .action(() => {
    console.log(version);
  });

// Default action (no subcommand) = install
program.action(async () => {
  const { install } = await import("./commands/install.js");
  await install();
});

program.parse();
```

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
  "files": [
    "bin",
    "dist",
    "skills",
    "agents",
    "hooks",
    ".claude-plugin"
  ],
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "commander": "^14.0.0",
    "zod": "^4.3.0",
    "picocolors": "^1.1.0",
    "ora": "^8.0.0",
    "fs-extra": "^11.0.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "typescript": "~5.8.0",
    "tsdown": "^0.20.0",
    "vitest": "^4.0.0",
    "@biomejs/biome": "^2.3.0",
    "@types/fs-extra": "^11.0.0",
    "@types/node": "^22.0.0"
  }
}
```

### tsdown.config.ts
```typescript
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  outDir: "bin",
  format: "esm",
  clean: true,
  dts: false, // CLI doesn't need declaration files
  banner: { js: "#!/usr/bin/env node" },
  external: ["commander", "zod", "picocolors", "ora", "fs-extra", "gray-matter"],
});
```

### Plugin Detection Utility
```typescript
// src/cli/utils/detect-plugins.ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface PluginDetectionResult {
  claudeCodeInstalled: boolean;
  gsdInstalled: boolean;
  superpowersInstalled: boolean;
  megazordInstalled: boolean;
  existingPlugins: string[];
}

export function detectPlugins(): PluginDetectionResult {
  const claudeDir = join(homedir(), ".claude");
  const settingsPath = join(claudeDir, "settings.json");
  const installedPath = join(claudeDir, "plugins", "installed_plugins.json");
  const gsdCommandsDir = join(claudeDir, "commands", "gsd");

  const result: PluginDetectionResult = {
    claudeCodeInstalled: existsSync(claudeDir),
    gsdInstalled: existsSync(gsdCommandsDir),
    superpowersInstalled: false,
    megazordInstalled: false,
    existingPlugins: [],
  };

  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
      const enabled = settings.enabledPlugins ?? {};
      result.existingPlugins = Object.keys(enabled).filter(k => enabled[k]);
      result.superpowersInstalled = result.existingPlugins.some(p =>
        p.includes("superpowers")
      );
    } catch {
      // Corrupted settings, proceed without detection
    }
  }

  if (existsSync(installedPath)) {
    try {
      const installed = JSON.parse(readFileSync(installedPath, "utf-8"));
      const plugins = installed.plugins ?? {};
      result.megazordInstalled = Object.keys(plugins).some(k =>
        k.startsWith("mz@")
      );
    } catch {
      // Corrupted installed_plugins, proceed
    }
  }

  return result;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Copy files to `~/.claude/` (GSD pattern) | Plugin system with `.claude-plugin/plugin.json` | Claude Code 1.0.33+ (late 2025) | Native namespacing, caching, lifecycle management |
| `commands/` directory for slash commands | `skills/` directory with `SKILL.md` | Claude Code 2025 (merged systems) | Skills have frontmatter, supporting files, model control |
| tsup for TypeScript bundling | tsdown (Rolldown-based) | 2025 (tsup maintenance stopped) | Rust-based, faster, ESM-first. Migration is minimal. |
| npm postinstall scripts | `bunx` CLI with explicit user interaction | Best practice 2025+ | Bun security model blocks implicit postinstall. Explicit > implicit. |
| Load everything at session start | Lazy skill loading (2% context budget) | Claude Code 2026 | Skill descriptions auto-loaded, full content on-demand only |

**Deprecated/outdated:**
- **tsup**: No longer actively maintained. Use tsdown.
- **npm postinstall for plugin setup**: Fragile, non-interactive. Use `bunx` CLI.
- **`~/.claude/commands/` as primary skill distribution**: Works but lacks plugin namespacing. Use `skills/` in a plugin.
- **SessionStart hook for "always-on" framework loading**: Does not scale. Use native skill description loading.

## Discretion Recommendations

Research-backed recommendations for areas marked as "Claude's Discretion" in CONTEXT.md:

### Skill Grouping Strategy
**Recommendation: Flat namespace under `/mz:`.**
All 12 skills use `/mz:command` (e.g., `/mz:init`, `/mz:plan`, `/mz:go`). No sub-namespacing (no `/mz:project:init` or `/mz:quality:review`). Rationale: (1) Claude Code's plugin system only supports one level of namespacing (`plugin:skill`), (2) users remember flat names faster, (3) 12 commands is few enough that grouping adds cognitive overhead without reducing it.

### Auto-detection of Existing Plugins During Install
**Recommendation: Yes, detect and display informational messages.**
The installer should check for GSD (`~/.claude/commands/gsd/`) and Superpowers (in `settings.json` enabledPlugins). When found, display a brief message: "GSD detected -- Megazord coexists peacefully. Both `/gsd:*` and `/mz:*` commands will work." No action required from user. No offer to uninstall. No migration.

### Redundancy Warnings
**Recommendation: No warnings in Phase 1.**
Redundancy warnings during install are premature -- Megazord skills are stubs. Revisit in Phase 3 when skills are functional. At that point, `/mz:help` could note: "Overlaps with /gsd:plan? Megazord is the successor -- see migration guide."

### Plugin Manifest Format
**Recommendation: Standard Claude Code plugin.json only.**
No extensions needed. The standard schema (name, version, description, author, homepage, repository, license, keywords) is sufficient. Component discovery is automatic from default directory locations (skills/, agents/, hooks/).

### Context Budget Loading Strategy
**Recommendation: Lazy loading with no SessionStart hook.**
- All skills have descriptions (loaded natively at 2% budget)
- Stub skills have `disable-model-invocation: true` (no automatic loading)
- Only `/mz:help` is model-invocable in Phase 1
- No SessionStart hook for content injection
- Measure actual overhead after installation and document in phase verification

### Error Message Format
**Recommendation: Include suggested actions.**
Errors should follow the pattern: what went wrong + why it might have happened + what to try. Example: "Could not detect Claude Code installation. Is Claude Code installed? Run `claude --version` to check, then try again."

### Migration Tooling from GSD Config
**Recommendation: Not in Phase 1.**
Migration tooling is out of scope for Phase 1 (install only). Phase 2 (`/mz:init`) is the natural place to offer: "Detected `.planning/` from GSD -- import existing project?" This requires project configuration logic that doesn't exist yet.

### Project Directory Choice
**Recommendation: Reuse `.planning/` convention.**
Both GSD and Megazord use `.planning/` for project files. Since Megazord is the successor, reusing the directory is the right call. It enables eventual migration of existing GSD projects. The specific files inside may differ (megazord.config.json vs config.json), but the top-level directory stays `.planning/`.

## Open Questions

1. **npm Source Type in Marketplace**
   - What we know: The marketplace schema documents `"source": {"source": "npm", "package": "megazord"}` as a valid plugin source type.
   - What's unclear: How well this works in practice. The marketplace validation output warns "Plugin uses npm source which is not yet fully implemented."
   - Recommendation: Implement with npm source as primary approach. If it fails during implementation, fall back to copying the plugin directory to `~/.claude/plugins/cache/` manually and registering in `installed_plugins.json`. A third option is to host the plugin on GitHub and use a GitHub source instead.

2. **Plugin Name "mz" Availability**
   - What we know: Plugin names must be unique within a marketplace. The name "mz" is short and fast to type.
   - What's unclear: Whether "mz" conflicts with anything in the Claude Code ecosystem.
   - Recommendation: Use "mz" as the plugin name. If a conflict is found during implementation, fall back to "megazord" with slightly longer commands.

3. **Skill Character Budget with All Plugins Loaded**
   - What we know: Budget is 2% of context window (fallback 16,000 chars). Megazord uses ~1,800 chars for 12 skill descriptions.
   - What's unclear: Total budget consumption with GSD commands (~31 commands), Superpowers skills (~14 skills), and Megazord skills (~12 skills) all loaded.
   - Recommendation: Measure actual consumption after Phase 1 install on a machine with all three frameworks. Run `/context` to check. If budget is exceeded, investigate `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var override or reduce description lengths.

4. **Interactive CLI in bunx Context**
   - What we know: `bunx megazord` runs the CLI with full terminal access. Interactive prompts (stdin) should work.
   - What's unclear: Whether all terminal environments (CI, SSH, headless) support interactive prompts via `bunx`.
   - Recommendation: Detect non-interactive terminals (`!process.stdin.isTTY`) and provide a `--yes` flag for non-interactive installation. Default to interactive when TTY is available.

## Sources

### Primary (HIGH confidence)
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) -- Complete plugin schema, directory structure, CLI commands, verified 2026-02-17
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- Skill frontmatter fields, context budget (2% of context window), SLASH_COMMAND_TOOL_CHAR_BUDGET, verified 2026-02-17
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) -- Marketplace schema, npm source type, distribution patterns, verified 2026-02-17
- [Claude Code Plugins Creation Guide](https://code.claude.com/docs/en/plugins) -- Plugin creation, --plugin-dir, namespacing behavior, verified 2026-02-17
- Superpowers v4.3.0 installed at `~/.claude/plugins/cache/claude-plugins-official/superpowers/4.3.0/` -- Verified plugin structure, plugin.json, hooks.json, skills, agents, session-start hook pattern
- GSD v1.20.3 installed at `~/.claude/commands/gsd/` and `~/.claude/get-shit-done/` -- Verified commands structure, gsd-tools.cjs, file manifest pattern
- `~/.claude/settings.json` -- Verified enabled plugins, hooks, environment variables (Agent Teams enabled)
- `~/.claude/plugins/installed_plugins.json` -- Verified installed plugin registry format

### Secondary (MEDIUM confidence)
- [Distributing OpenCode Plugins via npm](https://www.subaud.io/distributing-opencode-plugins-via-npm/) -- bunx setup script pattern, bin entry approach
- [tsdown documentation](https://tsdown.dev/guide/) -- v0.20.3 config, ESM output, migration from tsup
- [Commander.js v14](https://www.npmjs.com/package/commander) -- CLI framework API
- [Zod v4](https://zod.dev/v4) -- Schema validation API
- Project prior research: `.planning/research/ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md`, `FEATURES.md`

### Tertiary (LOW confidence)
- npm source type for marketplace plugins -- Documented but marketplace validation warns "not yet fully implemented." Needs empirical validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries are verified, well-documented, and battle-tested. tsdown is pre-1.0 but has a clear fallback (tsup).
- Architecture: HIGH -- Plugin system is official and verified on this machine with Superpowers. Directory structure and namespacing confirmed empirically.
- Installation flow: MEDIUM -- The `bunx` setup script pattern is proven (OpenCode plugins use it). The npm marketplace source type is less proven. Fallback plans exist.
- Context budget: HIGH -- 2% budget formula verified in official docs. Measured estimates for 12 skills (~1,800 chars) are well within limits.
- Pitfalls: HIGH -- Verified against installed plugins on this machine, official docs, and GitHub issues.

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- plugin system is stable; tsdown version may advance)

---
*Phase 1 research for: Plugin Scaffold and Build Pipeline*
*Researched: 2026-02-17*
