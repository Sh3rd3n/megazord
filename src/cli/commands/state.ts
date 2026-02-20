import type { Command } from "commander";
import {
	addDecision,
	advancePlan,
	readPosition,
	readSessionContinuity,
	recordMetric,
	stashPause,
	stashResume,
	updatePosition,
	updateSessionContinuity,
} from "../../lib/state.js";

/**
 * Register state and stash CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerStateCommands(parent: Command): void {
	// ─── State subcommand group ─────────────────────────────────────────────
	const state = parent.command("state").description("State management operations for STATE.md");

	state
		.command("read-position")
		.description("Read current position from STATE.md")
		.action(() => {
			const planningDir = `${process.cwd()}/.planning`;
			const position = readPosition(planningDir);
			if (position === null) {
				console.error("STATE.md not found in .planning/");
				process.exit(1);
			}
			console.log(JSON.stringify(position, null, 2));
		});

	state
		.command("read-session")
		.description("Read session continuity from STATE.md")
		.action(() => {
			const planningDir = `${process.cwd()}/.planning`;
			const session = readSessionContinuity(planningDir);
			if (session === null) {
				console.error("STATE.md not found in .planning/");
				process.exit(1);
			}
			console.log(JSON.stringify(session, null, 2));
		});

	state
		.command("update-position")
		.description("Update position fields in STATE.md")
		.option("--phase <number>", "Phase number")
		.option("--plan <number>", "Plan number")
		.option("--status <string>", "Status text")
		.option("--progress <number>", "Progress percentage")
		.action((opts: { phase?: string; plan?: string; status?: string; progress?: string }) => {
			const planningDir = `${process.cwd()}/.planning`;
			const updates: Record<string, unknown> = {};
			if (opts.phase !== undefined) updates.phase = Number.parseInt(opts.phase, 10);
			if (opts.plan !== undefined) updates.plan = Number.parseInt(opts.plan, 10);
			if (opts.status !== undefined) updates.status = opts.status;
			if (opts.progress !== undefined) updates.progressPercent = Number.parseInt(opts.progress, 10);
			updatePosition(planningDir, updates);
			console.log(JSON.stringify({ success: true, updates }, null, 2));
		});

	state
		.command("update-session")
		.description("Update session continuity fields in STATE.md")
		.option("--stopped-at <string>", "What was being worked on")
		.option("--resume-file <string>", "File to resume from")
		.option("--stash-ref <string>", "Git stash reference")
		.option("--last-error <string>", "Last error context")
		.action(
			(opts: {
				stoppedAt?: string;
				resumeFile?: string;
				stashRef?: string;
				lastError?: string;
			}) => {
				const planningDir = `${process.cwd()}/.planning`;
				const updates: Record<string, unknown> = {};
				if (opts.stoppedAt !== undefined) updates.stoppedAt = opts.stoppedAt;
				if (opts.resumeFile !== undefined) updates.resumeFile = opts.resumeFile;
				if (opts.stashRef !== undefined) updates.stashRef = opts.stashRef;
				if (opts.lastError !== undefined) updates.lastError = opts.lastError;
				updateSessionContinuity(planningDir, updates);
				console.log(JSON.stringify({ success: true, updates }, null, 2));
			},
		);

	// ─── Execution lifecycle subcommands ────────────────────────────────────

	state
		.command("advance-plan")
		.description("Increment plan counter and recalculate progress")
		.action(() => {
			const planningDir = `${process.cwd()}/.planning`;
			const result = advancePlan(planningDir);
			console.log(JSON.stringify(result, null, 2));
			if (!result.success) process.exit(1);
		});

	state
		.command("record-metric")
		.description("Record execution timing for a completed plan")
		.requiredOption("--phase <string>", "Phase identifier (e.g., '04')")
		.requiredOption("--plan <string>", "Plan identifier (e.g., '01')")
		.requiredOption("--duration <string>", "Duration (e.g., '5min')")
		.requiredOption("--tasks <number>", "Number of tasks completed")
		.requiredOption("--files <number>", "Number of files modified")
		.action(
			(opts: { phase: string; plan: string; duration: string; tasks: string; files: string }) => {
				const planningDir = `${process.cwd()}/.planning`;
				recordMetric(
					planningDir,
					opts.phase,
					opts.plan,
					opts.duration,
					Number.parseInt(opts.tasks, 10),
					Number.parseInt(opts.files, 10),
				);
				console.log(JSON.stringify({ success: true }, null, 2));
			},
		);

	state
		.command("add-decision")
		.description("Append a decision to Accumulated Context")
		.requiredOption("--phase <string>", "Phase identifier (e.g., '04')")
		.requiredOption("--decision <string>", "Decision summary text")
		.action((opts: { phase: string; decision: string }) => {
			const planningDir = `${process.cwd()}/.planning`;
			addDecision(planningDir, opts.phase, opts.decision);
			console.log(JSON.stringify({ success: true }, null, 2));
		});

	// ─── Stash subcommand group ─────────────────────────────────────────────
	const stash = parent.command("stash").description("Git stash operations for pause/resume");

	stash
		.command("pause")
		.description("Stash modified files with a Megazord-tagged message")
		.requiredOption("--description <string>", "Description of current work")
		.action((opts: { description: string }) => {
			const result = stashPause(opts.description);
			console.log(JSON.stringify(result, null, 2));
			if (!result.success) process.exit(1);
		});

	stash
		.command("resume")
		.description("Pop a stashed ref to restore files")
		.requiredOption("--stash-ref <string>", "Git stash reference to pop")
		.action((opts: { stashRef: string }) => {
			const result = stashResume(opts.stashRef);
			console.log(JSON.stringify(result, null, 2));
			if (!result.success) process.exit(1);
		});
}
