import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import {
	pluginsCacheDir,
	marketplacesDir,
	installedPluginsPath,
} from "../../lib/paths.js";
import { detectPlugins } from "../utils/detect-plugins.js";
import { success, error, info, warn, bold, dim } from "../utils/colors.js";
import { createSpinner, spinnerSuccess, spinnerFail } from "../utils/spinner.js";

const VERSION = "0.1.0";

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

/** Create the local marketplace for Megazord. */
function createMarketplace(): void {
	const marketplaceDir = join(marketplacesDir, "megazord");
	mkdirSync(marketplaceDir, { recursive: true });

	const marketplace = {
		name: "megazord-marketplace",
		description: "Megazord plugin marketplace",
		plugins: {
			mz: {
				source: {
					source: "npm",
					package: "megazord",
				},
			},
		},
	};

	writeFileSync(
		join(marketplaceDir, "marketplace.json"),
		JSON.stringify(marketplace, null, 2),
	);
}

/** Attempt to install via claude plugin install. Returns true if successful. */
function installViaClaudePlugin(): boolean {
	try {
		execSync("claude plugin install mz@megazord-marketplace", {
			stdio: "pipe",
			timeout: 30_000,
		});
		return true;
	} catch {
		return false;
	}
}

/** Fallback installation: copy plugin files to cache and register. */
function installFallback(): void {
	// Determine the source plugin directory (where this package is installed)
	const packageRoot = join(import.meta.dirname, "..", "..", "..");
	const targetDir = join(pluginsCacheDir, "megazord", "mz", VERSION);

	mkdirSync(targetDir, { recursive: true });

	// Copy essential plugin files
	const filesToCopy = [
		".claude-plugin/plugin.json",
		"hooks/hooks.json",
	];

	for (const file of filesToCopy) {
		const src = join(packageRoot, file);
		const dest = join(targetDir, file);
		if (existsSync(src)) {
			const destDir = join(dest, "..");
			mkdirSync(destDir, { recursive: true });
			writeFileSync(dest, readFileSync(src));
		}
	}

	// Copy skills directory
	const skillsSource = join(packageRoot, "skills");
	if (existsSync(skillsSource)) {
		copyDirSync(skillsSource, join(targetDir, "skills"));
	}

	// Register in installed_plugins.json
	let installed: Record<string, unknown> = {};
	if (existsSync(installedPluginsPath)) {
		try {
			installed = JSON.parse(readFileSync(installedPluginsPath, "utf-8"));
		} catch {
			// Start fresh
		}
	}

	const plugins = (installed.plugins ?? {}) as Record<string, unknown>;
	plugins[`mz@megazord-marketplace`] = {
		version: VERSION,
		source: { source: "npm", package: "megazord" },
		installedAt: new Date().toISOString(),
	};
	installed.plugins = plugins;

	mkdirSync(join(installedPluginsPath, ".."), { recursive: true });
	writeFileSync(installedPluginsPath, JSON.stringify(installed, null, 2));
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
		return Object.keys(plugins).some((k) => k.startsWith("mz@"));
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
		console.log(info("  GSD detected — Megazord coexists peacefully. Both /gsd: and /mz: commands will work."));
	}
	if (detection.superpowersInstalled) {
		console.log(info("  Superpowers detected — Megazord coexists peacefully. Both /superpowers: and /mz: commands will work."));
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

	// Step 1: Create local marketplace
	createMarketplace();

	// Step 2: Try claude plugin install, fall back if needed
	const installed = installViaClaudePlugin();
	if (!installed) {
		installFallback();
	}

	// Step 3: Verify
	if (verifyInstallation()) {
		spinnerSuccess(installSpinner, "Megazord installed!");
	} else {
		spinnerFail(installSpinner, "Installation could not be verified");
		console.log(warn("  The plugin was installed but verification failed."));
		console.log(dim("  Try running `claude /mz:help` to check if it works."));
	}

	console.log("");
	console.log(success("  Megazord installed! Run /mz:help to get started."));
	console.log("");
}
