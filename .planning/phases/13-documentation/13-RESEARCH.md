# Phase 13: Documentation - Research

**Researched:** 2026-02-19
**Domain:** README.md authoring for open-source CLI tool (GitHub + npm)
**Confidence:** HIGH

## Summary

Phase 13 is a documentation-only phase that produces a single file: `README.md` at the repository root. No code changes, no library installations, no configuration modifications. The README must serve two audiences simultaneously: developers landing on the GitHub repo page and developers finding the package on npmjs.com (npm renders README.md from the published tarball).

The key challenge is information architecture. Megazord has 15 slash commands, 6 specialized agents, multiple quality presets, and a full development lifecycle -- all of which must be communicated without overwhelming a new user. The user-decided structure (hero intro, prerequisites, quickstart, command reference grouped by workflow phase, 4 workflow examples, collapsible sections) addresses this well. The README must also include visual elements: a hero image/badge PNG or SVG, shields.io badges, and at least one demo GIF showing Megazord in a terminal.

**Primary recommendation:** Write the README in a single plan with two logical sections: (1) content authoring (all text, structure, collapsible sections, command reference, workflow examples with synthetic output) and (2) visual assets creation (hero image, badges, demo GIF placeholder or actual recording). The demo GIF is the only item that requires an external tool (VHS by Charmbracelet or manual recording).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Voice & positioning
- Conversational and warm tone -- Remix/Astro docs style, approachable, explains the "why"
- Positioning: lifecycle-complete framework -- "one framework for the entire development lifecycle with agents that communicate and coordinate"
- No competitor comparisons -- Megazord speaks for itself through what it does
- English only, Claude generates a fitting tagline (no fixed tagline from user)

#### Content depth
- Quickstart: Claude's discretion on depth -- calibrate to match the warm, conversational tone
- Command reference: mini-doc per command (3-5 lines each: description, usage, when to use it)
- Commands grouped by workflow phase: Setup, Planning, Execution, Quality, Utilities
- Dedicated Prerequisites section before quickstart -- what's needed (Claude Code, bun, etc.) with minimum versions

#### Workflow examples
- 4 workflows to showcase:
  1. **Greenfield classic** -- init -> plan -> go -> verify (new project from scratch)
  2. **Brownfield onboarding** -- map -> plan -> go (adding Megazord to existing project)
  3. **Quick task** -- /mz:quick for fast tasks without ceremony
  4. **Debug workflow** -- /mz:debug for systematic debugging
