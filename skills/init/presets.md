# Preset Profiles

Reference for the `/mz:init` skill's preset selection (Step 4). Defines the three quality profiles and their exact configuration values.

## Profile Comparison

| Setting | Strict | Balanced | Minimal |
|---------|--------|----------|---------|
| **Model** | quality (Opus) | balanced (Opus+Sonnet) | budget (Sonnet/Haiku) |
| **Quality** | | | |
| TDD | On | Off | Off |
| Review | Auto | Auto | Off |
| Brainstorming | On | On | Off |
| CORTEX | On | Off | Off |
| Debug | Systematic | Quick | Quick |
| **Workflow** | | | |
| Research | On | On | Off |
| Plan check | On | On | Off |
| Verifier | On | On | Off |

## Profile Details

### Strict (Recommended)

Everything enabled. Maximum quality discipline.

- **Best for:** Production projects, critical systems, projects where correctness matters more than speed.
- **What you get:** Tests before code (TDD), automatic code review on every change, brainstorming before complex implementations, CORTEX adaptive thinking for deep problems, systematic four-phase debugging, full research before planning, plan verification, and post-phase verification.
- **Trade-off:** Higher token usage, longer execution times. Worth it for serious work.

### Balanced

Core quality features on, advanced features off.

- **Best for:** Side projects, prototyping with quality, learning projects where you want review but not full ceremony.
- **What you get:** Automatic code review, brainstorming before complex work, research before planning, plan and phase verification. No TDD enforcement, no CORTEX thinking, quick debugging.
- **Trade-off:** Faster than Strict but still catches most quality issues through review.

### Minimal

Essential base features only.

- **Best for:** Quick experiments, throwaway prototypes, spike implementations, solo hacking sessions.
- **What you get:** Basic execution with no quality gates. No review, no TDD, no brainstorming, no verification agents. Pure speed.
- **Trade-off:** No safety net. You are responsible for quality.

## Config Values

When applying a preset, use these exact values for `megazord.config.json`:

**Strict:**
```json
{
  "model_profile": "quality",
  "quality": {
    "tdd": true,
    "review": "auto",
    "brainstorming": true,
    "cortex": true,
    "debug": "systematic"
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

**Balanced:**
```json
{
  "model_profile": "balanced",
  "quality": {
    "tdd": false,
    "review": "auto",
    "brainstorming": true,
    "cortex": false,
    "debug": "quick"
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true
  }
}
```

**Minimal:**
```json
{
  "model_profile": "budget",
  "quality": {
    "tdd": false,
    "review": "off",
    "brainstorming": false,
    "cortex": false,
    "debug": "quick"
  },
  "workflow": {
    "research": false,
    "plan_check": false,
    "verifier": false
  }
}
```

## Override Behavior

When a user selects a preset and then customizes individual toggles in Step 6, the custom values replace only the specific toggled settings. All other values remain from the preset. For example, selecting "Strict" and then turning TDD off results in all Strict values except `"tdd": false`.
