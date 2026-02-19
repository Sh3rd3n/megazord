import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import {
	pluginsCacheDir,
	knownMarketplacesPath,
	installedPluginsPath,
	settingsPath,
} from "../../lib/paths.js";
import { detectPlugins } from "../utils/detect-plugins.js";
import { success, error, info, warn, bold, dim } from "../utils/colors.js";
import { createSpinner, spinnerSuccess, spinnerFail } from "../utils/spinner.js";
import { VERSION } from "../utils/version.js";
const MARKETPLACE_NAME = "megazord-marketplace";
const PLUGIN_NAME = "mz";
const PLUGIN_KEY = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;

/** Prompt user for a yes/no confirmation. Returns true if confirmed. */
async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`${message} (y/N) `, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes");
		});
	});
}

/** Prompt user with options. Returns the selected option string. */
async function selectOption(message: string, options: string[]): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	console.log(message);
	for (let i = 0; i < options.length; i++) {
		console.log(`  ${i + 1}. ${options[i]}`);
	}
	return new Promise((resolve) => {
		rl.question("Select an option: ", (answer) => {
			rl.close();
			const idx = parseInt(answer.trim(), 10) - 1;
			if (idx >= 0 && idx < options.length) {
				resolve(options[idx]);
			} else {
				resolve(options[0]);
			}
		});
	});
}

/** Get package root directory (one level up from bin/) */
function getPackageRoot(): string {
	return join(import.meta.dirname, "..");
}

/**
 * Create a local marketplace directory with proper Claude Code structure.
 * Returns the path to the marketplace directory.
 */
function createLocalMarketplace(): string {
	const packageRoot = getPackageRoot();
	const marketplaceDir = join(packageRoot, ".megazord-marketplace");

	// Create marketplace manifest
	mkdirSync(join(marketplaceDir, ".claude-plugin"), { recursive: true });
	writeFileSync(
		join(marketplaceDir, ".claude-plugin", "marketplace.json"),
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

	// Create plugin directory inside marketplace with actual plugin files
	const pluginDir = join(marketplaceDir, PLUGIN_NAME);
	mkdirSync(pluginDir, { recursive: true });

	// Copy plugin structure into marketplace
	const dirsToCopy = [".claude-plugin", "hooks", "skills", "commands"];
	for (const dir of dirsToCopy) {
		const src = join(packageRoot, dir);
		if (existsSync(src)) {
			copyDirSync(src, join(pluginDir, dir));
		}
	}

	return marketplaceDir;
}

/** Attempt to install via claude CLI. Returns true if successful. */
function installViaClaudeCli(marketplacePath: string): boolean {
	try {
		// Add marketplace
		execSync(`claude plugin marketplace add "${marketplacePath}"`, {
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

/** Fallback: manually copy plugin files to cache and register everywhere. */
function installFallback(marketplacePath: string): void {
	const packageRoot = getPackageRoot();
	const targetDir = join(pluginsCacheDir, MARKETPLACE_NAME, PLUGIN_NAME, VERSION);

	mkdirSync(targetDir, { recursive: true });

	// Copy all plugin directories
	const dirsToCopy = [".claude-plugin", "hooks", "skills", "commands"];
	for (const dir of dirsToCopy) {
		const src = join(packageRoot, dir);
		if (existsSync(src)) {
			copyDirSync(src, join(targetDir, dir));
		}
	}

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
		source: { source: "directory", path: marketplacePath },
		installLocation: marketplacePath,
		lastUpdated: new Date().toISOString(),
	};
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
			installPath: targetDir,
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

/** Verify that Megazord appears in installed_plugins.json. */
function verifyInstallation(): boolean {
	if (!existsSync(installedPluginsPath)) return false;
	try {
		const installed = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
		const plugins = installed.plugins ?? {};
		return Object.keys(plugins).some((k) => k.startsWith(`${PLUGIN_NAME}@`));
	} catch {
		return false;
	}
}

/** Main install flow. */
export async function install(): Promise<void> {
	const skipPrompts = process.argv.includes("--yes") || !process.stdin.isTTY;

	// Banner
	console.log("");
	console.log(bold(`  Megazord v${VERSION}`));
	console.log(dim("  Unified framework for Claude Code"));
	console.log("");

	// Detect environment
	const spinner = createSpinner("Detecting environment...");
	spinner.start();
	const detection = detectPlugins();
	spinnerSuccess(spinner, "Environment detected");

	// Check Claude Code
	if (!detection.claudeCodeInstalled) {
		console.log("");
		console.log(error("  Claude Code not detected."));
		console.log(dim("  Is Claude Code installed? Run `claude --version` to check."));
		console.log("");
		process.exit(1);
	}

	// Already installed?
	if (detection.megazordInstalled && !skipPrompts) {
		console.log(info("  Megazord is already installed."));
		const choice = await selectOption("What would you like to do?", [
			"Update",
			"Reinstall",
			"Uninstall",
			"Cancel",
		]);
		if (choice === "Cancel") {
			console.log(dim("  Cancelled."));
			return;
		}
		if (choice === "Uninstall") {
			const { uninstall } = await import("./uninstall.js");
			await uninstall();
			return;
		}
		// Update and Reinstall both proceed with installation
	}

	// Coexistence info
	if (detection.gsdInstalled) {
		console.log(
			info("  GSD detected — Megazord coexists peacefully. Both /gsd: and /mz: commands will work."),
		);
	}
	if (detection.superpowersInstalled) {
		console.log(
			info(
				"  Superpowers detected — Megazord coexists peacefully. Both /superpowers: and /mz: commands will work.",
			),
		);
	}

	// Confirm
	if (!skipPrompts) {
		console.log("");
		const proceed = await confirm("  Install Megazord?");
		if (!proceed) {
			console.log(dim("  Installation cancelled."));
			return;
		}
	}

	// Install
	console.log("");
	const installSpinner = createSpinner("Installing Megazord...");
	installSpinner.start();

	// Step 1: Create local marketplace with proper structure
	const marketplacePath = createLocalMarketplace();

	// Step 2: Try claude CLI, fall back to manual registration
	const installed = installViaClaudeCli(marketplacePath);
	if (!installed) {
		installFallback(marketplacePath);
	}

	// Step 3: Verify
	if (verifyInstallation()) {
		spinnerSuccess(installSpinner, "Megazord installed!");
	} else {
		spinnerFail(installSpinner, "Installation could not be verified");
		console.log(warn("  The plugin was installed but verification failed."));
		console.log(dim("  Try running `/mz:help` in Claude Code to check if it works."));
	}

	console.log("");
	console.log(success("  Megazord installed! Run /mz:help in Claude Code to get started."));
	console.log("");
}
