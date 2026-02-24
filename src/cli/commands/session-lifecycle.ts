import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "commander";
import {
	megazordLastSeenVersionPath,
	megazordPluginDir,
	megazordUpdateCheckPath,
	megazordVersionPath,
} from "../../lib/paths.js";

// ─── ANSI helpers ────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";

function bold(s: string): string {
	return `${BOLD}${s}${RESET}`;
}

function dim(s: string): string {
	return `${DIM}${s}${RESET}`;
}

function yellow(s: string): string {
	return `${YELLOW}${BOLD}${s}${RESET}`;
}

// ─── Changelog parsing ───────────────────────────────────────────────────────

/**
 * Find CHANGELOG.md by checking the installed copy first,
 * then walking up from the current file's directory (dev/direct execution).
 */
function findChangelog(): string | null {
	// 1. Installed copy (copied during install/update)
	const installedPath = join(megazordPluginDir, "CHANGELOG.md");
	if (existsSync(installedPath)) return installedPath;

	// 2. Walk up from import.meta.dirname (works in dev and bundled contexts)
	let dir = dirname(fileURLToPath(import.meta.url));
	const root = dirname(dir); // stop at filesystem root
	while (dir !== root && dirname(dir) !== dir) {
		const candidate = join(dir, "CHANGELOG.md");
		if (existsSync(candidate)) return candidate;
		dir = dirname(dir);
	}

	return null;
}

/**
 * Parse a Keep a Changelog formatted file and extract the latest released version section.
 * Skips [Unreleased], returns content from first ## [x.y.z] heading to the next.
 */
function parseLatestVersionSection(content: string): { version: string; body: string } | null {
	const lines = content.split("\n");
	const versionHeadingRe = /^## \[(\d+\.\d+\.\d+)\]/;
	const linkReferenceRe = /^\[.*\]:/;

	let inSection = false;
	let version = "";
	const sectionLines: string[] = [];

	for (const line of lines) {
		if (!inSection) {
			const match = line.match(versionHeadingRe);
			if (match) {
				inSection = true;
				version = match[1];
				// Don't include the heading line itself in body
			}
		} else {
			// Stop at next version heading
			if (versionHeadingRe.test(line)) break;
			// Skip link reference lines at the bottom
			if (linkReferenceRe.test(line)) continue;
			sectionLines.push(line);
		}
	}

	if (!version) return null;

	// Trim leading/trailing blank lines from body
	let body = sectionLines.join("\n").trimEnd();
	// Remove leading newlines
	while (body.startsWith("\n")) body = body.slice(1);

	return { version, body };
}

// ─── Changelog display ───────────────────────────────────────────────────────

function displayChangelog(version: string, body: string): void {
	const separator = "─".repeat(47);
	console.log(`\n${dim(separator)}`);
	console.log(`${bold(`What's New in v${version}`)}`);
	console.log(`${dim(separator)}`);
	console.log(body);
	console.log(`${dim(separator)}\n`);
}

// ─── Update notification ─────────────────────────────────────────────────────

interface UpdateCheckData {
	latest: string;
	current: string;
	checked: string;
}

/**
 * Read the cached .update-check file and determine if a newer version is available.
 * Returns the latest version string if an update is available, null otherwise.
 */
function readUpdateAvailable(): string | null {
	if (!existsSync(megazordUpdateCheckPath)) return null;
	try {
		const data: UpdateCheckData = JSON.parse(readFileSync(megazordUpdateCheckPath, "utf-8"));
		if (!data.latest || !data.current) return null;

		// Compare using semantic versioning parts
		const toNumbers = (v: string) => v.split(".").map(Number);
		const latest = toNumbers(data.latest);
		const current = toNumbers(data.current);

		for (let i = 0; i < Math.max(latest.length, current.length); i++) {
			const l = latest[i] ?? 0;
			const c = current[i] ?? 0;
			if (l > c) return data.latest;
			if (l < c) return null;
		}
		return null;
	} catch {
		return null;
	}
}

function displayUpdateNotification(latestVersion: string): void {
	console.log(
		yellow(
			`\u2b06 Megazord v${latestVersion} available \u2014 run: bunx megazord-cli@latest update\n`,
		),
	);
}

// ─── Main lifecycle command ───────────────────────────────────────────────────

/**
 * Run the session lifecycle check:
 * 1. If .version !== .last-seen-version → show changelog, update .last-seen-version
 * 2. If .version === .last-seen-version → check for update notification, fire background check
 * 3. Exit silently if not installed or nothing to show
 */
async function runSessionLifecycle(): Promise<void> {
	// Read installed version
	if (!existsSync(megazordVersionPath)) return;
	const currentVersion = readFileSync(megazordVersionPath, "utf-8").trim();
	if (!currentVersion) return;

	// Read or initialize last-seen-version
	if (!existsSync(megazordLastSeenVersionPath)) {
		// Edge case: installed before this feature was added — mark as seen and exit silently
		try {
			writeFileSync(megazordLastSeenVersionPath, currentVersion);
		} catch {
			// Best-effort
		}
		return;
	}
	const lastSeenVersion = readFileSync(megazordLastSeenVersionPath, "utf-8").trim();

	if (currentVersion !== lastSeenVersion) {
		// CHANGELOG MODE: new version installed since last session
		const changelogPath = findChangelog();
		if (changelogPath) {
			const content = readFileSync(changelogPath, "utf-8");
			const parsed = parseLatestVersionSection(content);
			if (parsed) {
				displayChangelog(parsed.version, parsed.body);
			}
		}
		// Update .last-seen-version so changelog only shows once
		try {
			writeFileSync(megazordLastSeenVersionPath, currentVersion);
		} catch {
			// Best-effort — if this fails, user will see changelog again next session (acceptable)
		}
	} else {
		// UPDATE NOTIFICATION MODE: no new changelog, check if newer version available
		const latestVersion = readUpdateAvailable();
		if (latestVersion) {
			displayUpdateNotification(latestVersion);
		}
		// Fire background update check so next session has fresh data
		import("../utils/update-check.js").then((m) => m.checkForUpdate()).catch(() => {});
	}
}

// ─── Command registration ────────────────────────────────────────────────────

/**
 * Register the `tools session-lifecycle` subcommand.
 * Called by session-start.sh at the beginning of each Claude Code session.
 * Outputs changelog or update notification to stdout; exits 0 always.
 */
export function registerSessionLifecycleCommands(parent: Command): void {
	parent
		.command("session-lifecycle")
		.description(
			"Check for post-update changelog or update notification (called by session-start.sh)",
		)
		.action(async () => {
			try {
				await runSessionLifecycle();
			} catch {
				// Never fail a session start due to lifecycle check errors
			}
		});
}
