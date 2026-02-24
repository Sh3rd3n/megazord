---
name: discuss
description: Socratic brainstorming to explore approaches before implementation
disable-model-invocation: false
---

# /mz:discuss

Facilitate Socratic brainstorming that explores 5+ alternative approaches before converging on a direction. Produces CONTEXT.md-compatible output for downstream planning. Works both within phase context and as standalone brainstorming.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/shared/interview-language.md` for language detection and session-wide persistence rules.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > DISCUSS                           |
+===============================================+
```

## Step 1b: Language Detection

Detect the user's language from their first natural-language message following the rules in `@skills/shared/interview-language.md`.

Apply the detected language to all Socratic dialogue: seed questions, challenges, suggestions, summaries, convergence prompts, and the final output document's prose sections.

Keep in English: file paths, CONTEXT.md section headers (`<domain>`, `<decisions>`, `<specifics>`, `<deferred>`), technical terms, and command names.

## Step 2: Determine Context

Parse the user's invocation to determine where output will be written.

**Phase context detection (in priority order):**

1. **Explicit phase number** -- user provides a phase number (e.g., `/mz:discuss 7`):
   - Read `.planning/STATE.md` to resolve the phase directory
   - Target: `{phase_dir}/{padded}-CONTEXT.md` (e.g., `.planning/phases/07-quality-and-debugging-skills/07-CONTEXT.md`)

2. **Active phase** -- no explicit number, but a phase is in progress:
   - Read `.planning/STATE.md` for current position
   - If a phase is active (status is "In Progress"): target that phase's CONTEXT.md
   - If the phase CONTEXT.md already exists, note it will be overwritten

3. **Standalone** -- no phase context at all:
   - Target: `.planning/brainstorms/{YYYY-MM-DD}-{slug}.md`
   - Create `.planning/brainstorms/` directory if it does not exist
   - Generate `{slug}` from the topic (lowercase, hyphens, max 40 chars)

Display the output target:

```
> Output: {target file path}
```

Extract the topic from the user's message (text after `/mz:discuss` and any phase number). If no topic is provided, ask the user what they want to brainstorm about before proceeding.

## Step 3: Seed the Conversation

Ask the user a probing SEED question about their topic. This is NOT a generic "what do you want?" -- it is a question that:

- Demonstrates understanding of the topic domain
- Challenges an implicit assumption the user may hold
- Opens an exploration angle that reveals constraints or trade-offs

**Good seed examples:**

- Topic "authentication approach" -- "Before we explore approaches -- what's your threat model? Are we protecting user data from external attackers, or also from other authenticated users?"
- Topic "database choice" -- "What's the read/write ratio you're expecting? That changes which options are even viable."
- Topic "monorepo vs polyrepo" -- "How many teams will contribute to this codebase, and do they deploy independently? That's the real forcing function here."

**Bad seeds (avoid):**

- "What kind of authentication do you want?" (too generic, no challenge)
- "Tell me more about your project." (interviewer tone)
- "Here are 5 options: 1. JWT 2. Sessions 3. OAuth..." (numbered lists, not Socratic)

## Step 4: Iterative Dialogue

Maintain an internal counter of distinct approaches explored. For each exchange with the user:

1. **Listen** -- understand what the user said, identify the core idea
2. **Challenge** -- find an assumption in their answer and probe it: "What if {assumption} wasn't true? How would that change your approach?"
3. **Suggest** -- offer an alternative angle: "Have you considered {approach}? It handles {specific concern} differently."
4. **Build** -- extend their ideas: "Building on that, what if you combined {their idea} with {new element}?"
5. **Track** -- count each distinct approach explored (an approach counts as distinct when it differs in architecture, trade-offs, or core mechanism)

**Tone rules:**

- Thinking partner, not interviewer -- build iteratively on what the user says
- No numbered option lists -- weave alternatives into natural dialogue
- Genuine curiosity -- "That's interesting because..." not "Great idea!"
- Direct when challenging -- "That approach has a problem: {evidence}" not "That might possibly have some issues"

**Convergence triggers:**

After at least 5 distinct approaches have been explored, pause the Socratic dialogue and display a **structured checkpoint** — NOT a bare nudge:

```
### Discussion Checkpoint

{Summary of decisions taken so far — Claude's discretion: bullets if 1-3 decisions, short paragraph if 4+}

**Approaches explored:** {N}
**Decisions so far:** {list key decisions/directions that emerged}

Want to go deeper, or ready to move on?
```

The skill does NOT force convergence — the user may want to explore more.

Soft limit: after 10-15 exchanges without convergence, use the same checkpoint format with stronger framing: "We've covered significant ground. Here's where we are:" followed by the structured checkpoint block.

