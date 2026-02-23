---
name: interview-options
description: Single source of truth for option presentation in all Megazord interview skills. Defines format rules, ordering, "fai tu" behavior, per-option explanation format, and AskUserQuestion integration guidance.
---

# Interview Option Standards

Reference `@skills/shared/interview-language.md` for translated labels used in option text.

This document governs how every selection question is structured, ordered, and explained across all Megazord interview skills. Apply these rules in `/mz:init`, `/mz:plan`, and any future skill that gathers user choices.

---

## 1. Option Format Rules

**Use AskUserQuestion for all selection questions.** Never present selection choices as numbered text lists, bullet lists, or inline slash-separated options.

**Every selection question offers 3-4 concrete options:**
- Concrete means a specific, named choice -- not a category or vague label
- Do not create a custom "Other" option -- AskUserQuestion provides a native "Other" (free-form) field that handles the "user wants something not listed" case automatically

**Each option has two parts:**
- **Label:** A concise name for the option (2-6 words maximum). Technical product names stay in English (e.g., "SvelteKit", "Bun", "Postgres") even when the session language is not English. Non-technical labels are translated to the session language.
- **Description:** An inline explanation in the session language. For technical options, use the pro/contra format (see Section 4). For non-technical options (preset selection, execution mode), describe the behavioral impact.

**AskUserQuestion field constraints:**
- `header`: 3-10 characters, keep it tight
- `question`: the selection question in the session language
- `options`: array of objects, each with `label` and `description`
- Maximum 4 options (AskUserQuestion limit), plus the native "Other" field

---

## 2. Ordering Rules

**Primary rule: Order by fitness for the user's specific project context.**

Fitness is determined by:
1. **Auto-detected stack** (highest priority): if the user's project already uses a technology, present it as the first option with a note "already in use" in its description. Zero migration cost outranks abstract preference.
2. **Project type and goals**: a CLI tool has different fitness criteria than a web app.
3. **Modern-and-mainstream preference** (default when context is neutral): see table below.

**The "modern and mainstream" principle:**
Well-maintained, actively developed technologies with growing adoption appear before legacy alternatives. "Modern and mainstream" means proven-modern -- not bleeding-edge experimental, not legacy. Think tools with strong DX, active maintenance, and real community adoption.

**Default preference order by category (archetypes, not exhaustive):**

| Category | Preference Order |
|---|---|
| Package managers | Bun > pnpm > npm > yarn |
| Runtimes | Bun > Node.js > Deno |
| Frontend frameworks | SvelteKit > Next.js > Nuxt > Angular |
| CSS | Tailwind > CSS Modules > styled-components > plain CSS |
| Databases (relational) | Postgres > MySQL > SQLite (embedded: SQLite first) |
| Databases (document) | MongoDB (situational -- present when document model fits) |
| ORMs | Drizzle > Prisma > TypeORM |
| Testing frameworks | Vitest > Jest > Bun test > Mocha |
| Linting/formatting | Biome > ESLint + Prettier |
| Build tools | Vite > Webpack > Rollup |

**Context-awareness overrides default ordering:**
- If the user's `package.json` has npm scripts, npm ranks higher for that project
- If the user stated a constraint ("must use MySQL"), that choice goes first regardless of the table above
- If the user selected a framework that has a canonical tool (e.g., SvelteKit projects commonly use Vite), that tool leads
- Auto-detected stack always takes precedence over generic preference

---

## 3. "Fai tu" / AI Decides Rules

**"Fai tu" is always the last option in the AskUserQuestion list.**

### When to include "fai tu"

**Include on technical and opinionated questions:**
- Runtime, package manager, framework, library choice
- Database, ORM, query builder
- Testing framework, linter, formatter, build tool
- Styling approach, CSS strategy
- Deployment target, hosting provider
- Any question where Claude can reason about best fit

**Omit on personal and creative questions:**
- Project name
- Project description or elevator pitch
- Main objective / core value
- Team size, timeline, budget
- Any question where the answer is fundamentally personal or organizational

### Label and description for "fai tu"

The "fai tu" option label is translated to the session language. Use the translation table from `@skills/shared/interview-language.md`:

| Language | Label |
|---|---|
| EN | AI decides |
| IT | Fai tu |
| ES | Tú decides |
| FR | L'IA choisit |
| DE | KI entscheidet |
| PT | IA decide |

The "fai tu" option description is also translated. Examples:
- EN: "Claude picks the best option for your project."
- IT: "Claude sceglie la migliore per il tuo progetto."
- ES: "Claude elige la mejor opción para tu proyecto."
- FR: "Claude choisit la meilleure option pour ton projet."
- DE: "Claude wählt die beste Option für dein Projekt."
- PT: "Claude escolhe a melhor opção para o seu projeto."

### When user selects "fai tu"

Claude evaluates the **full project context** before choosing:
- Auto-detected tech stack and existing dependencies
- Stated project goals and requirements
- Constraints (performance, compliance, team skill)
- Decisions already made earlier in the interview

