import { Command } from "commander";
import { VERSION } from "./utils/version.js";

const program = new Command()
	.name("megazord")
	.description("Megazord CLI — install and manage the Megazord plugin")
	.version(VERSION);

program
	.command("install")
	.description("Install Megazord as a Claude Code plugin")
	.option("--yes", "Skip confirmation prompts")
	.action(async () => {
		const { install } = await import("./commands/install.js");
		await install();
	});

program
	.command("uninstall")
	.description("Remove Megazord plugin")
	.option("--yes", "Skip confirmation prompts")
	.action(async () => {
		const { uninstall } = await import("./commands/uninstall.js");
		await uninstall();
	});

program
	.command("update")
	.description("Sync skills from source to plugin cache")
	.option("--yes", "Skip confirmation prompts")
	.action(async () => {
		const { update } = await import("./commands/update.js");
		await update();
	});

program
	.command("version")
	.description("Show installed version")
	.action(() => {
		console.log(VERSION);
	});

program
	.command("help")
	.description("Show help for all commands")
	.action(() => {
		program.outputHelp();
	});

// ─── Tools subcommand group (non-interactive, JSON output) ──────────────
// Used by Megazord skills via Bash for state management operations.

const tools = program.command("tools").description("Internal tools for Megazord skills");

// Register tool subcommands via dynamic imports (matches install/uninstall pattern)
const { registerStateCommands } = await import("./commands/state.js");
const { registerProgressCommands } = await import("./commands/progress.js");
const { registerPlanCommands } = await import("./commands/plan-tools.js");
const { registerWorktreeCommands } = await import("./commands/worktree-tools.js");
const { registerRoadmapCommands } = await import("./commands/roadmap-tools.js");
const { registerMilestoneCommands } = await import("./commands/milestone-tools.js");
const { registerSessionLifecycleCommands } = await import("./commands/session-lifecycle.js");
registerStateCommands(tools);
registerProgressCommands(tools);
registerPlanCommands(tools);
registerWorktreeCommands(tools);
registerRoadmapCommands(tools);
registerMilestoneCommands(tools);
registerSessionLifecycleCommands(tools);

// Default action (no subcommand) = install
program.action(async () => {
	const { install } = await import("./commands/install.js");
	await install();
});

program.parse();