**Key rule:** The checkpoint is a structured format for clarity. The dialogue BEFORE the checkpoint stays fully Socratic. Do NOT make the entire dialogue structured — only the checkpoint moments.

## Step 5: Convergence

**If user responds "go deeper"** (or equivalent: "more", "continue", "keep going"):
- Return to Step 4 Socratic dialogue immediately
- No summary table yet — that comes at the next checkpoint

**If user responds "ready"** (or equivalent: "done", "let's move on", "ship it"):
- Write CONTEXT.md directly — NO preview or confirmation step
- Skip the approach comparison table
- Extract decisions from the discussion, organize into CONTEXT.md sections, write the file
- Jump to Step 6 output confirmation

**If user picks a specific direction or asks for the summary table:**
- Show the approach comparison table:

  | Approach | Strengths | Weaknesses |
  |----------|-----------|------------|
  | {approach 1} | {strengths} | {weaknesses} |
  | {approach 2} | {strengths} | {weaknesses} |
  | ... | ... | ... |

  Present the table in the session language. Column headers and approach names may mix English technical terms with session-language descriptions.
- Ask: "Want to go with this direction, or explore more?"
- If they confirm a direction, proceed to CONTEXT.md write
- If they want to explore more, return to Step 4

## Step 6: Output

Write the output file using the CONTEXT.md format (compatible with /mz:plan and /gsd:discuss-phase output):

```markdown
# {Topic} - Context

**Gathered:** {YYYY-MM-DD}
**Status:** Ready for planning

<domain>
## Phase Boundary

{Concise description of the decision scope -- what this brainstorming session covered}
</domain>

<decisions>
## Implementation Decisions

### {Decision 1 Title}
- {Bullet point detail}
- {Bullet point detail}

### {Decision 2 Title}
- {Bullet point detail}

### Claude's Discretion
{Areas explicitly left to implementer judgment -- things discussed but not locked}
</decisions>

<specifics>
## Specific Ideas

- {Concrete implementation idea from the discussion}
- {Another specific idea}
- {Technical detail worth preserving}
</specifics>

<deferred>
## Deferred Ideas

{Ideas explicitly deferred during discussion -- "None" if nothing was deferred}
</deferred>
```

Display confirmation:

```
> Context written to {file path}
> {N} approaches explored, {M} decisions locked
```

## Step 7: Next Up

**If phase context (active phase or explicit phase number):**

```
## Next Up

**Plan Phase {N}: {Phase Name}** — turn decisions into executable tasks
`/mz:plan {N}`

<sub>`/clear` — start fresh context for the next step</sub>
```

**If standalone (no phase context):**

```
## Next Up

**Use this context** — reference {output file path} in your next planning session

<sub>`/clear` — start fresh context for the next step</sub>
```

## Key Behaviors

- **Minimum 5 alternative approaches** explored before convergence is offered (user decision -- overrides default of 3)
- **Socratic dialogue** throughout: probing questions, not questionnaires or numbered lists
- **Thinking partner tone**: build on ideas, challenge assumptions, genuine curiosity
- **Structured checkpoints at convergence moments**: summary of decisions taken + "Want to go deeper?" — NOT a bare nudge
- **"Ready" shortcut**: if user says "ready" (or equivalent), write CONTEXT.md directly without preview or confirmation
- **Output format**: CONTEXT.md compatible (domain/decisions/specifics/deferred sections)
- **Works standalone**: brainstorm without any project or phase context, output to `.planning/brainstorms/`
- **No auto-trigger**: this skill is manually invoked by the user (not triggered automatically during execution)
- **Session language**: Detect from first message, apply to all dialogue output per `@skills/shared/interview-language.md`

## Error Handling

| Error | Step | Action |
|-------|------|--------|
| No topic provided | Step 2 | Ask the user what they want to brainstorm about. Do not proceed without a topic. |
| STATE.md missing | Step 2 | Fall back to standalone mode. Output to `.planning/brainstorms/`. |
| Phase directory missing | Step 2 | Create the directory, or fall back to standalone mode if creation fails. |
| User disengages | Step 4 | After 2 unanswered prompts, offer to converge with what has been explored so far. |

## Notes

- ALWAYS use bun/bunx for any JavaScript/TypeScript operations (never npm/npx).
- The output format is intentionally identical to `/gsd:discuss-phase` output for backward compatibility.
- When overwriting an existing CONTEXT.md, preserve any content not covered by this session by noting it in the deferred section.
- The 5-approach minimum is a floor, not a ceiling. Rich topics may explore 8-10+ approaches.
