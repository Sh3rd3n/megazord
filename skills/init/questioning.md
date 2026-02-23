# Deep Context Gathering Guide

Reference `@skills/shared/interview-options.md` for option format, ordering, "fai tu" placement, and explanation standards.
Reference `@skills/shared/interview-language.md` for language detection and session-wide persistence rules.

Reference for the `/mz:init` skill's deep questioning phase (Step 7). Adapted from the GSD methodology for Megazord's project initialization.

## Philosophy

The init questionnaire is the foundation for everything Megazord does afterward. Shallow questioning produces vague plans. Deep questioning produces precise, actionable roadmaps. There is no artificial limit on questions -- be thorough. The `--quick` flag is the escape hatch for users who want to skip this.

## Flow Structure

The interview has two distinct phases that must be conducted in order:

**COSA Block -- Functional Requirements (WHAT):** Establishes the founder's vision. What the project does, for whom, with what constraints. This mirrors the user acting as the visionary -- they own WHAT.

**COME Block -- Technical Choices (HOW):** Establishes the builder's toolkit. How to implement the vision technically. This mirrors Claude acting as the builder -- we discuss HOW together.

These blocks are NOT interchangeable. WHAT must be fully captured before HOW begins. Starting with technical choices before understanding functional requirements produces misaligned plans.

### Handling Tech Mentions During COSA

When the user mentions a technology during functional questioning (e.g., "I want to use React", "we'll need Postgres"):

1. **Acknowledge:** "Ottimo, lo segno per dopo." (translated to session language) -- a brief, warm acknowledgment.
2. **Record internally:** Note the tech mention as a pre-fill hint for the COME block when that topic comes up.
3. **Redirect:** Return to the functional question that was being discussed. Do NOT engage in technical discussion (no "React is great because..."). Stay in COSA mode.
4. **Pre-fill in COME:** When the COME block reaches the relevant question, present the mentioned technology as the first/default option.

### Brownfield COSA Shortcut

When Step 1c deep scan detected existing code or documentation:

1. **Analyze scan results** to deduce functional requirements from README, existing code structure, doc folders, test names, and planning files.
2. **Present deduced requirements** as a confirmation list in the session language: "Based on what I found, this project [description]. The core features seem to be: [list]. Is this correct?"
3. **User confirms, corrects, or adds** missing items. This is collaborative, not a quiz.
4. **Frame as "let me confirm what I found"** -- not "let me ask you things I already know." The user should feel understood, not interviewed about their own project.
5. **Only ask open-ended COSA questions** for items NOT deducible from the scan.

## Auto-Detect First

Before asking questions, scan the codebase for answers. Users validate detected context faster than they answer from scratch.

### What to Look For

**package.json:**
- `name` -- project identity
- `dependencies` / `devDependencies` -- tech stack, frameworks, libraries
- `scripts` -- build tools, test runners, linters, dev server
- `type: "module"` -- ESM vs CJS
- `engines` -- runtime version constraints

**File patterns:**
- `**/*.ts` / `**/*.tsx` -- TypeScript, possibly React
- `**/*.py` -- Python project
- `**/*.rs` -- Rust project
- `**/*.go` -- Go project
- `*.config.{ts,js,json,mjs}` -- tooling detection (vitest, eslint, biome, webpack, vite)
- `Dockerfile`, `docker-compose.yml` -- containerized deployment
- `.github/workflows/*` -- CI/CD pipeline

**Git history:**
- `git log --oneline -10` -- recent activity, conventional commits, team size (author count)
- `git log --format='%an' | sort -u` -- contributors

**Project markers:**
- `tsconfig.json` -- TypeScript configuration, module resolution, strictness
- `Cargo.toml` -- Rust project metadata
- `go.mod` -- Go project metadata
- `pyproject.toml` / `requirements.txt` -- Python project metadata

### Presenting Detected Context

Compile detected information into a summary. Present it to the user for validation before moving to deep questions. Present the detected context summary in the session language.

Example (English): "I detected a TypeScript project using Bun as the runtime, Vitest for testing, Biome for linting, and tsdown for building. The project uses ESM modules. Does this look correct? Anything to add or correct?"

Example (Italian): "Ho rilevato un progetto TypeScript con Bun come runtime, Vitest per i test, Biome per il linting e tsdown per il build. Il progetto usa moduli ESM. Ti sembra corretto? Qualcosa da aggiungere o correggere?"

This saves time and shows competence. Users are more engaged when they see their project understood.

### Pre-fill Integration

Scan results from Step 1c flow into COME block questions as pre-filled defaults:

- **Source annotation format:** "(Rilevato da {source})" translated to session language. Examples: "(detected from package.json)", "(rilevato da tsconfig.json)", "(détecté dans Cargo.toml)".
- **Pre-filled values appear as the first/recommended option** in AskUserQuestion. Their description starts with the source annotation, then continues with normal pro/contra: "Already in use (detected from package.json), zero migration cost. Pro: {advantages}. Con: {drawbacks}."
- **User answer always wins:** When auto-detected values conflict with explicit user answers, accept the user's choice without argument. Claude may note the discrepancy once: "Noto che package.json usa X, ma hai scelto Y -- procedo con Y." (translated to session language)
- **Tech mentions from COSA:** Technologies the user mentioned during the COSA block are also treated as pre-fill hints -- they appear as the first option in the relevant COME question.

## Questioning Areas

The questioning areas are split into two blocks matching the interview flow. Conduct all COSA areas before transitioning to COME.

---

### COSA Questioning Areas (Functional Requirements)

Conduct these conversationally, without AskUserQuestion selection questions. The goal is understanding the project's purpose, value, and constraints.

