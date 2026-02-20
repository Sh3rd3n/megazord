import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { installedPluginsPath, megazordDir, settingsPath } from "../../lib/paths.js";

const PLUGIN_KEY = "mz@megazord-marketplace";

/** Main uninstall flow. Silent, removes ~/.claude/megazord/ and deregisters. */
export async function uninstall(): Promise<void> {
	try {
		// Remove megazord directory
		if (existsSync(megazordDir)) {
			rmSync(megazordDir, { recursive: true, force: true });
		}

		// Deregister via claude CLI
		try {
			execSync("claude plugin uninstall mz", {
				stdio: "pipe",
				timeout: 15_000,
			});
		} catch {
			// Plugin may not be registered — continue
		}

		// Remove marketplace
		try {
			execSync("claude plugin marketplace remove megazord-marketplace", {
				stdio: "pipe",
				timeout: 15_000,
			});
		} catch {
			// Marketplace may not exist — continue
		}

		// Clean up installed_plugins.json
		if (existsSync(installedPluginsPath)) {
			try {
				const installed = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
				const plugins = (installed.plugins ?? {}) as Record<string, unknown>;
				if (plugins[PLUGIN_KEY]) {
					delete plugins[PLUGIN_KEY];
					installed.plugins = plugins;
					writeFileSync(installedPluginsPath, JSON.stringify(installed, null, 2));
				}
			} catch {
				// Best-effort cleanup
			}
		}

		// Clean up settings.json
		if (existsSync(settingsPath)) {
			try {
				const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
				const enabledPlugins = (settings.enabledPlugins ?? {}) as Record<string, boolean>;
				if (enabledPlugins[PLUGIN_KEY] !== undefined) {
					delete enabledPlugins[PLUGIN_KEY];
					settings.enabledPlugins = enabledPlugins;
					writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
				}
			} catch {
				// Best-effort cleanup
			}
		}

		console.log("Megazord uninstalled");
	} catch (err) {
		console.log(`Error: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
}
