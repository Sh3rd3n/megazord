import type { Command } from "commander";
import { archiveMilestone, checkMilestoneAudit, createMilestone } from "../../lib/milestone.js";

/**
 * Register milestone lifecycle CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerMilestoneCommands(parent: Command): void {
	const milestone = parent.command("milestone").description("Milestone lifecycle operations");

	milestone
		.command("create")
		.description("Create a new milestone with version, name, and phases")
		.requiredOption("--version <string>", "Milestone version (e.g., v1.0)")
		.requiredOption("--name <string>", "Milestone name")
		.requiredOption("--phases <string>", "Comma-separated phase numbers (e.g., 1,2,3)")
		.action((opts: { version: string; name: string; phases: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const phases = opts.phases.split(",").map((p) => Number.parseInt(p.trim(), 10));
				const result = createMilestone(planningDir, opts.version, opts.name, phases);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	milestone
		.command("archive")
		.description("Archive a milestone: copy roadmap/requirements, create git tag")
		.requiredOption("--version <string>", "Milestone version to archive")
		.action((opts: { version: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const result = archiveMilestone(planningDir, opts.version);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	milestone
		.command("audit")
		.description("Check verification status for all phases in a milestone")
		.requiredOption("--phases <string>", "Comma-separated phase numbers to audit (e.g., 1,2,3)")
		.action((opts: { phases: string }) => {
			try {
				const planningDir = `${process.cwd()}/.planning`;
				const phases = opts.phases.split(",").map((p) => Number.parseInt(p.trim(), 10));
				const result = checkMilestoneAudit(planningDir, phases);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});
}
