# Phase 10: Distribution and Autocomplete Fixes - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure npm-installed users get full autocomplete for all skills, fix missing distribution files, and update REQUIREMENTS.md traceability table to reflect actual implementation status. No new capabilities — packaging, documentation accuracy, and distribution completeness only.

</domain>

<decisions>
## Implementation Decisions

### Requirements audit approach
- Individual verification: each of the 20 stale Pending markers must be checked against the codebase individually
- If a requirement is partially implemented, mark as "Partial" with a note describing what's missing
- Evidence column must include specific file paths or function references (not just phase names) — verifiable by anyone reading the table
- Status values: Claude's discretion on the set (at minimum Complete, Partial, Pending)

### Distribution verification
- Run `bun pack --dry-run` (or equivalent) to inspect tarball contents before any publish
- Full audit of what's included vs what should be — not just `commands/`, check all runtime-critical directories (.claude-plugin/, skills/, commands/, hooks/, scripts/, bin/, agents/)
- If additional missing files are found beyond `commands/`, report them as findings only — do NOT fix in this phase (scope stays fixed)
- End-to-end test: install from local tarball into a test project (cortex-test) and verify autocomplete works

### Autocomplete proxy content
- Follow the exact pattern of existing proxy files in `commands/` — format, metadata, routing, naming convention
- Claude's discretion on whether to audit all skills for missing proxies (not just debug and discuss) and add any others found missing
- Proxy naming and namespace follows whatever convention existing proxies use

### Claude's Discretion
- Status value set for REQUIREMENTS.md (at minimum: Complete, Partial, Pending — may add N/A if appropriate)
- Whether additional skills beyond debug/discuss are missing autocomplete proxies (audit and fix if found)
- Level of detail in evidence references (file:line vs file:function vs file path)

</decisions>

<specifics>
## Specific Ideas

- "Segui il pattern" was the guiding principle for all autocomplete decisions — consistency with existing proxies is paramount
- Distribution test must be real E2E: tarball → install in cortex-test → verify autocomplete appears
- Requirements verification must be individually grounded in code, not bulk-assumed from phase completion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-distribution-and-autocomplete-fixes*
*Context gathered: 2026-02-19*
