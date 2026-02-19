---
name: map
description: Analyze existing codebase for brownfield project support
disable-model-invocation: false
---

# /mz:map

Analyze an existing codebase by spawning parallel mapper agents that produce structured analysis documents. Enables brownfield project onboarding by understanding architecture, tech stack, code quality, and concerns.

Reference `@skills/init/design-system.md` for visual output formatting.
Reference `@skills/map/mapper.md` for agent spawning patterns.

## Step 1: Display Banner

Output the stage banner:

```
╔═══════════════════════════════════════════════╗
║  ⚡ MEGAZORD ► MAP                            ║
╚═══════════════════════════════════════════════╝
```

## Step 2: Load Context

Read `.planning/megazord.config.json`. If missing, display an error box and stop:

```
╔═══════════════════════════════════════════════╗
║  ✗ Project Not Initialized                    ║
╠═══════════════════════════════════════════════╣
║  No megazord.config.json found.               ║
║  Run /mz:init to set up your project first.   ║
╚═══════════════════════════════════════════════╝
```

If config exists, continue loading:
- Read `.planning/megazord.config.json` for project settings.

Determine the plugin path:
1. Read `plugin_path` from the config JSON.
2. If `plugin_path` is not set in config, try `~/.claude/plugins/mz`. Check if `~/.claude/plugins/mz/bin/megazord.mjs` exists.
3. If neither exists, display error and stop:
   > Plugin path not configured. Run `/mz:settings` and set `plugin_path`, or re-run `/mz:init`.

Parse the user's message for arguments:
- Optional focus parameter: `/mz:map architecture`, `/mz:map tech`, etc.
- Map focus aliases to canonical names:
  - `arch` -> `architecture`
  - `conventions` -> `quality`
- Valid focus values: `tech`, `architecture`, `quality`, `concerns`
- Default (no argument): run all 4 areas

Display the target:
```
▸ Target
  {focus area name, or "All areas" if no focus specified}
```

## Step 3: Check Existing Map

Check if `.planning/codebase/` directory exists and contains analysis documents.

Use Bash to check: `ls .planning/codebase/*.md 2>/dev/null | wc -l`

**If existing documents found AND no focus parameter was given:**

Use AskUserQuestion to offer 3 options:
- header: "Remap" (5 chars)
- question: "Existing codebase analysis found. What would you like to do?"
- options:
  1. "Refresh" -- delete existing, remap all areas from scratch
  2. "Update" -- keep existing docs, remap all areas (overwrites)
  3. "Skip" -- use existing analysis as-is

Handle each choice:
- **Refresh:** Delete the `.planning/codebase/` directory and recreate it: `rm -rf .planning/codebase/`
- **Update:** Proceed to mapping (agents will overwrite existing files)
- **Skip:** Display "Using existing codebase analysis." and exit

**If existing documents found AND focus parameter was given:**

Use AskUserQuestion:
- header: "Remap" (5 chars)
- question: "Existing analysis found for this area. Update it?"
- options:
  1. "Update" -- remap this specific area (overwrites existing)
  2. "Skip" -- use existing analysis as-is

Handle each choice:
- **Update:** Proceed to mapping the focused area only
- **Skip:** Display "Using existing analysis." and exit

**If no existing documents:** Proceed to mapping.

## Step 4: Create Output Directory

```bash
mkdir -p .planning/codebase/
```

## Step 5: Spawn Mapper Agents

Read the mapper agent definition ONCE and reuse for all spawns:

```
Read {plugin_path}/agents/mz-mapper.md -> mapper_instructions
```

### Resolve Model for Mapper Agents

Before spawning, determine the model for mapper agents:

1. Read `model_profile` and `model_overrides` from the loaded config.
2. Determine the mapper model: check if `model_overrides.mapper` is set and not `"inherit"`. If so, use that value. Otherwise, use the profile mapping: quality->opus, balanced->sonnet, budget->haiku.
3. Update `{plugin_path}/agents/mz-mapper.md` frontmatter `model` field to the resolved value. Use simple string replacement to rewrite the `model: {value}` line.

For each selected focus area, spawn one Task tool agent. Spawn ALL agents in parallel (or just the focused one if a focus parameter was given).

For each agent, the Task prompt must include:
- The focus area in `<focus>` tags
- The output directory in `<output_dir>` tags
- Specific instructions for what documents to write

