# Deep Context Gathering Guide

Reference `@skills/shared/interview-options.md` for option format, ordering, "fai tu" placement, and explanation standards.
Reference `@skills/shared/interview-language.md` for language detection and session-wide persistence rules.

Reference for the `/mz:init` skill's deep questioning phase (Step 7). Adapted from the GSD methodology for Megazord's project initialization.

## Philosophy

The init questionnaire is the foundation for everything Megazord does afterward. Shallow questioning produces vague plans. Deep questioning produces precise, actionable roadmaps. There is no artificial limit on questions -- be thorough. The `--quick` flag is the escape hatch for users who want to skip this.

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

## Questioning Areas

### 1. Vision and Purpose

Start broad, then narrow.

- "What is this project in one sentence?"
- "Who is the primary user?"
- "What problem does this solve that existing solutions don't?"
- "Where do you see this in 6 months? 1 year?"

Use the answers to write the "What This Is" and "Core Value" sections of PROJECT.md.

### 2. Requirements Elicitation

Get concrete about what must be built.

- "What are the must-have features for the first usable version?"
- "What are the nice-to-haves that can wait?"
- "What is explicitly out of scope? What should we NOT build?"
- "Are there any hard constraints on the first release?"

Organize into Active (must build) and Out of Scope (explicitly excluded) lists. Press for specifics -- "user authentication" is vague; "email/password login with OAuth2 Google" is actionable.

### 3. Tech Stack

Validate auto-detected or gather fresh. Use AskUserQuestion for every selection with the option format from `@skills/shared/interview-options.md`.

**Option presentation for tech choices:**
- Order options modern-first per the preference table in interview-options.md
- Include inline pro/contra in each option's description field
- Add "fai tu" as the last option (translated to session language)
- If auto-detect found an existing stack, present the detected choice as the first option with a note: "Pro: already in use, zero migration cost"

**Key tech questions (each as AskUserQuestion):**
- "Runtime?" -- options ordered: Bun, Node.js, Deno, + fai tu
- "What database/storage will this use?" -- options ordered: Postgres, SQLite, MySQL/MongoDB, + fai tu
- "Testing framework?" -- options ordered: Vitest, Jest, Bun test, + fai tu
- "Any specific libraries or frameworks that must be used?" (freeform -- no fai tu, this is requirements gathering)
- "Any technologies explicitly avoided? Why?" (freeform -- no fai tu)
- "What deployment target?" -- options ordered by project type, + fai tu

For each question: adapt options to the specific project context. If the user already answered a question via auto-detect validation, skip it. Do not re-ask what is already known.

### 4. Conventions and Patterns

Understand the code culture.

- "Do you follow any specific code style guide?"
- "Preferred naming conventions?" (camelCase, snake_case, etc.)
- "Commit message format?" (conventional commits, free-form, etc.)
- "Any architectural patterns?" (clean architecture, hexagonal, MVC, etc.)
- "Monorepo or single package?"

### 5. Constraints

Surface the non-functional requirements.

- "Timeline constraints? When does this need to ship?"
- "Team size? Solo or collaborative?"
- "Performance requirements?" (latency, throughput, concurrent users)
- "Compliance or security requirements?" (HIPAA, SOC2, GDPR, etc.)
- "Budget constraints for infrastructure?"

### 6. Key Decisions

Capture decisions already made so they are respected throughout development.

- "Any architectural decisions already locked in?"
- "Any technology choices that are non-negotiable?"
- "Any past decisions that didn't work out and should be avoided?"

## Conversation Style

- Be conversational, not interrogative. Follow up on interesting answers.
- Group related questions naturally. Don't read from a checklist.
- If the user gives a detailed answer, skip related questions they already covered.
- If the user is brief, dig deeper: "Can you tell me more about...?"
- Acknowledge what you learn: "Got it -- so the core challenge is X."
- End each section with a summary: "Here's what I have so far for requirements. Anything missing?"
- When presenting choices, always use AskUserQuestion with the format from `@skills/shared/interview-options.md`. Never use numbered text lists for selection questions.
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

| Question Area | Maps to PROJECT.md Section |
|---------------|---------------------------|
| Vision/purpose | What This Is, Core Value |
| Requirements | Requirements (Active, Out of Scope) |
| Tech stack | Context, Constraints (Stack) |
| Conventions | Constraints |
| Constraints | Constraints |
| Key decisions | Key Decisions table |

After all questions, present a draft of the PROJECT.md content for user review before writing to disk.
