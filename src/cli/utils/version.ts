import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve package.json by walking up from the current file's directory.
 * Works both in dev (src/cli/utils/version.ts -> ../../../package.json) and
 * after bundling (bin/megazord.mjs -> ../package.json).
 */
export function findPackageJson(): string {
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

export const VERSION: string = pkg.version;
