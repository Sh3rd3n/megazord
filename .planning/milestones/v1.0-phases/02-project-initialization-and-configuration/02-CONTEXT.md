# Phase 2: Project Initialization and Configuration - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

`/mz:init` creates `.planning/` directory with PROJECT.md, STATE.md, and `megazord.config.json`. Users are prompted for workflow and quality settings. All config is persisted and modifiable post-init. Downstream skills respect loaded config. Does NOT include roadmap creation (separate command), brownfield codebase mapping (Phase 8), or any execution capabilities.

</domain>

<decisions>
## Implementation Decisions

### Init flow experience
- Claude decides the optimal flow structure (wizard vs preset-based) — user deferred this choice
- Deep context gathering like GSD: vision, requirements, tech stack, conventions, constraints
- Auto-detect codebase when existing code present: analyze package.json, git history, file patterns → pre-compile answers → user validates/corrects
- When `.planning/` already exists (GSD migration): migrate and adapt existing structure to Megazord format automatically
- `--quick` flag for minimal setup: project name + default preset, skip deep gathering
- Full mode can be lengthy — no artificial question limit. `--quick` is the escape hatch
- Post-init: show created files summary + suggest next step (e.g., "run /mz:plan to create roadmap")
- For greenfield projects: auto-advance option to roadmap creation after init completes

### Defaults and presets
- **Philosophy: Opinionated/strict** — everything enabled by default, users opt-out what they don't want
- **Default model: Quality (Opus)** — quality-first approach, user decides during init
- **Three preset profiles with override:**
  - **Strict:** Everything on (TDD, review, brainstorming, CORTEX, debug mode)
  - **Balanced:** Review + brainstorming on, TDD and CORTEX off
  - **Minimal:** Only essential base features
- Users pick a profile, then override individual toggles if desired

### Project context gathering
- Deep context like GSD: vision, requirements, tech stack, conventions, constraints → full PROJECT.md
- Auto-detect pre-compiles answers from codebase analysis — user validates/corrects rather than answering from scratch
- PROJECT.md structure: Claude decides (adaptive to project type vs fixed sections)

### Config post-init
- Primary interface: `/mz:settings` — overview of all current settings, user selects what to change
- JSON is well-structured and manually editable as fallback/escape hatch
- Config is global only — no per-phase overrides. One set of settings for the entire project
- Hot reload behavior: Claude decides the most practical approach

### Visual identity and aesthetics
- **ASCII banner/logo** at init startup — "MEGAZORD" branding, first impression matters
- **Framework-wide consistency** — every Megazord output follows the same visual style
- **Tech/mecha/power tone** — reflects the Megazord name. Angular borders, energetic symbols, powerful feeling
- **Not a TUI** — platform constraint: Claude Code skills use AskUserQuestion, not stdin. Rich markdown + ASCII art within text output
- Design system (shared visual tokens for boxes, separators, banners): Claude decides where to define it (within Phase 2 or as a shared utility)

### Claude's Discretion
- Init flow structure (wizard vs preset-first)
- PROJECT.md section organization (adaptive vs fixed)
- Hot reload vs next-session for config changes
- CLAUDE.md handling (generate, suggest, or leave to user)
- Design system placement (Phase 2 internal or shared module)
- Exact banner/logo ASCII art design

</decisions>

<specifics>
## Specific Ideas

- Init should feel like a polished developer tool — the first impression sets the tone for the whole framework
- GSD migration path is important: existing `.planning/` structures should be migrated, not discarded
- The `--quick` mode exists for experienced users who want to skip ceremony; full mode is the intended default experience
- Visual identity should evoke Power Rangers/Voltron — the name "Megazord" carries expectations of something powerful and assembled from parts
- Auto-detect from codebase is a quality-of-life feature: don't make users tell you what you can already see

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-project-initialization-and-configuration*
*Context gathered: 2026-02-17*
