import { Command } from "commander";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Read version from package.json using readFileSync (ESM-safe, no import assertion needed)
const packageJsonPath = join(import.meta.dirname, "..", "..", "package.json");
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
	version: string;
};

const program = new Command()
	.name("megazord")
	.description("Megazord CLI — install and manage the Megazord plugin")
	.version(pkg.version);

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

// Default action (no subcommand) = install
program.action(async () => {
	const { install } = await import("./commands/install.js");
	await install();
});

program.parse();
