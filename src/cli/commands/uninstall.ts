import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { marketplacesDir } from "../../lib/paths.js";
import { success, dim, warn } from "../utils/colors.js";
import { createSpinner, spinnerSuccess, spinnerFail } from "../utils/spinner.js";

/** Prompt user for a yes/no confirmation. Returns true if confirmed. */
async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`${message} (y/N) `, (answer) => {
			rl.close();
			resolve(
				answer.trim().toLowerCase() === "y" ||
					answer.trim().toLowerCase() === "yes",
			);
		});
	});
}

/** Main uninstall flow. */
export async function uninstall(): Promise<void> {
	const skipPrompts = process.argv.includes("--yes") || !process.stdin.isTTY;

	if (!skipPrompts) {
		const proceed = await confirm("  Uninstall Megazord?");
		if (!proceed) {
			console.log(dim("  Cancelled."));
			return;
		}
	}

	const spinner = createSpinner("Uninstalling Megazord...");
	spinner.start();

	// Try claude plugin uninstall
	try {
		execSync("claude plugin uninstall mz", {
			stdio: "pipe",
			timeout: 15_000,
		});
	} catch {
		// Plugin may not be registered via claude — continue cleanup
	}

	// Remove marketplace directory
	const marketplaceDir = join(marketplacesDir, "megazord");
	if (existsSync(marketplaceDir)) {
		try {
			rmSync(marketplaceDir, { recursive: true, force: true });
		} catch {
			spinnerFail(spinner, "Failed to remove marketplace directory");
			console.log(warn(`  Could not remove ${marketplaceDir}`));
			return;
		}
	}

	spinnerSuccess(spinner, "Megazord uninstalled");
	console.log("");
	console.log(success("  Megazord has been removed."));
	console.log("");
}
