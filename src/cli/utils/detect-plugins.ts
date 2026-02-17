import { existsSync, readFileSync } from "node:fs";
import {
	claudeDir,
	gsdCommandsDir,
	settingsPath,
	installedPluginsPath,
} from "../../lib/paths.js";

export interface PluginDetectionResult {
	claudeCodeInstalled: boolean;
	gsdInstalled: boolean;
	superpowersInstalled: boolean;
	megazordInstalled: boolean;
	existingPlugins: string[];
}

/**
 * Detect installed Claude Code plugins and frameworks.
 * All checks are wrapped in try/catch so corrupted files never crash detection.
 */
export function detectPlugins(): PluginDetectionResult {
	const result: PluginDetectionResult = {
		claudeCodeInstalled: existsSync(claudeDir),
		gsdInstalled: existsSync(gsdCommandsDir),
		superpowersInstalled: false,
		megazordInstalled: false,
		existingPlugins: [],
	};

	// Check settings.json for enabled plugins (Superpowers detection)
	if (existsSync(settingsPath)) {
		try {
			const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
			const enabled = settings.enabledPlugins ?? {};
			result.existingPlugins = Object.keys(enabled).filter(
				(k) => enabled[k],
			);
			result.superpowersInstalled = result.existingPlugins.some((p) =>
				p.includes("superpowers"),
			);
		} catch {
			// Corrupted settings.json — proceed without detection
		}
	}

	// Check installed_plugins.json for Megazord
	if (existsSync(installedPluginsPath)) {
		try {
			const installed = JSON.parse(
				readFileSync(installedPluginsPath, "utf-8"),
			);
			const plugins = installed.plugins ?? {};
			result.megazordInstalled = Object.keys(plugins).some((k) =>
				k.startsWith("mz@"),
			);
		} catch {
			// Corrupted installed_plugins.json — proceed without detection
		}
	}

	return result;
}