- Plus any additional workflow Claude deems useful
- Each example uses a concrete fictitious project (e.g., "todo-app", "my-saas")
- Each workflow has a brief scenario intro (1-2 sentences: when/why you'd use this)
- Show commands + synthetic output (2-3 lines of typical output per command)

#### Visual presentation
- Hero image/badge PNG or SVG as README header -- professional look
- Badges: Claude's discretion on which ones (npm version, CI, license as baseline)
- Collapsible `<details>` sections for long content (command reference, workflow examples) -- keeps README navigable
- At least one demo GIF showing Megazord in action in a terminal

### Claude's Discretion
- Quickstart depth calibration
- Badge selection beyond the baseline trio
- Tagline wording
- Whether to add any additional workflow examples beyond the 4 selected
- Exact collapsible section boundaries
- Demo GIF content and placement

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCS-01 | README.md with hero paragraph, quickstart guide, and full command list with descriptions | Hero paragraph pattern, quickstart structure, command reference table format -- all documented below with exact content sources from codebase analysis |
| DOCS-02 | README includes usage examples for key commands | 4 workflow examples with concrete fictitious projects, synthetic terminal output patterns, collapsible section structure -- all documented below |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Markdown (GFM) | N/A | README authoring format | GitHub and npm both render GitHub Flavored Markdown natively |
| shields.io | N/A (hosted service) | Dynamic badge generation | Industry standard, used by VS Code, Vue.js, Bootstrap; 1.6B images/month |
| HTML `<details>/<summary>` | HTML5 | Collapsible sections in README | Natively supported by GitHub markdown renderer; graceful fallback on unsupported browsers (shows expanded) |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| VHS (Charmbracelet) | Latest | Terminal GIF recording via .tape scripts | For creating the demo GIF; reproducible via scripted tape files |
| SVG/PNG editor | N/A | Hero image creation | For the header badge/logo; can be done with raw SVG markup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VHS | asciinema + agg | VHS is simpler (single tool, .tape scripting); asciinema requires ffmpeg and separate conversion step |
| VHS | terminalizer | VHS has better GitHub integration and is actively maintained by Charmbracelet |
| Custom SVG hero | Shield-style custom badge | SVG gives full creative control for logo; badge is simpler but less distinctive |

**Installation (for GIF recording only):**
```bash
# VHS requires ttyd and ffmpeg
brew install charmbracelet/tap/vhs ffmpeg ttyd
```

Note: VHS is only needed if creating an actual terminal recording. An alternative is to use a manually-recorded GIF via any screen capture tool, or to defer the GIF to a later phase and use a placeholder.

## Architecture Patterns

### README Structure (Recommended Order)

```
README.md
├── Hero image (SVG/PNG)
├── Tagline (one-liner)
├── Badges row (npm version, CI, license, + optional)
├── Hero paragraph (what & why, 3-4 sentences)
├── Table of Contents (optional -- collapsible sections reduce need)
├── Prerequisites section
│   ├── Claude Code (>= 2.x)
│   ├── Node.js (>= 22)
│   └── bun (>= 1.x)
├── Quickstart section
│   ├── Install command
│   ├── First command (/mz:init)
│   └── What happens next
├── Command Reference (<details> collapsible)
│   ├── Setup: init, settings, help
│   ├── Planning: plan, discuss, map
│   ├── Execution: go, quick
│   ├── Quality: review, verify, debug
│   └── Utilities: status, pause, resume, lifecycle
├── Workflow Examples (<details> collapsible)
│   ├── Greenfield classic
│   ├── Brownfield onboarding
│   ├── Quick task
│   ├── Debug workflow
│   └── (optional 5th)
├── Demo GIF
├── How It Works (brief architecture overview -- optional)
├── License
└── Footer links
```

### Pattern 1: Collapsible Sections with `<details>`

**What:** HTML5 `<details>/<summary>` elements that GitHub markdown renders as expandable/collapsible sections.
**When to use:** For Command Reference and Workflow Examples -- the two longest sections.
**Example:**
```html
<details>
<summary><strong>Command Reference</strong></summary>

<!-- IMPORTANT: blank line required after <summary> for markdown to render -->

### Setup

#### `/mz:init`
Initialize a new Megazord project...

</details>
```

**Critical formatting rules (verified from GitHub docs):**
- Blank line required after `<summary>` tag for markdown content to render
- Blank line required before closing `</details>` tag
- No markdown formatting inside `<summary>` -- use HTML tags (`<strong>`, `<code>`) instead
- Nested `<details>` is supported but adds complexity; recommend flat structure with headers inside

Source: [GitHub Docs - Organizing information with collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections)

### Pattern 2: Shields.io Badge Row

**What:** A row of badge images at the top of the README, after the hero image and tagline.
**When to use:** Immediately below the tagline, before the hero paragraph.
**Example:**
```markdown
[![npm version](https://img.shields.io/npm/v/megazord-cli)](https://www.npmjs.com/package/megazord-cli)
[![CI](https://img.shields.io/github/actions/workflow/status/sh3rd3n/megazord/ci.yml?branch=master&label=CI)](https://github.com/sh3rd3n/megazord/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
```

**Badge recommendations (Claude's discretion area):**
- **Baseline (user-decided):** npm version, CI status, license
- **Recommended additions:**
  - `Node.js >= 22` static badge (communicates prerequisite)
  - `Claude Code` static badge (communicates ecosystem)
  - `Commands: 15` static badge (communicates scope at a glance)

Note: CI badge URL depends on the actual workflow filename created in Phase 14. Use `ci.yml` as placeholder; planner should note this needs updating after Phase 14.

Source: [shields.io](https://shields.io/)

### Pattern 3: Synthetic Terminal Output in Code Blocks

**What:** Fenced code blocks showing commands and their expected output, for workflow examples.
**When to use:** In each workflow example section.
**Example:**
````markdown
```
$ /mz:init

╔═════════════════════════════════════════╗
║  MEGAZORD v1.0.0                        ║
║  Project Management x Code Quality x Agent Teams  ║
╚═════════════════════════════════════════╝

> Preset: Balanced
> Model profile: balanced (Opus + Sonnet)
> Created .planning/megazord.config.json
> Created .planning/ROADMAP.md
> Created .planning/PROJECT.md

Ready! Run /mz:plan to start planning your first phase.
```
````

**Key:** Use no language identifier (plain text) or `text` for terminal output to avoid syntax highlighting confusion. Keep output to 2-3 representative lines per command as user decided.

### Anti-Patterns to Avoid
- **Wall of text without visual breaks:** Use badges, collapsible sections, and code blocks to create rhythm
- **Copy-paste commands that don't work:** Every command in the README must be tested or clearly marked as illustrative
- **Outdated version numbers:** The README should reference version from package.json (currently 1.0.0), and badges pull live data from npm/GitHub
- **Mixing install methods:** Megazord installs via `bunx megazord-cli` -- do not show npm/npx alternatives (per project constraint: always bun/bunx)
- **Linking to pages that don't exist yet:** The CI badge will 404 until Phase 14 creates the workflow. Consider using a placeholder or adding the CI badge in Phase 14

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge images | Custom badge PNGs | shields.io dynamic badges | Auto-updates from npm/GitHub; no maintenance |
| Collapsible sections | JavaScript toggle widgets | Native `<details>/<summary>` | Works everywhere GitHub renders markdown; no JS needed |
| Terminal recording | Manual typing + screen capture | VHS .tape scripting | Reproducible, versionable, consistent output |
| Hero image | Complex graphic design tool | SVG markup or simple PNG badge | Can be version-controlled, renders at any size |

**Key insight:** README.md is pure static content. Every "feature" (badges, collapsible sections, GIF embeds) uses native GitHub markdown capabilities or hosted services. No build step, no JavaScript, no generated output.

## Common Pitfalls

### Pitfall 1: Broken Markdown Inside `<details>` Tags
**What goes wrong:** Markdown content inside `<details>` renders as raw text instead of formatted markdown.
**Why it happens:** Missing blank line between `<summary>` closing tag and the markdown content. GitHub's markdown parser needs the blank line to switch from HTML mode to markdown mode.
**How to avoid:** Always place a blank line after `</summary>` and before `</details>`. Test by previewing in GitHub (or use `gh markdown render` if available).
**Warning signs:** Content inside collapsed section appears as plain text with literal `#`, `*`, `` ` `` characters visible.

### Pitfall 2: Badges Pointing to Non-Existent Resources
**What goes wrong:** CI badge returns "no status" or 404 image because the GitHub Actions workflow doesn't exist yet (created in Phase 14).
**Why it happens:** Phase 13 (Documentation) runs before Phase 14 (CI/CD Pipeline).
**How to avoid:** Two options: (1) Include the CI badge with a note in the plan that it will activate after Phase 14, or (2) Add the CI badge as a follow-up task in Phase 14. Recommendation: include it now with correct URL format so Phase 14 doesn't need to touch README.md. The badge will show "no status" until the workflow exists, which is acceptable for a private repo.
**Warning signs:** Badge image broken or showing unexpected text.

### Pitfall 3: npm README Out of Sync with GitHub README
**What goes wrong:** The README on npmjs.com shows different content than GitHub because npm snapshots README.md at publish time.
**Why it happens:** npm packages include the README.md that was present at `npm publish` time. If README is updated on GitHub after publish, npm still shows the old version.
**How to avoid:** Not a concern for this phase (npm publish is Phase 15). But the planner should ensure the README is complete before Phase 15 runs.
**Warning signs:** GitHub and npm showing different README content after v1.1 publish.

### Pitfall 4: Demo GIF Too Large for GitHub
**What goes wrong:** GitHub has a 10MB file size limit for files in repositories, and a 100MB hard limit. Large GIFs can slow page loads dramatically.
**Why it happens:** Terminal recordings can produce very large GIFs, especially with long sessions or high frame rates.
**How to avoid:** Keep demo GIFs short (15-30 seconds). Use VHS settings to control dimensions (80x24 terminal) and frame rate. Target under 2MB. Alternatively, host on a CDN and link from README.
**Warning signs:** GIF file exceeds 5MB; page load time is noticeably slow.

### Pitfall 5: Incorrect Command Names in Documentation
**What goes wrong:** README lists commands that don't match actual skill names.
**Why it happens:** The CHANGELOG.md currently references `/mz:brainstorm` and `/mz:tdd` which are not actual command names. The real commands are `/mz:discuss` and `/mz:review`.
**How to avoid:** Use the actual command directory listing as the source of truth. The 15 commands are: `debug`, `discuss`, `go`, `help`, `init`, `lifecycle`, `map`, `pause`, `plan`, `quick`, `resume`, `review`, `settings`, `status`, `verify`.
**Warning signs:** User tries a command from the README and gets "unknown command" error.

## Code Examples

### Complete Badge Row (Verified Pattern)
```markdown
[![npm version](https://img.shields.io/npm/v/megazord-cli?style=flat&colorA=18181B&colorB=28CF8D)](https://www.npmjs.com/package/megazord-cli)
[![CI](https://img.shields.io/github/actions/workflow/status/sh3rd3n/megazord/ci.yml?branch=master&label=CI&style=flat&colorA=18181B)](https://github.com/sh3rd3n/megazord/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat&colorA=18181B)](LICENSE)
[![Node.js >= 22](https://img.shields.io/badge/Node.js-%3E%3D22-green?style=flat&colorA=18181B)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-purple?style=flat&colorA=18181B)](https://claude.ai/code)
```

Note: `colorA=18181B` gives a dark left side consistent across all badges. Adjust colors to match hero image aesthetic.

Source: [shields.io docs](https://shields.io/docs/)

### Collapsible Command Reference Section
```html
<details>
<summary><strong>Command Reference</strong> -- all 15 <code>/mz:</code> commands</summary>

### Setup

#### `/mz:init`
Initialize a new Megazord project with configuration and planning structure.

**Usage:** `/mz:init`
**When to use:** Starting a new project or onboarding Megazord to an existing one. This is always your first step.

#### `/mz:settings`
View and modify Megazord project configuration.

**Usage:** `/mz:settings` or `/mz:settings quality.tdd on`
**When to use:** When you want to change quality presets, model selection, or workflow toggles after initialization.

...

</details>
```

### Workflow Example with Synthetic Output
````markdown
<details>
<summary><strong>Greenfield: Build a new project from scratch</strong></summary>

> You're starting a fresh project -- a task management API. Megazord handles the entire lifecycle from planning to verification.

```
$ /mz:init

MEGAZORD v1.0.0
Preset: Balanced
Created .planning/megazord.config.json
Created .planning/ROADMAP.md
Ready! Run /mz:plan to start planning.
```

```
$ /mz:plan 1

MEGAZORD > PLANNING
Researching phase 1...
Created 1-01-PLAN.md (8 tasks, 2 waves)
```

```
$ /mz:go

MEGAZORD > EXECUTE
Wave 1: Spawning 3 executor agents...
Task 1.1: Setting up project structure [DONE]
Task 1.2: Creating database schema [DONE]
Wave 2: Spawning 2 executor agents...
All tasks complete. Run /mz:verify to check deliverables.
```

```
$ /mz:verify

MEGAZORD > VERIFY
Checking 4 success criteria...
[PASS] API endpoints respond with correct status codes
[PASS] Database migrations run without errors
Verification: PASSED (4/4 criteria met)
```

</details>
````

### VHS Tape File for Demo GIF
```tape
# demo.tape -- Megazord demo recording
Output demo.gif

Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Catppuccin Mocha"

Type "# Install Megazord"
Enter
Sleep 500ms

Type "bunx megazord-cli"
Enter
Sleep 2s

Type "# Now in Claude Code, use slash commands:"
Enter
Sleep 500ms

Type "/mz:init"
Enter
Sleep 3s

Type "/mz:plan 1"
Enter
Sleep 2s

Type "/mz:go"
Enter
Sleep 3s
```

Note: This is illustrative. The actual GIF recording requires a working Megazord installation in Claude Code. A practical alternative is a manually recorded GIF showing real command output, or a simplified version showing just the install + init flow.

### Hero SVG Badge (Inline Approach)
```markdown
<p align="center">
  <img src="assets/megazord-hero.svg" alt="Megazord" width="600" />
</p>
```

Or using a text-based approach without an image file:
```markdown
<h1 align="center">
  <br>
  Megazord
  <br>
</h1>
<h3 align="center">One framework for the entire development lifecycle</h3>
```

The image approach is preferred (user decided: "Hero image/badge PNG or SVG as README header -- professional look"). The planner should include a task for creating the hero asset (SVG or PNG) and placing it in an `assets/` directory.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static badge images committed to repo | shields.io dynamic badges | ~2015 onwards | Badges auto-update; no manual maintenance |
| Flat README with all content visible | `<details>/<summary>` collapsible sections | HTML5 / GitHub support ~2018 | Navigable README that doesn't overwhelm on first scroll |
| Manual terminal screenshots | VHS .tape scripted recordings | VHS released 2022 | Reproducible, versionable demo GIFs |
| Single README for all audiences | README + docs site for complex projects | Ongoing | For Megazord at v1.1, a single README is sufficient; docs site can come later |

**Deprecated/outdated:**
- **Travis CI badges:** Travis CI is largely deprecated; GitHub Actions badges are the current standard
- **Waffle.io / Gitter badges:** These services no longer exist; remove if found in templates
- **Raw GitHub file URLs for images:** Use relative paths (`assets/hero.svg`) instead of `https://raw.githubusercontent.com/...` for images in the same repo

## Codebase Analysis: Content Sources

This section documents exactly where README content should be sourced from the codebase. The planner should reference these for task instructions.

### Hero Paragraph Sources
- `package.json` description: "Claude Code framework unifying project management, code quality, and multi-agent coordination"
- `.planning/PROJECT.md` core value: "One framework that handles the entire development lifecycle -- from project initialization to code delivery -- with agents that actually communicate and coordinate, not just get spawned and forgotten."
- `.planning/PROJECT.md` ecosystem position: First framework to use Claude Code's native Agent Teams for real multi-agent coordination

### Prerequisites
- Node.js >= 22 (from `package.json` engines field)
- Claude Code >= 2.x (from installer's `detectPlugins` -- checks `~/.claude/` directory)
- bun (no specific version pinned, but bun 1.x is implied by project constraints)

### Quickstart Flow
1. `bunx megazord-cli` -- installs Megazord as a Claude Code plugin (default action when no subcommand)
2. Open Claude Code in a project directory
3. `/mz:init` -- initialize project
4. `/mz:help` -- see all commands

### All 15 Commands (Source of Truth: commands/ directory)

**Setup phase:**
| Command | Description (from command frontmatter) |
|---------|---------------------------------------|
| `/mz:init` | Initialize a Megazord project with configuration and planning structure |
| `/mz:settings` | View and modify Megazord project configuration |
| `/mz:help` | Show all available Megazord skills with descriptions and usage examples |

**Planning phase:**
| Command | Description (from command frontmatter) |
|---------|---------------------------------------|
| `/mz:plan` | Plan a phase into executable tasks with dependencies and waves |
| `/mz:discuss` | Socratic brainstorming to explore approaches before implementation |
| `/mz:map` | Analyze existing codebase for brownfield project support |

**Execution phase:**
| Command | Description (from command frontmatter) |
|---------|---------------------------------------|
| `/mz:go` | Execute the current phase plan with subagent delegation |
| `/mz:quick` | Run a quick task without project ceremony |

**Quality phase:**
| Command | Description (from command frontmatter) |
|---------|---------------------------------------|
| `/mz:review` | Two-stage code review (spec compliance + code quality) |
| `/mz:verify` | Verify phase deliverables match acceptance criteria |
| `/mz:debug` | Systematic four-phase debugging (reproduce, isolate, root-cause, fix) |

**Utilities:**
| Command | Description (from command frontmatter) |
|---------|---------------------------------------|
| `/mz:status` | Show project progress, current phase, and next actions |
| `/mz:pause` | Save session context for handoff to a future session |
| `/mz:resume` | Restore context from a previous session and continue work |
| `/mz:lifecycle` | Complete milestone lifecycle: audit, archive, and next version |

### Agent Types (for "How It Works" or hero paragraph enrichment)
| Agent | Role |
|-------|------|
| mz-executor | Execute a single plan file with atomic commits per task |
| mz-planner | Decompose a phase into executable plans with tasks and dependencies |
| mz-researcher | Research the technical landscape for a phase before planning |
| mz-reviewer | Two-stage code review for spec compliance and code quality |
| mz-verifier | Goal-backward phase verification against success criteria |
| mz-mapper | Analyze an existing codebase for brownfield project support |

### Quality Presets (for quickstart or reference)
| Preset | Description | Best For |
|--------|-------------|----------|
| Strict | Everything enabled -- TDD, auto-review, brainstorming, CORTEX, systematic debugging | Production projects, critical systems |
| Balanced | Core quality on (review, brainstorming, verification), advanced off (TDD, CORTEX) | Side projects, prototyping with quality |
| Minimal | No quality gates, pure speed | Quick experiments, throwaway prototypes |

## Tone & Voice Guidance

The user locked "conversational and warm tone -- Remix/Astro docs style." Based on research:

**Do:**
- Use "you" and "your" -- speak directly to the reader
- Explain the "why" alongside the "what" -- "Run `/mz:verify` to make sure your phase actually delivered what it promised, not just that tasks completed"
- Use short paragraphs and sentence fragments where they aid scanning
- Inject personality without being cutesy -- "Megazord coordinates agents that actually talk to each other"
- Use em dashes for asides (like this one)

**Don't:**
- Use corporate jargon -- "leverage", "utilize", "implement a solution"
- Be overly casual -- no memes, no "lol", no "gonna"
- Write walls of text without visual breaks
- Bury the lede -- the first sentence of each section should tell the reader what they'll learn

**Voice reference:** Google's Developer Documentation Style Guide recommends "conversational, friendly, and respectful tone" while "avoiding slang." Remix docs achieve this by framing features as solutions to real developer pain points.

Source: [Google Developer Documentation Style Guide - Voice and Tone](https://developers.google.com/style/tone)

## Open Questions

1. **Demo GIF: Real recording vs. synthetic placeholder?**
   - What we know: The user decided "at least one demo GIF showing Megazord in action in a terminal." VHS can script terminal recordings. However, Megazord is a Claude Code plugin -- its commands run inside Claude Code, not a standard terminal. A VHS recording can't capture Claude Code interactions.
   - What's unclear: Whether a real Claude Code demo recording is feasible for this phase, or if a simplified/synthetic approach is acceptable.
   - Recommendation: Create a real GIF of the install flow (`bunx megazord-cli` in a standard terminal, which works outside Claude Code). For in-Claude-Code interactions, either: (a) manually screen-record a Claude Code session and convert to GIF, or (b) create a stylized text-based illustration and defer the real GIF. The planner should make the GIF a non-blocking task with a fallback.

2. **CI badge URL: What workflow filename will Phase 14 create?**
   - What we know: The CI badge needs the exact workflow filename (e.g., `ci.yml`).
   - What's unclear: Phase 14 hasn't been planned yet.
   - Recommendation: Use `ci.yml` as a conventional placeholder. If Phase 14 uses a different name, updating the badge URL is a one-line change. Note in the plan that this may need a follow-up touch-up.

3. **Assets directory structure**
   - What we know: No `assets/` directory exists currently. Hero image needs to live somewhere.
   - What's unclear: Whether to use `assets/`, `.github/`, or root level.
   - Recommendation: Create `assets/` at repo root. It is the most conventional location for README images. It should be added to the npm exclude list (not in `files` array -- already handled since `files` is an allowlist).

4. **CHANGELOG command name discrepancy**
   - What we know: CHANGELOG.md lists `/mz:brainstorm` and `/mz:tdd` which don't match actual commands (`/mz:discuss` and `/mz:review`). This is a pre-existing issue from Phase 12.
   - What's unclear: Whether to fix CHANGELOG in this phase.
   - Recommendation: Out of scope for Phase 13 (documentation phase is README only). Flag for a future quick fix task.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- All 15 commands verified from `commands/` directory listing, descriptions from YAML frontmatter
- **package.json** -- Package name (`megazord-cli`), engine requirements (`node >= 22`), files array, bin command
- **install.ts** -- Exact install flow, CLI behavior, detection logic
- **.planning/PROJECT.md** -- Core value proposition, ecosystem position, project context
- **.planning/REQUIREMENTS.md** -- DOCS-01 and DOCS-02 requirement definitions, traceability
- **skills/init/presets.md** -- Quality preset details (strict/balanced/minimal)
- **agents/*.md** -- All 6 agent type definitions and roles
- [GitHub Docs - Collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) -- `<details>/<summary>` formatting rules

### Secondary (MEDIUM confidence)
- [shields.io](https://shields.io/) -- Badge URL patterns verified for npm version, GitHub Actions, license
- [shields.io/badges/npm-version](https://shields.io/badges/npm-version) -- npm badge URL pattern confirmed
- [shields.io/badges/github-actions-workflow-status](https://shields.io/badges/git-hub-actions-workflow-status) -- CI badge URL pattern confirmed
- [charmbracelet/vhs](https://github.com/charmbracelet/vhs) -- VHS .tape format and capabilities for terminal GIF recording
- [Google Developer Documentation Style Guide](https://developers.google.com/style/tone) -- Voice and tone best practices

### Tertiary (LOW confidence)
- Demo GIF feasibility for Claude Code interactions -- no verified method for recording Claude Code sessions as GIF (Claude Code is a terminal-based tool, so screen recording is the realistic approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- README authoring uses only native markdown, shields.io (industry standard), and HTML5 `<details>` tags. No libraries, no build steps.
- Architecture: HIGH -- README structure follows well-established patterns verified from GitHub docs and successful open-source projects. All content sources identified in the codebase.
- Pitfalls: HIGH -- All pitfalls identified from direct codebase analysis (command name discrepancy, badge dependency on Phase 14, GIF size concerns, `<details>` formatting rules).
- Voice/Tone: MEDIUM -- Remix/Astro style is well-understood conceptually, but execution quality depends on writing skill rather than technical correctness.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable domain -- markdown and shields.io conventions change slowly)
