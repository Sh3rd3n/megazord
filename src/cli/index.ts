import { Command } from "commander";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve package.json by walking up from the current file's directory.
// Works both in dev (src/cli/index.ts -> ../../package.json) and
// after bundling (bin/megazord.mjs -> ../package.json).
function findPackageJson(): string {
	let dir = dirname(fileURLToPath(import.meta.url));
	while (dir !== dirname(dir)) {
		const candidate = join(dir, "package.json");
		if (existsSync(candidate)) return candidate;
		dir = dirname(dir);
	}
	throw new Error("Could not find package.json");
}

const pkg = JSON.parse(readFileSync(findPackageJson(), "utf-8")) as {
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

program
	.command("version")
	.description("Show installed version")
	.action(() => {
		console.log(pkg.version);
	});

program
	.command("help")
	.description("Show help for all commands")
	.action(() => {
		program.outputHelp();
	});

// Default action (no subcommand) = install
program.action(async () => {
	const { install } = await import("./commands/install.js");
	await install();
});

program.parse();
