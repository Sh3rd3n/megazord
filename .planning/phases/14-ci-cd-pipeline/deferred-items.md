# Phase 14: Deferred Items

## Pre-existing Lint Errors

**Discovered during:** 14-01 Task 1 verification
**Scope:** Pre-existing in codebase, not caused by Phase 14 changes

Running `bunx biome ci --error-on-warnings .` across the full codebase reveals 41 errors and 8 warnings in existing source files (e.g., unused imports in `src/cli/commands/update.ts`). These are out of scope for Phase 14 (CI/CD pipeline) and should be addressed in a dedicated cleanup phase or as a pre-merge fix before the CI workflow blocks PRs.

**Impact:** The CI workflow will fail on PRs until these are resolved. They must be fixed before the first PR targeting master, or the CI gate will block merges.