**Important:** Use `subagent_type="mz-mapper"` for all agents. The agent definition is loaded from the registered agent file (frontmatter already updated with the resolved model). See `@skills/map/mapper.md` for the exact prompt structure.

**Fallback:** If spawning with `subagent_type="mz-mapper"` fails, fall back to `subagent_type="general-purpose"` with the agent definition embedded inline in `<agent_role>` tags.

Display progress for each active agent:
```
▸ Mapping
  ◆ Mapping tech...
  ◆ Mapping architecture...
  ◆ Mapping quality...
  ◆ Mapping concerns...
```

Wait for all agents to complete.

After completion, verify that expected output files exist. Use Bash to check file presence and line counts -- do NOT read the file content:

```bash
wc -l .planning/codebase/STACK.md .planning/codebase/INTEGRATIONS.md .planning/codebase/ARCHITECTURE.md .planning/codebase/STRUCTURE.md .planning/codebase/CONVENTIONS.md .planning/codebase/TESTING.md .planning/codebase/CONCERNS.md 2>/dev/null
```

Update the progress display with results:
```
▸ Mapping
  ✓ tech (STACK.md, INTEGRATIONS.md)
  ✓ architecture (ARCHITECTURE.md, STRUCTURE.md)
  ✓ quality (CONVENTIONS.md, TESTING.md)
  ✓ concerns (CONCERNS.md)
```

If any expected files are missing, display a warning but continue:
```
  ⚠ Missing: {filename} -- agent may have failed
```

## Step 6: Synthesis

**Only run synthesis when ALL 4 areas were mapped** (not on focused single-area runs).

Spawn the synthesis agent (model is already set from the frontmatter update in Step 5):

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
```

**Fallback:** If spawning with `subagent_type="mz-mapper"` fails, fall back to `subagent_type="general-purpose"` with the agent definition embedded inline in `<agent_role>` tags.

Display:
```
▸ Synthesis
  ◆ Synthesizing findings...
```

Wait for completion, then verify SUMMARY.md exists:

```bash
wc -l .planning/codebase/SUMMARY.md 2>/dev/null
```

Update display:
```
▸ Synthesis
  ✓ SUMMARY.md produced
```

## Step 7: Display Results

Display the results action box showing all produced documents:

```
╔═══════════════════════════════════════════════╗
║  Codebase Mapped                              ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  ▸ Documents                                  ║
║    STACK.md            ({N} lines)            ║
║    INTEGRATIONS.md     ({N} lines)            ║
║    ARCHITECTURE.md     ({N} lines)            ║
║    STRUCTURE.md        ({N} lines)            ║
║    CONVENTIONS.md      ({N} lines)            ║
║    TESTING.md          ({N} lines)            ║
║    CONCERNS.md         ({N} lines)            ║
║    SUMMARY.md          ({N} lines)            ║
║                                               ║
║  ▸ Areas Mapped                               ║
║    ✓ tech  ✓ architecture                     ║
║    ✓ quality  ✓ concerns                      ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

For focused runs, only show the documents from the mapped area.

End with the Next Up block:

```
═══════════════════════════════════════════════════
▸ Next Up
**Plan from analysis** -- create roadmap from codebase map
`/mz:plan`
═══════════════════════════════════════════════════
```

## Error Handling

- **Config missing:** Step 2 catches this and suggests `/mz:init`. Exit.
- **Plugin path missing:** Step 2 catches this and suggests `/mz:settings`. Exit.
- **Agent failure:** If a mapper agent Task fails, display warning for that area and continue with remaining areas. Do not abort the entire map.
- **Missing output files:** Step 5 warns about missing files but continues to synthesis if enough documents exist.
- **Synthesis failure:** If synthesis agent fails, display warning but still show individual document results. The 7 individual documents are the primary output.

## Notes

- The orchestrator NEVER reads the content of produced map documents. This preserves context budget. Only file existence and line counts are checked (via `wc -l`).
- All agent spawning follows the inline embedding pattern: read agent file content, embed in Task prompt. @file references do NOT work across Task boundaries.
- Use `{plugin_path}` resolution from config (same pattern as /mz:plan Step 2).
- Focus parameter aliases provide user convenience: `arch` for `architecture`, `conventions` for `quality`.
- Re-mapping gives the user control: Refresh (clean slate), Update (overwrite), Skip (reuse).
- Synthesis only runs on full maps, not focused single-area runs. This is because the synthesis agent needs all 7 documents to produce a meaningful summary.