#### 1. Vision and Purpose

Start broad, then narrow.

- "What is this project in one sentence?"
- "Who is the primary user?"
- "What problem does this solve that existing solutions don't?"
- "Where do you see this in 6 months? 1 year?"

Use the answers to write the "What This Is" and "Core Value" sections of PROJECT.md.

#### 2. Requirements Elicitation

Get concrete about what must be built.

- "What are the must-have features for the first usable version?"
- "What are the nice-to-haves that can wait?"
- "What is explicitly out of scope? What should we NOT build?"
- "Are there any hard constraints on the first release?"

Organize into Active (must build) and Out of Scope (explicitly excluded) lists. Press for specifics -- "user authentication" is vague; "email/password login with OAuth2 Google" is actionable.

#### 3. Constraints

Surface the non-functional requirements.

- "Timeline constraints? When does this need to ship?"
- "Team size? Solo or collaborative?"
- "Performance requirements?" (latency, throughput, concurrent users)
- "Compliance or security requirements?" (HIPAA, SOC2, GDPR, etc.)
- "Budget constraints for infrastructure?"

---

### COME Questioning Areas (Technical Choices)

Conduct these using AskUserQuestion with the option standards from `@skills/shared/interview-options.md`. Show the COSA transition summary before starting this block.

#### 4. Tech Stack

Validate auto-detected (from Step 1c) or gather fresh. Use AskUserQuestion for every selection.

**Option presentation for tech choices:**
- Order options modern-first per the preference table in interview-options.md
- Include inline pro/contra in each option's description field
- Add "fai tu" as the last option (translated to session language)
- If Step 1c found an existing stack, present the detected choice as the first option with source annotation: "Already in use (detected from package.json), zero migration cost. Pro: {advantages}. Con: {drawbacks}."

**Key tech questions (each as AskUserQuestion):**
- "Runtime?" -- options ordered: Bun, Node.js, Deno, + fai tu
- "What database/storage will this use?" -- options ordered: Postgres, SQLite, MySQL/MongoDB, + fai tu
- "Testing framework?" -- options ordered: Vitest, Jest, Bun test, + fai tu
- "Any specific libraries or frameworks that must be used?" (freeform -- no fai tu, this is requirements gathering)
- "Any technologies explicitly avoided? Why?" (freeform -- no fai tu)
- "What deployment target?" -- options ordered by project type, + fai tu

For each question: adapt options to the specific project context. If the user already answered a question via Step 7a validation, skip it. Do not re-ask what is already known.

#### 5. Conventions and Patterns

Understand the code culture.

- "Do you follow any specific code style guide?"
- "Preferred naming conventions?" (camelCase, snake_case, etc.)
- "Commit message format?" (conventional commits, free-form, etc.)
- "Any architectural patterns?" (clean architecture, hexagonal, MVC, etc.)
- "Monorepo or single package?"

#### 6. Key Decisions

Capture decisions already made so they are respected throughout development.

- "Any architectural decisions already locked in?"
- "Any technology choices that are non-negotiable?"
- "Any past decisions that didn't work out and should be avoided?"

## Conversation Style

**During COSA (functional block):**
- Be conversational, not interrogative. Follow up on interesting answers.
- Group related questions naturally. Don't read from a checklist.
- No AskUserQuestion selection questions -- freeform dialogue only.
- If the user gives a detailed answer, skip related questions they already covered.
- If the user is brief, dig deeper: "Can you tell me more about...?"
- Acknowledge what you learn: "Got it -- so the core challenge is X."
- End each COSA area with a brief confirmation: "Here's what I have so far for requirements. Anything missing?"

**During COME (technical block):**
- Use AskUserQuestion for every selection question per `@skills/shared/interview-options.md`. Never use numbered text lists for selection questions.
- Pre-fill detected values as the first option with source annotations.
- Be systematic but efficient -- skip questions already answered in Step 7a.

**Transition between blocks:**
- After COSA completes, show the transition summary (mini-summary of gathered functional requirements).
- Explicitly announce the shift: "Now let's talk about how to build it." (translated to session language)
- This is a clear boundary -- the user should feel two distinct phases, not one long interrogation.

**Throughout the entire interview:**
- Conduct the entire conversation in the detected session language. Do not switch to English for questions or follow-ups, even when discussing English-named technologies. Example (Italian): "Che database preferisci per questo progetto?" not "What database do you want?"

## AI-Chosen Items in Summary

When building the PROJECT.md draft at the end of the questionnaire, mark any item the user delegated via "fai tu" / "AI decides":

- In the Context or Constraints sections, append `(fai tu)` or `(AI)` to the delegated item
- Example: "Runtime: Bun (fai tu)", "Database: Postgres (AI)"
- This gives the user visibility into which decisions were their own vs delegated

In the final summary presented to the user before writing to disk, list AI-chosen items separately:

```
▸ AI-Chosen Decisions
  Runtime: Bun -- scelto per velocità e TypeScript nativo
  Database: Postgres -- standard affidabile per progetti relazionali
```

If no items were delegated, skip this section entirely.

## Building PROJECT.md

As you gather context, mentally organize answers into the PROJECT.md structure:

| Question Area | Block | Maps to PROJECT.md Section |
|---------------|-------|---------------------------|
| Vision/purpose | COSA | What This Is, Core Value |
| Requirements | COSA | Requirements (Active, Out of Scope) |
| Constraints | COSA | Constraints |
| Tech stack | COME | Context, Constraints (Stack) |
| Conventions | COME | Constraints |
| Key decisions | COME | Key Decisions table |

After all questions, present a draft of the PROJECT.md content for user review before writing to disk.