The choice is NOT mechanically the first option in the list. Claude reasons about the specific scenario. A greenfield TypeScript project and an existing Node.js monorepo may get different answers to the same question.

**After choosing, communicate briefly:**
> What was chosen + a one-line rationale.

Examples:
- IT: "Ho scelto Bun -- runtime moderno con package manager integrato, perfetto per un progetto TypeScript greenfield."
- EN: "I chose Vitest -- native Vite integration, faster than Jest for your setup."

**In the end-of-interview summary**, AI-chosen items are visually marked. Append `(fai tu)` in Italian sessions or `(AI)` in English sessions -- or use the session-language equivalent -- so the user knows which decisions were delegated vs personally chosen.

Example summary line:
```
Runtime: Bun (fai tu) -- scelto per velocità e DX moderna
Database: Postgres (AI) -- standard affidabile per progetti relazionali
```

---

## 4. Per-Option Explanation Format

**Every concrete option includes a structured explanation in the AskUserQuestion `description` field.**

### For technical options

Use the inline compact pro/contra format. Single line, no newlines inside the description field.

**Format:** `"Pro: {advantages}. Contro: {drawbacks}."`

The word "Contro" (or its session-language equivalent) signals the tradeoff. Use the session language for the explanation text; technical names (framework names, CLI names, etc.) stay in English.

**Examples for a frontend framework question (IT session):**
- SvelteKit: `"Pro: veloce, DX moderna, bundle piccolo. Contro: ecosistema più piccolo di React."`
- Next.js: `"Pro: ecosistema enorme, SSR/SSG maturo, molti tutorial. Contro: vendor lock-in Vercel, bundle più pesante."`
- Nuxt: `"Pro: DX simile a Next per Vue, auto-imports, buon SSR. Contro: comunità più piccola."`

**Examples for a runtime question (EN session):**
- Bun: `"Pro: fast runtime + package manager in one, TypeScript native, ESM first. Con: younger ecosystem than Node.js."`
- Node.js: `"Pro: massive ecosystem, universal hosting support, battle-tested. Con: slower startup, npm complexity."`
- Deno: `"Pro: built-in TypeScript, secure by default, modern stdlib. Con: smaller ecosystem, less hosting support."`

**Translations of "Pro" and "Contro" by language:**

| Language | Pro | Contra |
|---|---|---|
| EN | Pro | Con |
| IT | Pro | Contro |
| ES | Pro | Contra |
| FR | Avantages | Inconvénients |
| DE | Vorteile | Nachteile |
| PT | Prós | Contras |

### For non-technical options

Describe the behavioral impact instead of pro/contra. Single line.

Examples:
- "YOLO" execution mode: `"Autonomous execution -- Claude proceeds without confirmation prompts."`
- "Interactive" execution mode: `"Claude confirms before each major action -- slower but more control."`
- "Comprehensive" depth: `"Deep research and thorough planning. Recommended for complex or long-running projects."`

### For detected/existing technology

When the user's auto-detected stack includes the option, prefix the description:
`"Already in use -- zero migration cost. Pro: {advantages}. Contro: {drawbacks}."`

---

## 5. AskUserQuestion Integration Notes

**Slot allocation with "fai tu":**
- AskUserQuestion supports up to 4 options plus a native "Other" free-form field
- When "fai tu" is included: 3 concrete options + "fai tu" = 4 options (maximum)
- When "fai tu" is omitted (personal/creative questions): up to 4 concrete options

**If more than 3 strong alternatives exist:**
1. Choose the top 3 by fitness for the user's project context
2. Let the native "Other" field handle any alternative not in the list
3. Never exceed 4 options in the options array -- this breaks AskUserQuestion

**Header field guidelines:**
- Keep to 3-10 characters per AskUserQuestion constraints
- Use a concise noun: "Runtime", "Database", "Testing", "CSS", "Deploy", "ORM"
- In non-English sessions, you may translate the header or keep it English -- Claude's discretion based on session language and term recognizability

**Question field guidelines:**
- Write in the session language
- Frame as a direct question: "What runtime will this project use?"
- Keep it short -- the options carry the detail

**Example AskUserQuestion call structure (illustrative, IT session):**
```
header: "Runtime"
question: "Quale runtime userà questo progetto?"
options:
  - label: "Bun"
    description: "Pro: runtime veloce con package manager integrato, TypeScript nativo. Contro: ecosistema più giovane di Node."
  - label: "Node.js"
    description: "Pro: ecosistema enorme, supporto hosting universale, battle-tested. Contro: avvio più lento, npm più complesso."
  - label: "Deno"
    description: "Pro: TypeScript built-in, sicuro per default, stdlib moderna. Contro: ecosistema più piccolo, meno supporto hosting."
  - label: "Fai tu"
    description: "Claude sceglie la migliore per il tuo progetto."
```

**Never use AskUserQuestion with a single option.** If there is only one reasonable choice, state it directly and confirm with a yes/no or freeform question instead.
