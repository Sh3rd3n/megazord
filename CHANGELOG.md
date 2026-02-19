# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - Unreleased

### Added

- Distribution, documentation, CI/CD, npm publication, and marketplace support (Phases 12-16).

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
