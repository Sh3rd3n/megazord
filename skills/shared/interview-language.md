---
name: interview-language
description: Language detection, session persistence, and prompt injection rules for all Megazord interview skills
---

# Interview Language Handling

Shared reference for all Megazord skills that conduct interviews. Defines how to detect the user's language, persist it for the session, and apply it to interview output without affecting generated file content.

## 1. Detection Rules

Detect the user's language from their **first natural-language message** in the session. Apply these rules in order:

1. **Slash-command-only first message:** If the user's first interaction is a bare command like `/mz:init` or `/mz:plan` with no natural-language text, wait for the next message that contains natural language and detect from that.

2. **Dominant language wins:** Evaluate the overall language of the message. Ignore technical terms (framework names, package names, command names, code snippets) when making the determination — they do not count as evidence for English or any other language.

3. **Ambiguity defaults to English:** If the first natural-language message is very short (1-2 words), consists entirely of technical terms, or contains genuinely mixed language without a clear dominant language, default to English.

4. **One detection per session:** Language is detected exactly once — from the first qualifying message. All subsequent messages are irrelevant to language selection.

## 2. Persistence Rules

- Language is **set once** at session start and does **not change**, even if the user switches to a different language mid-conversation.
- Persistence is **conversational only** — implemented as an instruction embedded in the skill's response behavior (prompt injection). There is no config file, environment variable, state file, or any other persistent storage mechanism.
- The detected language travels with the skill's running context for the duration of the session.

## 3. Prompt Injection Template

Include this block verbatim in skill response behavior instructions (or adapt to fit the skill's format):

```
## Language Handling
Detect the user's language from their first natural-language message in this session.
Once detected, respond in that language for ALL interview output: questions, option labels,
option descriptions, explanations, summaries, and error messages.

Keep in English: file names, directory paths, command names, technical identifiers,
config keys, code snippets, commit messages, and generated file content.

If language cannot be determined from the first message, default to English.
Do not switch language mid-session even if the user changes language.
```

## 4. "Fai Tu" (AI Decides) Label Translation

The "AI decides" option label must be translated to match the session language. Use these translations:

| Language   | Label              | Notes                              |
|------------|--------------------|------------------------------------|
| English    | "AI decides"       | Default                            |
| Italian    | "Fai tu"           | Literally "you do it" — idiomatic  |
| Spanish    | "Tú decides"       | Literally "you decide"             |
| French     | "L'IA choisit"     | Literally "the AI chooses"         |
| German     | "KI entscheidet"   | Literally "AI decides"             |
| Portuguese | "IA decide"        | Literally "AI decides"             |

For languages not listed: translate the concept **"the AI chooses the best option for you"** idiomatically — do not transliterate. Use whatever phrasing sounds natural for that language.

The "fai tu" option also requires a brief description in the session language. Example in Italian: "Claude sceglie la migliore per il tuo progetto." Example in English: "Claude picks the best option for your project."

## 5. Scope Boundary

### Translatable (follows session language)

- AskUserQuestion `question` text
- AskUserQuestion option labels and option descriptions
- Section headers and body text in interview summaries
- Confirmation messages, acknowledgments, and follow-up questions
- Error messages and guidance text displayed to the user during the interview
- The "fai tu" / AI-decides label and its description

### Not Translatable (always English)

- File names and directory paths (`.planning/`, `skills/`, `megazord.config.json`, etc.)
- Config keys and values in `megazord.config.json`
- Section headers in machine-readable files (`PROJECT.md`, `STATE.md`, `PLAN.md`, `SUMMARY.md`)
- Command names (`/mz:*`, `/gsd:*`)
- Technical identifiers and proper nouns (TDD, CORTEX, YOLO, Bun, SvelteKit, Postgres, etc.)
- Generated code and commit messages
- User-provided content captured verbatim (requirements, constraints, decisions as stated by the user — do not translate their words)
