# Map Skill Agents

Agent definitions and spawning patterns used by the /mz:map skill. The skill reads the agent file, resolves the model from config, updates the agent frontmatter, and spawns via registered subagent name.

## Mapper Agent

- **File:** `{plugin_path}/agents/mz-mapper.md` (read this file and embed content in Task prompt; `{plugin_path}` is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`)
- **Purpose:** Analyze an existing codebase for a specific focus area and write structured documents
- **Model:** Determined by `resolveAgentModel(config, 'mapper')` -- config profile mapping with optional override
- **Spawning:** Task tool with `subagent_type="mz-mapper"` (fallback: `"general-purpose"` with inline agent definition in `<agent_role>` tags)
- **Output:** Documents written directly to `.planning/codebase/`

## Focus Areas

| Focus | Alias | Documents Produced |
|-------|-------|--------------------|
| tech | (none) | STACK.md, INTEGRATIONS.md |
| architecture | arch | ARCHITECTURE.md, STRUCTURE.md |
| quality | conventions | CONVENTIONS.md, TESTING.md |
| concerns | (none) | CONCERNS.md |

**Synthesis** (special): After all 4 areas complete, a synthesis agent reads all 7 docs and produces SUMMARY.md.

## Model Selection

The orchestrator resolves the model before spawning and updates the agent file's YAML frontmatter. This uses `resolveAgentModel(config, 'mapper')` from `src/lib/config.ts`.

| Profile    | Mapper Model |
|------------|-------------|
| quality    | opus        |
| balanced   | sonnet      |
| budget     | haiku       |

Per-agent override (`model_overrides.mapper`) wins over profile mapping when set and not `"inherit"`.

## Parallel Spawning Pattern

The orchestrator spawns one Task per focus area, all in parallel. Each agent uses the same registered subagent name (frontmatter already updated with the resolved model).

```
# 1. Read agent definition ONCE (reuse for all spawns)
Read {plugin_path}/agents/mz-mapper.md -> mapper_instructions

# 2. Resolve model and update agent frontmatter
resolved_model = resolveAgentModel(config, 'mapper')
  # Check model_overrides.mapper -> if set and not "inherit", use it
  # Otherwise: quality->opus, balanced->sonnet, budget->haiku
Rewrite model line in {plugin_path}/agents/mz-mapper.md:
  model: inherit  ->  model: {resolved_model}

# 3. Spawn all 4 agents in parallel with registered subagent name
Task(
  prompt="<focus>tech</focus>
  <output_dir>.planning/codebase/</output_dir>
  <instructions>Analyze this codebase for technology stack and external integrations.
  Write STACK.md and INTEGRATIONS.md to the output directory.
  Explore thoroughly. Write documents directly. Return confirmation only.</instructions>",
  subagent_type="mz-mapper",
  description="Map codebase: tech"
)

Task(
  prompt="<focus>architecture</focus>
  <output_dir>.planning/codebase/</output_dir>
  <instructions>Analyze this codebase for architecture and project structure.
  Write ARCHITECTURE.md and STRUCTURE.md to the output directory.
  Explore thoroughly. Write documents directly. Return confirmation only.</instructions>",
  subagent_type="mz-mapper",
  description="Map codebase: architecture"
)

Task(
  prompt="<focus>quality</focus>
  <output_dir>.planning/codebase/</output_dir>
  <instructions>Analyze this codebase for code conventions and testing patterns.
  Write CONVENTIONS.md and TESTING.md to the output directory.
  Explore thoroughly. Write documents directly. Return confirmation only.</instructions>",
  subagent_type="mz-mapper",
  description="Map codebase: quality"
)

Task(
  prompt="<focus>concerns</focus>
  <output_dir>.planning/codebase/</output_dir>
  <instructions>Analyze this codebase for technical debt, fragile areas, and concerns.
  Write CONCERNS.md to the output directory.
  Explore thoroughly. Write documents directly. Return confirmation only.</instructions>",
  subagent_type="mz-mapper",
  description="Map codebase: concerns"
)

# 4. Fallback (if subagent_type="mz-mapper" fails for any spawn)
Task(
  prompt="<agent_role>{mapper_instructions}</agent_role>
  <focus>{area}</focus>
  ... (same context as above) ...",
  subagent_type="general-purpose",
  description="Map codebase: {area}"
)
```

## Synthesis Agent Spawning

After all 4 mapper agents complete, spawn the synthesis agent. This only runs when ALL areas were mapped (not on focused single-area runs). The model is already set from the frontmatter update above.

```
Task(
  prompt="<focus>synthesis</focus>
  <output_dir>.planning/codebase/</output_dir>
  <instructions>Read all 7 documents in .planning/codebase/ (STACK.md, INTEGRATIONS.md,
  ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md).
  Produce a compact executive SUMMARY.md with cross-cutting insights.
  Write SUMMARY.md to the output directory. Return confirmation only.</instructions>",
  subagent_type="mz-mapper",
  description="Map codebase: synthesis"
)

# Fallback (if subagent_type="mz-mapper" fails)
Task(
  prompt="<agent_role>{mapper_instructions}</agent_role>
  <focus>synthesis</focus>
  ... (same context as above) ...",
  subagent_type="general-purpose",
  description="Map codebase: synthesis"
)
```

## Critical: @file References Do NOT Work Across Task Boundaries

The Task tool spawns a fresh subagent session. `@file` references in the parent skill's prompt are NOT resolved in the subagent's context. The subagent cannot read files referenced with `@` -- it only receives the literal text of the Task prompt.

**The map skill MUST follow this pattern:**

1. **Read** `{plugin_path}/agents/mz-mapper.md` into memory BEFORE spawning any Tasks
2. **Embed** the agent definition as inline text in every Task prompt
3. **Never** use `@agents/mz-mapper.md` inside Task prompts -- it will be treated as literal text

This is the same pattern used by /mz:plan (see `skills/plan/agents.md`) and /mz:verify (see `skills/verify/verifier.md`).
