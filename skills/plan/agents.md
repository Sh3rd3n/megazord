# Plan Skill Agents

Agent definitions used by the /mz:plan skill. The skill reads these files and embeds their content in Task tool prompts.

## Researcher Agent

- **File:** agents/mz-researcher.md (read this file and embed content in Task prompt)
- **Purpose:** Research the technical landscape for a phase before planning begins
- **Spawning:** Task tool with `subagent_type="general-purpose"`
- **Output:** `{phase_dir}/{padded}-RESEARCH.md`
- **When to skip:** `--skip-research` flag, or existing RESEARCH.md in phase directory, or `workflow.research` is false in config

## Planner Agent

- **File:** agents/mz-planner.md (read this file and embed content in Task prompt)
- **Purpose:** Decompose a phase into executable PLAN.md files with tasks, dependencies, and waves
- **Spawning:** Task tool with `subagent_type="general-purpose"`
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

## Spawning Examples

### Researcher Spawning

```
# Read files first
Read agents/mz-researcher.md -> researcher_instructions
Read .planning/STATE.md -> state_content
Read .planning/ROADMAP.md -> roadmap_content
Read {phase_dir}/{padded}-CONTEXT.md -> context_content (if exists)

# Spawn with all content inline
Task(
  prompt="<agent_role>{researcher_instructions}</agent_role>

<objective>Research Phase {N}: {Name}</objective>

<project_state>{state_content}</project_state>

<roadmap_phase>{relevant_phase_section}</roadmap_phase>

<context_decisions>{context_content}</context_decisions>

<output>Write research to: {phase_dir}/{padded}-RESEARCH.md</output>",
  subagent_type="general-purpose",
  description="Research Phase {N}: {Name}"
)
```

### Planner Spawning

```
# Read files first
Read agents/mz-planner.md -> planner_instructions
Read .planning/STATE.md -> state_content
Read .planning/ROADMAP.md -> roadmap_content
Read {phase_dir}/{padded}-RESEARCH.md -> research_content
Read {phase_dir}/{padded}-CONTEXT.md -> context_content (if exists)
Read .planning/megazord.config.json -> config_content

# Spawn with all content inline
Task(
  prompt="<agent_role>{planner_instructions}</agent_role>

<objective>Plan Phase {N}: {Name}</objective>

<project_state>{state_content}</project_state>

<roadmap_phase>{relevant_phase_section}</roadmap_phase>

<research>{research_content}</research>

<context_decisions>{context_content}</context_decisions>

<config>{config_content}</config>

<requirements>Cover these requirement IDs: {comma-separated IDs}</requirements>

<output>Write plans to: {phase_dir}/</output>",
  subagent_type="general-purpose",
  description="Plan Phase {N}: {Name}"
)
```
