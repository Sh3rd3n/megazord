import type { Command } from "commander";
import {
	listPlanFiles,
	computeWaves,
	getIncompletePlans,
	isPlanComplete,
	detectWaveConflicts,
} from "../../lib/plan.js";

/**
 * Register plan CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerPlanCommands(parent: Command): void {
	const plan = parent
		.command("plan")
		.description("Plan parsing and wave computation tools");

	plan
		.command("list")
		.description("List all plans with metadata and completion status")
		.requiredOption("--phase-dir <path>", "Path to phase directory")
		.action((opts: { phaseDir: string }) => {
			const plans = listPlanFiles(opts.phaseDir);
			const result = plans.map((p) => ({
				filename: p.filename,
				...p.metadata,
				completed: isPlanComplete(opts.phaseDir, p.metadata),
			}));
			console.log(JSON.stringify(result, null, 2));
		});

	plan
		.command("waves")
		.description("Compute wave execution structure")
		.requiredOption("--phase-dir <path>", "Path to phase directory")
		.action((opts: { phaseDir: string }) => {
			const plans = listPlanFiles(opts.phaseDir);
			const waves = computeWaves(plans);
			const result = waves.map((w) => ({
				wave: w.wave,
				plans: w.plans.map((p) => ({
					filename: p.filename,
					phase: p.metadata.phase,
					plan: p.metadata.plan,
					depends_on: p.metadata.depends_on,
					files_modified: p.metadata.files_modified,
				})),
			}));
			console.log(JSON.stringify(result, null, 2));
		});

	plan
		.command("incomplete")
		.description("List incomplete plans (no matching SUMMARY.md)")
		.requiredOption("--phase-dir <path>", "Path to phase directory")
		.action((opts: { phaseDir: string }) => {
			const plans = getIncompletePlans(opts.phaseDir);
			const result = plans.map((p) => ({
				filename: p.filename,
				...p.metadata,
			}));
			console.log(JSON.stringify(result, null, 2));
		});

	plan
		.command("conflicts")
		.description("Detect file conflicts between plans in each wave")
		.requiredOption("--phase-dir <path>", "Path to phase directory")
		.action((opts: { phaseDir: string }) => {
			const plans = listPlanFiles(opts.phaseDir);
			const waves = computeWaves(plans);
			const result: Record<string, Record<string, string[]>> = {};

			for (const w of waves) {
				const conflicts = detectWaveConflicts(w.plans);
				if (conflicts.size > 0) {
					const waveKey = `wave_${w.wave}`;
					result[waveKey] = Object.fromEntries(conflicts);
				}
			}

			console.log(JSON.stringify(result, null, 2));
		});
}
