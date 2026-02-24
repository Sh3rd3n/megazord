import { execSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import {
	installedPluginsPath,
	knownMarketplacesPath,
	megazordDir,
	megazordPluginDir,
	safeJoin,
	settingsPath,
} from "../../lib/paths.js";
import { VERSION } from "../utils/version.js";

const MARKETPLACE_NAME = "megazord-marketplace";
const PLUGIN_NAME = "mz";
const PLUGIN_KEY = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

/** Get package root directory (one level up from bin/) */
function getPackageRoot(): string {
	return join(import.meta.dirname, "..");
}

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

/** Attempt to register via claude CLI. Returns true if successful. */
function registerViaClaudeCli(): boolean {
	try {
		// Add marketplace pointing to megazordDir
		execSync(`claude plugin marketplace add "${megazordDir}"`, {
			stdio: "pipe",
			timeout: 30_000,
		});
		// Install plugin
		execSync(`claude plugin install ${PLUGIN_KEY}`, {
			stdio: "pipe",
			timeout: 30_000,
		});
		return true;
	} catch {
		return false;
	}
}

/** Fallback: manually register megazordDir in Claude Code's JSON files. */
function registerFallback(): void {
	// Register marketplace in known_marketplaces.json
	let marketplaces: Record<string, unknown> = {};
	if (existsSync(knownMarketplacesPath)) {
		try {
			marketplaces = JSON.parse(readFileSync(knownMarketplacesPath, "utf-8"));
		} catch {
			// Start fresh
		}
	}
	marketplaces[MARKETPLACE_NAME] = {
		source: { source: "directory", path: megazordDir },
		installLocation: megazordDir,
		lastUpdated: new Date().toISOString(),
	};
	mkdirSync(join(megazordDir, ".."), { recursive: true });
	writeFileSync(knownMarketplacesPath, JSON.stringify(marketplaces, null, 2));

	// Register in installed_plugins.json
	let installed: Record<string, unknown> = {};
	if (existsSync(installedPluginsPath)) {
		try {
			installed = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
		} catch {
			// Start fresh
		}
	}
	if (!installed.version) installed.version = 2;
	const plugins = (installed.plugins ?? {}) as Record<string, unknown[]>;
	const now = new Date().toISOString();
	plugins[PLUGIN_KEY] = [
		{
			scope: "user",
			installPath: megazordPluginDir,
			version: VERSION,
			installedAt: now,
			lastUpdated: now,
		},
	];
	installed.plugins = plugins;
	writeFileSync(installedPluginsPath, JSON.stringify(installed, null, 2));

	// Enable in settings.json
	let settings: Record<string, unknown> = {};
	if (existsSync(settingsPath)) {
		try {
			settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
		} catch {
			// Start fresh
		}
	}
	const enabledPlugins = (settings.enabledPlugins ?? {}) as Record<string, boolean>;
	enabledPlugins[PLUGIN_KEY] = true;
	settings.enabledPlugins = enabledPlugins;
	writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

/** Verify that Megazord is installed at megazordDir and registered. */
function verifyInstallation(): boolean {
	if (!existsSync(megazordDir)) return false;
	if (!existsSync(installedPluginsPath)) return false;
	try {
		const installed = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
		const plugins = installed.plugins ?? {};
		return Object.keys(plugins).some((k) => k.startsWith(`${PLUGIN_NAME}@`));
	} catch {
		return false;
	}
}

/** Main install flow. Silent, atomic, with rollback. */
export async function install(): Promise<void> {
	const packageRoot = getPackageRoot();
	const tmpDir = `${megazordDir}.tmp.${Date.now()}`;

	try {
		// Copy all required directories to temp/mz/
		const tmpPluginDir = join(tmpDir, "mz");
		mkdirSync(tmpPluginDir, { recursive: true });

		const dirsToCopy = [".claude-plugin", "hooks", "skills", "commands", "agents", "scripts"];
		for (const dir of dirsToCopy) {
			const src = join(packageRoot, dir);
			if (existsSync(src)) {
				copyDirSync(src, join(tmpPluginDir, dir));
			}
		}

		// Write .version file into mz/
		writeFileSync(join(tmpPluginDir, ".version"), VERSION);

		// Write .last-seen-version equal to .version so no changelog fires on initial session
		writeFileSync(join(tmpPluginDir, ".last-seen-version"), VERSION);

		// Copy CHANGELOG.md so session-lifecycle can display it without network access
		const changelogSrc = join(packageRoot, "CHANGELOG.md");
		if (existsSync(changelogSrc)) {
			writeFileSync(join(tmpPluginDir, "CHANGELOG.md"), readFileSync(changelogSrc));
		}

		// Generate marketplace.json at .claude-plugin/marketplace.json
		const marketplaceDir = join(tmpDir, ".claude-plugin");
		mkdirSync(marketplaceDir, { recursive: true });
		writeFileSync(
			join(marketplaceDir, "marketplace.json"),
			JSON.stringify(
				{
					name: MARKETPLACE_NAME,
					owner: { name: "Megazord" },
					plugins: [
						{
							name: PLUGIN_NAME,
							source: `./${PLUGIN_NAME}`,
							description:
								"Unified framework for project management, code quality, and multi-agent coordination",
						},
					],
				},
				null,
				2,
			),
		);

		// Atomic swap: remove existing, rename temp to final
		if (existsSync(megazordDir)) {
			rmSync(megazordDir, { recursive: true, force: true });
		}
		renameSync(tmpDir, megazordDir);

		// Register with Claude Code
		const registered = registerViaClaudeCli();
		if (!registered) {
			registerFallback();
		}

		// Verify
		if (!verifyInstallation()) {
			console.log("Error: installation could not be verified");
			process.exit(1);
		}

		console.log(`Megazord v${VERSION} installed at ${megazordDir}`);

		// Seed update check (fire-and-forget)
		import("../utils/update-check.js").then((m) => m.checkForUpdate()).catch(() => {});
	} catch (err) {
		// Rollback: remove temp dir if it exists
		try {
			if (existsSync(tmpDir)) {
				rmSync(tmpDir, { recursive: true, force: true });
			}
		} catch {
			// Best-effort cleanup
		}
		console.log(`Error: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
}
