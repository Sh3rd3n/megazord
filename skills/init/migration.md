# GSD Migration Guide

Reference for the `/mz:init` skill's GSD detection and migration flow (Step 2). Handles automatic migration from GSD project format to Megazord format.

## Detection

A GSD project is identified by the presence of `.planning/config.json` WITHOUT a `version` field. Megazord configs always include `"version": 1`. This is the distinguishing marker.

**Detection logic:**
1. Check if `.planning/config.json` exists
2. Read the JSON content
3. If the `version` field is absent or undefined, it is a GSD config
4. If `version` is present, it is already a Megazord config (should not reach migration)

## GSD Config Format

A typical GSD `config.json` looks like:

```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "quality",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "auto_advance": false
  }
}
```

Some GSD configs may also include:
```json
{
  "git": {
    "branching_strategy": "none"
  }
}
```

## Field Mapping

| GSD Field | Megazord Field | Notes |
|-----------|---------------|-------|
| `mode` | `mode` | Direct mapping (yolo/interactive) |
| `depth` | `depth` | Direct mapping (comprehensive/standard/quick) |
| `parallelization` | `parallelization` | Direct mapping (boolean) |
| `commit_docs` | `commit_docs` | Direct mapping (boolean) |
| `model_profile` | `model_profile` | Direct mapping (quality/balanced/budget) |
| `workflow.research` | `workflow.research` | Direct mapping (boolean) |
| `workflow.plan_check` | `workflow.plan_check` | Direct mapping (boolean) |
| `workflow.verifier` | `workflow.verifier` | Direct mapping (boolean) |
| `workflow.auto_advance` | -- | GSD-specific, not migrated (ignored silently) |
| `git.branching_strategy` | -- | GSD-specific, not migrated (ignored silently) |
| -- | `version` | Added as `1` (new field) |
| -- | `project_name` | Prompted from user or taken from package.json |
| -- | `quality.*` | Added from Strict preset defaults |

## Migration Steps

### 1. Read Existing Config
Read `.planning/config.json` and extract all known GSD fields.

### 2. Show Detection Summary
Display what was found in an action box:

```
╔═══════════════════════════════════════════════════════╗
║  GSD Project Detected                                 ║
╠═══════════════════════════════════════════════════════╣
║  ▸ Mode:          {mode}                              ║
║  ▸ Depth:         {depth}                             ║
║  ▸ Model:         {model_profile}                     ║
║  ▸ Parallelization: {yes/no}                          ║
║  ▸ Commit docs:   {yes/no}                            ║
║  ▸ Workflow:      research={✓/✗} plan_check={✓/✗}     ║
║                   verifier={✓/✗}                      ║
╚═══════════════════════════════════════════════════════╝
```

### 3. Gather Missing Fields
- **Project name:** Ask the user or detect from `package.json`.
- **Quality settings:** GSD has no quality section. Apply Strict preset defaults and inform the user: "Adding Megazord quality settings with Strict defaults (TDD, review, brainstorming, CORTEX, systematic debug all enabled). You can customize these with `/mz:settings`."

### 4. Preserve Existing Files
- **PROJECT.md:** Keep as-is. GSD and Megazord use a compatible format.
- **STATE.md:** Keep as-is if present. The format is compatible.
- **Phase directories:** Keep all `.planning/phases/` content untouched.
- **config.json:** Keep as backup (do not delete the original).

### 5. Write Megazord Config
Write `.planning/megazord.config.json` with the migrated values.

### 6. Confirm with User
Show the migration summary and ask for confirmation:
- "I've migrated your GSD config to Megazord format. The original `config.json` has been preserved. Would you like to adjust any settings, or does this look good?"
- If the user wants adjustments, walk through the settings they want to change.
- If confirmed, proceed to Step 9 (summary) of the init flow.

## Handling Unknown .planning/ Directories

If `.planning/` exists but contains neither `megazord.config.json` nor a GSD-format `config.json`:

1. List the contents of `.planning/` to understand what exists
2. Ask the user how to proceed:
   - **Overwrite:** Remove existing `.planning/` and start fresh
   - **Merge:** Keep existing files and add Megazord config alongside them
   - **Abort:** Exit without changes
3. If merging, be careful not to overwrite any existing `PROJECT.md` or `STATE.md` without asking

## Post-Migration

After migration completes:
- The original `config.json` remains as a backup
- `megazord.config.json` is the active config file
- All existing planning artifacts (PROJECT.md, STATE.md, phases) are preserved
- The user can run `/mz:settings` to further customize quality and workflow settings
