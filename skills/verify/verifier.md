# Verification Protocol

Reference file for the /mz:verify skill. Covers spawning protocol, prompt structure, hybrid mode, and state update constraints.

## Spawning Protocol

The /mz:verify orchestrator reads the verifier agent definition and phase context, then embeds everything inline in a Task tool prompt. This is required because @file references do NOT work across Task boundaries.

### Pre-spawn Checklist

Before spawning a verifier subagent, the orchestrator must:

1. **Read** `agents/mz-verifier.md` into memory
2. **Read** all PLAN.md files in the phase directory (extract frontmatter must_haves)
3. **Read** all SUMMARY.md files in the phase directory (extract key accomplishments, files, decisions)
4. **Read** `.planning/ROADMAP.md` for phase goal and success criteria
5. **Read** `.planning/REQUIREMENTS.md` for requirement descriptions (if requirement IDs are mapped)
6. **Compose** the Task prompt with all content embedded inline

### Prompt Structure

The verifier receives a prompt with these sections:

```
<agent_role>
{Full content of agents/mz-verifier.md}
</agent_role>

<phase_goal>
{Phase goal extracted from ROADMAP.md}
</phase_goal>

<success_criteria>
{Numbered list of success criteria from ROADMAP.md}
</success_criteria>

<plans>
{For each PLAN.md in the phase directory:
  - Filename
  - must_haves section from frontmatter (truths, artifacts, key_links)
  - requirements field from frontmatter}
</plans>

<summaries>
{For each SUMMARY.md in the phase directory:
  - Filename
  - Key accomplishments
  - Key files (created and modified)
  - Key decisions}
</summaries>

<requirements>
{Requirement IDs mapped to this phase, with their descriptions from REQUIREMENTS.md}
</requirements>

<verification_rules>
- Phase: {phase_number}
- Phase directory: {phase_dir}
- Report path: {phase_dir}/{padded}-VERIFICATION.md
- Mode: hybrid (automated first, user confirmation for ambiguous)
- Criteria sources: ROADMAP.md success criteria + PLAN.md must_haves
</verification_rules>
```

## Critical Constraint: @-References

@file references do NOT work across Task tool boundaries. The Task tool spawns a fresh agent session. Any `@path/to/file` in the prompt is treated as literal text, not a file reference.

The orchestrator MUST read all files before spawning and embed content inline. The verifier uses the Read tool, Grep tool, Glob tool, and Bash tool to check the actual codebase during verification.

## Hybrid Mode Protocol

The verifier performs automated checks and marks items as PASSED, FAILED, or UNCERTAIN. The orchestrator handles the UNCERTAIN items:

1. **Verifier completes:** Returns structured result with counts and lists of uncertain items.
2. **Orchestrator parses result:** Extracts UNCERTAIN items from the verification report.
3. **Orchestrator presents to user:** Each uncertain item is shown with:
   - What was checked
   - Why it is ambiguous
   - A yes/no/partial question
4. **User responds:** Orchestrator collects responses.
5. **Orchestrator updates report:** Re-writes VERIFICATION.md with user confirmations.
6. **Orchestrator determines final status:**
   - All UNCERTAIN resolved as "yes" + no FAILED items = passed
   - Any UNCERTAIN resolved as "no" or existing FAILED items = gaps_found
   - Any "partial" responses = noted as warnings

### When is UNCERTAIN appropriate?

Items that should be marked UNCERTAIN by the verifier:

- Subjective quality judgment ("is the error handling adequate?")
- Visual/UI verification that cannot be automated
- External service integration testing
- Runtime behavior that requires manual testing
- User experience validation

Items that should NOT be UNCERTAIN:

- File existence (can be checked with `[ -f ]`)
- File content (can be checked with Grep)
- Import/export connections (can be checked with Grep)
- Line count (can be checked with `wc -l`)
- Pattern presence (can be checked with Grep)

## State Update Protocol

Only the orchestrator updates state after verification. The verifier never touches state files.

| Responsibility | Owner |
|---------------|-------|
| Perform verification checks | Verifier |
| Write VERIFICATION.md | Verifier |
| Present UNCERTAIN items to user | Orchestrator |
| Update VERIFICATION.md with user responses | Orchestrator |
| Display results | Orchestrator |
| Suggest next actions | Orchestrator |

Note: The /mz:verify skill does NOT advance phase state or update ROADMAP.md. Phase advancement is handled by /mz:go or manual state management.

## Completion Signal

The verifier returns a structured `## VERIFICATION COMPLETE` message that the orchestrator parses. This message contains:

- Phase number
- Overall status (passed / gaps_found / human_needed)
- Counts for truths, artifacts, key links, requirements
- Lists of gaps and human verification items

The orchestrator uses these counts to display the result summary and determine next steps.
