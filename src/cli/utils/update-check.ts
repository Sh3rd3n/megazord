import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { megazordVersionPath, megazordUpdateCheckPath } from "../../lib/paths.js";

interface UpdateCheckData {
	latest: string;
	current: string;
	checked: string;
}

/** How often to check for updates (24 hours). */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Check npm registry for a newer version of megazord-cli.
 * Writes result to ~/.claude/megazord/.update-check.
 * Non-blocking — silently returns on any network error.
 */
export async function checkForUpdate(): Promise<void> {
	// Read current installed version
	if (!existsSync(megazordVersionPath)) return;
	const current = readFileSync(megazordVersionPath, "utf-8").trim();
	if (!current) return;

	// Check if enough time has elapsed since last check
	if (existsSync(megazordUpdateCheckPath)) {
		try {
			const stat = statSync(megazordUpdateCheckPath);
			const elapsed = Date.now() - stat.mtimeMs;
			if (elapsed < CHECK_INTERVAL_MS) return;
		} catch {
			// File stat failed — proceed with check
		}
	}

	// Fetch latest version from npm registry with 3-second timeout
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);

		const response = await fetch("https://registry.npmjs.org/megazord-cli/latest", {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!response.ok) return;

		const data = (await response.json()) as { version?: string };
		const latest = data.version;
		if (!latest) return;

		// Write .update-check file
		const checkData: UpdateCheckData = {
			latest,
			current,
			checked: new Date().toISOString(),
		};
		writeFileSync(megazordUpdateCheckPath, JSON.stringify(checkData, null, 2));
	} catch {
		// Network error — silently return (non-blocking)
	}
}

/**
 * Read the .update-check file and return a notification string if an update is available.
 * Returns null if no update or file doesn't exist.
 */
export function getUpdateNotification(): string | null {
	if (!existsSync(megazordUpdateCheckPath)) return null;

	try {
		const data: UpdateCheckData = JSON.parse(
			readFileSync(megazordUpdateCheckPath, "utf-8"),
		);
		if (data.latest !== data.current) {
			return `Megazord v${data.latest} available — run: megazord-cli update`;
		}
		return null;
	} catch {
		return null;
	}
}
