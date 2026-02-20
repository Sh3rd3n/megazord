import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { megazordDir, megazordPluginDir, megazordVersionPath, safeJoin } from "../../lib/paths.js";
import { VERSION } from "../utils/version.js";

/** Recursively copy a directory. */
function copyDirSync(src: string, dest: string): void {
	mkdirSync(dest, { recursive: true });
	for (const entry of readdirSync(src)) {
		const safe = basename(entry);
		const srcPath = safeJoin(src, safe);
		const destPath = safeJoin(dest, safe);
		if (statSync(srcPath).isDirectory()) {
			copyDirSync(srcPath, destPath);
		} else {
			writeFileSync(destPath, readFileSync(srcPath));
		}
	}
}

/** Main update flow. Silent, overwrites ~/.claude/megazord/. */
export async function update(): Promise<void> {
	const packageRoot = join(import.meta.dirname, "..");

	// Must be installed first
	if (!existsSync(megazordDir)) {
		console.log("Error: Megazord not installed — run `megazord-cli install` first");
		process.exit(1);
	}

	try {
		// Ensure mz/ subdirectory exists
		mkdirSync(megazordPluginDir, { recursive: true });

		// Copy all required directories into mz/ (overwrite existing)
		const dirsToCopy = [".claude-plugin", "hooks", "skills", "commands", "agents", "scripts"];
		for (const dir of dirsToCopy) {
			const src = join(packageRoot, dir);
			if (existsSync(src)) {
				const dest = join(megazordPluginDir, dir);
				// Remove existing dir to ensure clean copy
				if (existsSync(dest)) {
					rmSync(dest, { recursive: true, force: true });
				}
				copyDirSync(src, dest);
			}
		}

		// Update .version file
		writeFileSync(megazordVersionPath, VERSION);

		console.log(`Megazord updated to v${VERSION}`);
	} catch (err) {
		console.log(`Error: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
}
