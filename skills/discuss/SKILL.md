---
name: discuss
description: Socratic brainstorming to explore approaches before implementation
disable-model-invocation: false
---

# /mz:discuss

Facilitate Socratic brainstorming that explores 5+ alternative approaches before converging on a direction. Produces CONTEXT.md-compatible output for downstream planning. Works both within phase context and as standalone brainstorming.

Reference `@skills/init/design-system.md` for visual output formatting.

## Step 1: Display Banner

Output the stage banner:

```
+===============================================+
|  MEGAZORD > DISCUSS                           |
+===============================================+
```

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

- After at least 5 distinct approaches have been explored, the skill MAY suggest moving to convergence: "We've explored {N} different angles. Ready to pick a direction, or want to keep going?"
- The skill does NOT force convergence -- the user may want to explore more
- Soft limit: after 10-15 exchanges without convergence, explicitly nudge: "We've covered a lot of ground ({N} approaches). Want to converge on a direction?"

## Step 5: Convergence

When the user signals readiness to converge (or after the soft-limit nudge):

1. **Summarize** all explored approaches in a concise table:

   | Approach | Strengths | Weaknesses |
   |----------|-----------|------------|
   | {approach 1} | {strengths} | {weaknesses} |
   | {approach 2} | {strengths} | {weaknesses} |
   | ... | ... | ... |

2. **Ask the user** to select one of:
   - Pick a single approach
   - Combine elements from multiple approaches
   - Explore further (return to Step 4)

3. **Record** their selection as the primary decision. If they combine elements, document which elements from which approaches.

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

```
===============================================
> Next Up
{If phase context}: **Plan this phase** -- `/mz:plan`
{If standalone}: **Use this context** -- reference {output file path} in your next planning session
===============================================
```

## Key Behaviors

- **Minimum 5 alternative approaches** explored before convergence is offered (user decision -- overrides default of 3)
- **Socratic dialogue** throughout: probing questions, not questionnaires or numbered lists
- **Thinking partner tone**: build on ideas, challenge assumptions, genuine curiosity
- **Output format**: CONTEXT.md compatible (domain/decisions/specifics/deferred sections)
- **Works standalone**: brainstorm without any project or phase context, output to `.planning/brainstorms/`
- **No auto-trigger**: this skill is manually invoked by the user (not triggered automatically during execution)

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
