# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-02-19

### Added

- npm publication as `megazord-cli` (unscoped public package on npmjs.com).
- Silent CLI installer (`bunx megazord-cli install`) with atomic temp-dir-and-rename rollback.
- Update command (`bunx megazord-cli update`) with silent overwrite to `~/.claude/megazord/`.
- Uninstall command (`bunx megazord-cli uninstall`) with directory removal and Claude Code deregistration.
- Dedicated installation directory at `~/.claude/megazord/` with version and update-check files.
- npm registry update check with 24-hour cache and 3-second timeout.
- `/mz:update` slash command for in-session updates via `bunx megazord-cli@latest update`.
- GitHub Actions CI workflow (lint, typecheck, test) triggered on push and PR to master.
- Automated release workflow with OIDC provenance and Trusted Publishing via `release.yml`.
- README with hero banner, quickstart guide, command reference, and architecture overview.
- CHANGELOG following Keep a Changelog 1.1.0 format.

### Changed

- Package renamed from `megazord` to `megazord-cli` (npm name squatter on `megazord`).
- Dual bin entries: both `megazord` and `megazord-cli` point to same entrypoint.
- Version deduplication: single source of truth in `package.json`, read at runtime.
- Plugin files installed to `~/.claude/megazord/` instead of Claude Code plugin cache.
- `detect-plugins.ts` uses `megazordDir` existence as primary check (installed_plugins.json as fallback).

### Fixed

- Missing `scripts/` in package.json `files` array (prevented session-start hook from shipping).
- Missing `agents/` in install command copy list (agents directory was not copied to installation).

## [1.0.0] - 2026-02-19

### Added

- CLI installer (`bunx megazord-cli` to install as Claude Code plugin).
- 15 slash commands covering full development lifecycle (`/mz:init`, `/mz:plan`, `/mz:go`, `/mz:status`, `/mz:pause`, `/mz:resume`, `/mz:quick`, `/mz:verify`, `/mz:map`, `/mz:lifecycle`, `/mz:brainstorm`, `/mz:tdd`, `/mz:review`, `/mz:debug`, `/mz:help`).
- 6 specialized agents (executor, researcher, reviewer, planner, tdd-driver, team-lead).
- Agent Teams integration with native Claude Code coordination and worktree isolation.
- Hook-based file ownership enforcement for multi-agent safety.
- Configuration presets (strict, balanced, minimal) for quality discipline.
- CORTEX adaptive thinking with task classification and anti-sycophancy.
- State management across sessions (STATE.md, context handoff, resume from any point).
- Brownfield codebase support via `/mz:map` analysis.
- Milestone lifecycle management via `/mz:lifecycle`.

[Unreleased]: https://github.com/sh3rd3n/megazord/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/sh3rd3n/megazord/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sh3rd3n/megazord/releases/tag/v1.0.0
