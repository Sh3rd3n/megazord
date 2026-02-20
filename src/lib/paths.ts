import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

/** Root Claude directory: ~/.claude/ */
export const claudeDir = join(homedir(), ".claude");

/** Megazord installation directory: ~/.claude/megazord/ */
export const megazordDir = join(claudeDir, "megazord");

/** Megazord plugin subdirectory: ~/.claude/megazord/mz/ */
export const megazordPluginDir = join(megazordDir, "mz");

/** Megazord version file: ~/.claude/megazord/mz/.version */
export const megazordVersionPath = join(megazordPluginDir, ".version");

/** Megazord update check file: ~/.claude/megazord/mz/.update-check */
export const megazordUpdateCheckPath = join(megazordPluginDir, ".update-check");

/** Plugins directory: ~/.claude/plugins/ */
export const pluginsDir = join(claudeDir, "plugins");

/** Plugin cache directory: ~/.claude/plugins/cache/ */
export const pluginsCacheDir = join(pluginsDir, "cache");

/** Settings file: ~/.claude/settings.json */
export const settingsPath = join(claudeDir, "settings.json");

/** Installed plugins registry: ~/.claude/plugins/installed_plugins.json */
export const installedPluginsPath = join(pluginsDir, "installed_plugins.json");

/** GSD commands directory: ~/.claude/commands/gsd/ */
export const gsdCommandsDir = join(claudeDir, "commands", "gsd");

/** Known marketplaces registry: ~/.claude/plugins/known_marketplaces.json */
export const knownMarketplacesPath = join(pluginsDir, "known_marketplaces.json");

/**
 * Join path segments and validate the result stays within the base directory.
 * Prevents directory traversal attacks (e.g., "../../etc/passwd").
 */
export function safeJoin(base: string, ...segments: string[]): string {
	const resolved = resolve(base, ...segments);
	const baseResolved = resolve(base);
	if (resolved !== baseResolved && !resolved.startsWith(`${baseResolved}/`)) {
		throw new Error(`Path traversal detected: resolved path escapes base directory`);
	}
	return resolved;
}

/**
 * Sanitize a directory entry from readdirSync to prevent path traversal.
 * Strips any path separators, returning only the base filename.
 */
export function sanitizeEntry(entry: string): string {
	return basename(entry);
}

/** Resolve a plugin path in the cache by name */
export function resolvePluginPath(name: string): string {
	return safeJoin(pluginsCacheDir, name);
}
