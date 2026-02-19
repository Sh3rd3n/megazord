# Plan Skill Agents

Agent definitions used by the /mz:plan skill. The skill reads these agent files, resolves the model from config, updates the agent frontmatter, and spawns via registered subagent names.

## Researcher Agent

- **File:** `{plugin_path}/agents/mz-researcher.md` (read this file and embed content in Task prompt; `{plugin_path}` is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`)
- **Purpose:** Research the technical landscape for a phase before planning begins
- **Model:** Determined by `resolveAgentModel(config, 'researcher')` -- config profile mapping with optional override
- **Spawning:** Task tool with `subagent_type="mz-researcher"` (fallback: `"general-purpose"` with inline agent definition in `<agent_role>` tags)
- **Output:** `{phase_dir}/{padded}-RESEARCH.md`
- **When to skip:** `--skip-research` flag, or existing RESEARCH.md in phase directory, or `workflow.research` is false in config

## Planner Agent

- **File:** `{plugin_path}/agents/mz-planner.md` (read this file and embed content in Task prompt; `{plugin_path}` is resolved from `config.plugin_path`, falling back to `~/.claude/plugins/mz`)
- **Purpose:** Decompose a phase into executable PLAN.md files with tasks, dependencies, and waves
- **Model:** Determined by `resolveAgentModel(config, 'planner')` -- note: balanced profile uses opus for planner (differentiated)
- **Spawning:** Task tool with `subagent_type="mz-planner"` (fallback: `"general-purpose"` with inline agent definition in `<agent_role>` tags)
- **Output:** `{phase_dir}/{padded}-{NN}-PLAN.md` files (e.g., `03-01-PLAN.md`, `03-02-PLAN.md`)
- **Input:** Requires research findings, project state, roadmap, and context decisions

## Critical: @file References Do NOT Work Across Task Boundaries

The Task tool spawns a fresh subagent session. `@file` references in the parent skill's prompt are NOT resolved in the subagent's context. The subagent cannot read files referenced with `@` -- it only receives the literal text of the Task prompt.

**The plan skill MUST follow this pattern:**

1. **Read** all needed files into memory BEFORE spawning the Task:
   - Agent definition file (agents/mz-researcher.md or agents/mz-planner.md)
   - STATE.md content
   - ROADMAP.md content (or the relevant phase section)
   - CONTEXT.md content (if exists)
   - RESEARCH.md content (for the planner)
   - megazord.config.json content

2. **Embed** all file contents as inline text in the Task prompt string:
   ```
   Task(
     prompt="<agent_role>{agent_definition_content}</agent_role>
     <project_state>{state_content}</project_state>
     <roadmap>{roadmap_section}</roadmap>
     <context>{context_content}</context>
     <output_path>{phase_dir}</output_path>",
     subagent_type="general-purpose",
     description="Research Phase {N}: {Name}"
   )
   ```

3. **Never** use `@file` references inside the Task prompt -- they will be treated as literal text, not file references.

## Model Selection

The /mz:plan skill resolves and applies the correct model before spawning each agent. This uses the `resolveAgentModel()` function from `src/lib/config.ts`.

### Profile Mapping

| Profile    | Researcher | Planner   |
|------------|------------|-----------|
| quality    | opus       | opus      |
| balanced   | sonnet     | opus (*)  |
| budget     | haiku      | sonnet (*)|

(*) Planner is differentiated: promoted one tier for better reasoning quality in plan creation.

### Override Precedence

1. **Per-agent override** (`model_overrides.researcher` / `model_overrides.planner`) wins if set and not `"inherit"`
2. **Profile mapping** applies otherwise (see table above)

### Frontmatter Rewriting

Skills update the `model` field in the agent `.md` file's YAML frontmatter before spawning:
1. Read the agent file (e.g., `{plugin_path}/agents/mz-researcher.md`)
2. Resolve the model via config profile + overrides
3. Rewrite the `model: {value}` line in the frontmatter (e.g., `model: inherit` -> `model: opus`)
4. Spawn with `subagent_type="mz-researcher"` (Claude Code reads the updated frontmatter)

**Session restart caveat:** If Claude Code caches agent definitions, model changes may require a session restart to take effect.

## Spawning Examples

### Researcher Spawning (Model-Aware)

```
# 1. Read files
Read {plugin_path}/agents/mz-researcher.md -> researcher_instructions
Read .planning/STATE.md -> state_content
Read .planning/ROADMAP.md -> roadmap_content
Read {phase_dir}/{padded}-CONTEXT.md -> context_content (if exists)
Read .planning/megazord.config.json -> config

# 2. Resolve model and update agent frontmatter
resolved_model = resolveAgentModel(config, 'researcher')
  # Check model_overrides.researcher -> if set and not "inherit", use it
  # Otherwise: quality->opus, balanced->sonnet, budget->haiku
Rewrite model line in {plugin_path}/agents/mz-researcher.md:
  model: inherit  ->  model: {resolved_model}

# 3. Spawn with registered subagent name
Task(
  prompt="<objective>Research Phase {N}: {Name}</objective>

<project_state>{state_content}</project_state>

<roadmap_phase>{relevant_phase_section}</roadmap_phase>

<context_decisions>{context_content}</context_decisions>

<output>Write research to: {phase_dir}/{padded}-RESEARCH.md</output>",
  subagent_type="mz-researcher",
  description="Research Phase {N}: {Name}"
)

# 4. Fallback (if subagent_type="mz-researcher" fails)
Task(
  prompt="<agent_role>{researcher_instructions}</agent_role>
  ... (same context as above) ...",
  subagent_type="general-purpose",
  description="Research Phase {N}: {Name}"
)
```

### Planner Spawning (Model-Aware)

```
# 1. Read files
Read {plugin_path}/agents/mz-planner.md -> planner_instructions
Read .planning/STATE.md -> state_content
Read .planning/ROADMAP.md -> roadmap_content
Read {phase_dir}/{padded}-RESEARCH.md -> research_content
Read {phase_dir}/{padded}-CONTEXT.md -> context_content (if exists)
Read .planning/megazord.config.json -> config_content

# 2. Resolve model and update agent frontmatter
resolved_model = resolveAgentModel(config, 'planner')
  # Check model_overrides.planner -> if set and not "inherit", use it
  # Otherwise: quality->opus, balanced->opus, budget->sonnet (differentiated!)
Rewrite model line in {plugin_path}/agents/mz-planner.md:
  model: inherit  ->  model: {resolved_model}

# 3. Spawn with registered subagent name
Task(
  prompt="<objective>Plan Phase {N}: {Name}</objective>

<project_state>{state_content}</project_state>

<roadmap_phase>{relevant_phase_section}</roadmap_phase>

<research>{research_content}</research>

<context_decisions>{context_content}</context_decisions>

<config>{config_content}</config>

<requirements>Cover these requirement IDs: {comma-separated IDs}</requirements>

<output>Write plans to: {phase_dir}/</output>",
  subagent_type="mz-planner",
  description="Plan Phase {N}: {Name}"
)

# 4. Fallback (if subagent_type="mz-planner" fails)
Task(
  prompt="<agent_role>{planner_instructions}</agent_role>
  ... (same context as above) ...",
  subagent_type="general-purpose",
  description="Plan Phase {N}: {Name}"
)
```
