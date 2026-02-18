import type { Command } from "commander";
import {
	parseRoadmapPhases,
	addPhase,
	removePhase,
	insertPhase,
	checkVerificationGate,
} from "../../lib/roadmap.js";

/**
 * Register roadmap phase management CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerRoadmapCommands(parent: Command): void {
	const roadmap = parent
		.command("roadmap")
		.description("Roadmap phase management operations");

	roadmap
		.command("list")
		.description("List all phases from ROADMAP.md with metadata")
		.action(() => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const phases = parseRoadmapPhases(planningDir);
				console.log(JSON.stringify({ phases }, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	roadmap
		.command("add-phase")
		.description("Add a new phase at the end of the roadmap")
		.requiredOption("--description <string>", "Phase description/name")
		.option("--goal <string>", "Phase goal")
		.action((opts: { description: string; goal?: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const result = addPhase(planningDir, opts.description, opts.goal);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	roadmap
		.command("remove-phase")
		.description("Remove an unstarted phase and renumber subsequent phases")
		.requiredOption("--phase <number>", "Phase number to remove")
		.action((opts: { phase: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const phaseNumber = Number.parseInt(opts.phase, 10);
				const result = removePhase(planningDir, phaseNumber);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	roadmap
		.command("insert-phase")
		.description(
			"Insert a decimal phase between existing phases without renumbering",
		)
		.requiredOption("--after <number>", "Phase number to insert after")
		.requiredOption("--description <string>", "Phase description/name")
		.option("--goal <string>", "Phase goal")
		.action((opts: { after: string; description: string; goal?: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const afterPhase = Number.parseInt(opts.after, 10);
				const result = insertPhase(
					planningDir,
					afterPhase,
					opts.description,
					opts.goal,
				);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	roadmap
		.command("check-gate")
		.description(
			"Check verification gate status for a phase",
		)
		.requiredOption("--phase <number>", "Phase number to check")
		.action((opts: { phase: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const phaseNumber = Number.parseInt(opts.phase, 10);
				const result = checkVerificationGate(planningDir, phaseNumber);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});
}
