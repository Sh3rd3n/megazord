import { join } from "node:path";
import { homedir } from "node:os";

/** Root Claude directory: ~/.claude/ */
export const claudeDir = join(homedir(), ".claude");

/** Megazord installation directory: ~/.claude/megazord/ */
export const megazordDir = join(claudeDir, "megazord");

/** Megazord version file: ~/.claude/megazord/.version */
export const megazordVersionPath = join(megazordDir, ".version");

/** Megazord update check file: ~/.claude/megazord/.update-check */
export const megazordUpdateCheckPath = join(megazordDir, ".update-check");

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

/** Resolve a plugin path in the cache by name */
export function resolvePluginPath(name: string): string {
	return join(pluginsCacheDir, name);
}
