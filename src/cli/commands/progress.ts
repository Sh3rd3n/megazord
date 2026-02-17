import type { Command } from "commander";
import { calculateProgress, progressBar } from "../../lib/state.js";

/**
 * Register progress CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerProgressCommands(parent: Command): void {
	parent
		.command("progress")
		.description("Calculate overall and current-phase progress")
		.action(() => {
			const planningDir = `${process.cwd()}/.planning`;
			const result = calculateProgress(planningDir);
			const bar = progressBar(result.overall);
			console.log(
				JSON.stringify({ ...result, bar }, null, 2),
			);
		});
}
