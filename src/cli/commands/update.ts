import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pluginsCacheDir } from "../../lib/paths.js";
import { success, error, info, dim } from "../utils/colors.js";
import { createSpinner, spinnerSuccess, spinnerFail } from "../utils/spinner.js";
import { VERSION } from "../utils/version.js";
const MARKETPLACE_NAME = "megazord-marketplace";
const PLUGIN_NAME = "mz";

/** Recursively copy a directory. */
function copyDirSync(src: string, dest: string): void {
	mkdirSync(dest, { recursive: true });
	for (const entry of readdirSync(src)) {
		const srcPath = join(src, entry);
		const destPath = join(dest, entry);
		if (statSync(srcPath).isDirectory()) {
			copyDirSync(srcPath, destPath);
		} else {
			writeFileSync(destPath, readFileSync(srcPath));
		}
	}
}

/** Count skill directories in the skills/ source folder. */
function countSkills(skillsDir: string): number {
	if (!existsSync(skillsDir)) return 0;
	return readdirSync(skillsDir).filter((entry) =>
		statSync(join(skillsDir, entry)).isDirectory(),
	).length;
}

/** Sync source skills, hooks, and commands to the plugin cache. */
export async function update(): Promise<void> {
	const skipPrompts = process.argv.includes("--yes") || !process.stdin.isTTY;
	const packageRoot = join(import.meta.dirname, "..");
	const cacheTarget = join(pluginsCacheDir, MARKETPLACE_NAME, PLUGIN_NAME, VERSION);

	// Check cache exists (must have been installed first)
	if (!existsSync(cacheTarget)) {
		console.log("");
		console.log(error("  Megazord not installed — run `megazord install` first"));
		console.log("");
		process.exit(1);
	}

	if (!skipPrompts) {
		console.log("");
		console.log(info("  Syncing Megazord skills to plugin cache..."));
		console.log("");
	}

	const spinner = createSpinner("Updating plugin cache...");
	spinner.start();

	// Copy skills, hooks, and commands directories
	const dirsToCopy = ["skills", "hooks", "commands"];
	let copiedDirs = 0;

	for (const dir of dirsToCopy) {
		const src = join(packageRoot, dir);
		if (existsSync(src)) {
			copyDirSync(src, join(cacheTarget, dir));
			copiedDirs++;
		}
	}

	const skillCount = countSkills(join(packageRoot, "skills"));

	if (copiedDirs > 0) {
		spinnerSuccess(spinner, `Megazord updated — ${skillCount} skills synced to cache`);
	} else {
		spinnerFail(spinner, "No directories found to sync");
		process.exit(1);
	}

	if (!skipPrompts) {
		console.log("");
		console.log(dim("  Plugin cache is now up to date."));
		console.log("");
	}
}
