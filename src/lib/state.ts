import { join } from "node:path";
import { execSync } from "node:child_process";
import fse from "fs-extra";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATE_FILENAME = "STATE.md";
const ROADMAP_FILENAME = "ROADMAP.md";

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** Parsed fields from the ## Current Position section of STATE.md */
export interface StatePosition {
	phase: number;
	totalPhases: number;
	phaseName: string;
	plan: number;
	totalPlans: number;
	status: string;
	lastActivity: string;
	progressPercent: number;
}

/** Parsed fields from the ## Session Continuity section of STATE.md */
export interface SessionContinuity {
	lastSession: string;
	stoppedAt: string;
	resumeFile: string;
	stashRef: string | null;
	lastError: string | null;
}

/** Result from git stash operations */
export interface StashResult {
	success: boolean;
	stashRef: string | null;
	message: string;
}

// ─── STATE.md Parsing Helpers ───────────────────────────────────────────────

/**
 * Extract a section from STATE.md content by heading.
 * Returns the lines between the heading and the next ## heading (or EOF).
 */
function extractSection(content: string, heading: string): string[] {
	const lines = content.split("\n");
	let inSection = false;
	const sectionLines: string[] = [];

	for (const line of lines) {
		if (line.startsWith("## ") && line.includes(heading)) {
			inSection = true;
			continue;
		}
		if (inSection && line.startsWith("## ")) {
			break;
		}
		if (inSection) {
			sectionLines.push(line);
		}
	}

	return sectionLines;
}

/**
 * Extract a field value from a line like "Field: value" or "Field: value -- extra".
 * Returns the trimmed value string, or null if not found.
 */
function extractField(lines: string[], fieldName: string): string | null {
	for (const line of lines) {
		// Match "FieldName:" at start of line (case-insensitive)
		const pattern = new RegExp(`^${fieldName}:\\s*(.+)$`, "i");
		const match = line.match(pattern);
		if (match) {
			return match[1].trim();
		}
	}
	return null;
}

// ─── STATE.md Read Functions ────────────────────────────────────────────────

/**
 * Parse the ## Current Position section from STATE.md.
 * Returns null if STATE.md doesn't exist.
 *
 * Expected format:
 *   Phase: 3 of 8 (Core Skills and State Management) -- Context Gathered
 *   Plan: 0 of 3 in current phase
 *   Status: Ready for Planning
 *   Last activity: 2026-02-17 -- Phase 3 context gathered
 *   Progress: [███░░░░░░░] 25%
 */
export function readPosition(planningDir: string): StatePosition | null {
	const statePath = join(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return null;

	const content = fse.readFileSync(statePath, "utf-8");
	const lines = extractSection(content, "Current Position");

	// Parse "Phase: N of M (Name) -- Status" or "Phase: N of M (Name)"
	const phaseLine = extractField(lines, "Phase");
	if (!phaseLine) return null;

	const phaseMatch = phaseLine.match(
		/^(\d+)\s+of\s+(\d+)\s*\(([^)]+)\)/,
	);
	const phase = phaseMatch ? Number.parseInt(phaseMatch[1], 10) : 0;
	const totalPhases = phaseMatch ? Number.parseInt(phaseMatch[2], 10) : 0;
	const phaseName = phaseMatch ? phaseMatch[3].trim() : "";

	// Parse "Plan: N of M in current phase" or "Plan: N of M"
	const planLine = extractField(lines, "Plan");
	const planMatch = planLine?.match(/^(\d+)\s+of\s+(\d+)/);
	const plan = planMatch ? Number.parseInt(planMatch[1], 10) : 0;
	const totalPlans = planMatch ? Number.parseInt(planMatch[2], 10) : 0;

	// Parse "Status: ..."
	const status = extractField(lines, "Status") ?? "Unknown";

	// Parse "Last activity: ..."
	const lastActivity = extractField(lines, "Last activity") ?? "";

	// Parse "Progress: [...] NN%"
	const progressLine = lines.find((l) => l.trim().startsWith("Progress:"));
	const progressMatch = progressLine?.match(/(\d+)%/);
	const progressPercent = progressMatch
		? Number.parseInt(progressMatch[1], 10)
		: 0;

	return {
		phase,
		totalPhases,
		phaseName,
		plan,
		totalPlans,
		status,
		lastActivity,
		progressPercent,
	};
}

/**
 * Parse the ## Session Continuity section from STATE.md.
 * Handles both the original 3-field format and the extended 5-field format.
 * Returns null if STATE.md doesn't exist.
 */
export function readSessionContinuity(
	planningDir: string,
): SessionContinuity | null {
	const statePath = join(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return null;

	const content = fse.readFileSync(statePath, "utf-8");
	const lines = extractSection(content, "Session Continuity");

	const lastSession = extractField(lines, "Last session") ?? "";
	const stoppedAt = extractField(lines, "Stopped at") ?? "";
	const resumeFile = extractField(lines, "Resume file") ?? "";
	const stashRefRaw = extractField(lines, "Stash ref");
	const lastErrorRaw = extractField(lines, "Last error");

	return {
		lastSession,
		stoppedAt,
		resumeFile,
		stashRef:
			stashRefRaw && stashRefRaw.toLowerCase() !== "none"
				? stashRefRaw
				: null,
		lastError:
			lastErrorRaw && lastErrorRaw.toLowerCase() !== "none"
				? lastErrorRaw
				: null,
	};
}

// ─── STATE.md Update Functions ──────────────────────────────────────────────

/**
 * Replace a section in STATE.md content (between its ## heading and the next ## heading).
 * Returns the updated full content string.
 */
function replaceSection(
	content: string,
	heading: string,
	newSectionBody: string,
): string {
	const lines = content.split("\n");
	const result: string[] = [];
	let inSection = false;
	let sectionHeadingWritten = false;

	for (const line of lines) {
		if (line.startsWith("## ") && line.includes(heading)) {
			inSection = true;
			sectionHeadingWritten = true;
			result.push(line);
			result.push("");
			result.push(newSectionBody);
			continue;
		}
		if (inSection && line.startsWith("## ")) {
			inSection = false;
			result.push(line);
			continue;
		}
		if (!inSection) {
			result.push(line);
		}
	}

	if (!sectionHeadingWritten) {
		// Section doesn't exist yet; append it
		result.push("");
		result.push(`## ${heading}`);
		result.push("");
		result.push(newSectionBody);
	}

	return result.join("\n");
}

/**
 * Update specific fields in the ## Current Position section.
 * Only updates fields that are provided in the updates object.
 * Preserves all other sections.
 */
export function updatePosition(
	planningDir: string,
	updates: Partial<StatePosition>,
): void {
	const statePath = join(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return;

	// Read current values
	const current = readPosition(planningDir);
	if (!current) return;

	// Merge updates
	const merged = { ...current, ...updates };

	// Rebuild section body
	const statusSuffix =
		merged.status !== "Unknown" ? ` -- ${merged.status}` : "";
	const body = [
		`Phase: ${merged.phase} of ${merged.totalPhases} (${merged.phaseName})${statusSuffix}`,
		`Plan: ${merged.plan} of ${merged.totalPlans} in current phase`,
		`Status: ${merged.status}`,
		`Last activity: ${merged.lastActivity}`,
		"",
		`Progress: ${progressBar(merged.progressPercent)}`,
	].join("\n");

	const content = fse.readFileSync(statePath, "utf-8");
	const updated = replaceSection(content, "Current Position", body);
	fse.writeFileSync(statePath, updated, "utf-8");
}

/**
 * Update specific fields in the ## Session Continuity section.
 * Adds Stash ref and Last error lines if they don't exist.
 * Only updates fields that are provided.
 */
export function updateSessionContinuity(
	planningDir: string,
	updates: Partial<SessionContinuity>,
): void {
	const statePath = join(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return;

	// Read current values
	const current = readSessionContinuity(planningDir);
	const merged = {
		lastSession: current?.lastSession ?? "",
		stoppedAt: current?.stoppedAt ?? "",
		resumeFile: current?.resumeFile ?? "",
		stashRef: current?.stashRef ?? null,
		lastError: current?.lastError ?? null,
		...updates,
	};

	// Rebuild section body
	const body = [
		`Last session: ${merged.lastSession}`,
		`Stopped at: ${merged.stoppedAt}`,
		`Resume file: ${merged.resumeFile}`,
		`Stash ref: ${merged.stashRef ?? "None"}`,
		`Last error: ${merged.lastError ?? "None"}`,
	].join("\n");

	const content = fse.readFileSync(statePath, "utf-8");
	const updated = replaceSection(content, "Session Continuity", body);
	fse.writeFileSync(statePath, updated, "utf-8");
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

/**
 * Generate a 20-char Unicode block progress bar.
 * Uses U+2588 (full block) for filled and U+2591 (light shade) for empty.
 *
 * Example: [████████░░░░░░░░░░░░] 40%
 */
export function progressBar(percent: number): string {
	const clamped = Math.max(0, Math.min(100, percent));
	const filled = Math.round(clamped / 5); // 20 chars = 100%
	const empty = 20 - filled;
	const FULL_BLOCK = "\u2588";
	const LIGHT_SHADE = "\u2591";
	return `[${FULL_BLOCK.repeat(filled)}${LIGHT_SHADE.repeat(empty)}] ${clamped}%`;
}

// ─── Git Stash Functions ────────────────────────────────────────────────────

/**
 * Stash modified files with a Megazord-tagged message.
 * Returns a StashResult indicating success/failure and the stash ref if created.
 */
export function stashPause(description: string): StashResult {
	try {
		// Check if there are changes to stash
		const status = execSync("git status --porcelain", {
			encoding: "utf-8",
		}).trim();
		if (!status) {
			return {
				success: true,
				stashRef: null,
				message: "No modified files to stash",
			};
		}

		// Count stashes before
		const beforeList = execSync("git stash list", { encoding: "utf-8" });
		const beforeCount = beforeList
			.split("\n")
			.filter(Boolean).length;

		// Stash with tagged message
		const safeDescription = description.replace(/"/g, '\\"');
		execSync(`git stash push -m "mz:pause -- ${safeDescription}"`, {
			encoding: "utf-8",
		});

		// Count stashes after to verify
		const afterList = execSync("git stash list", { encoding: "utf-8" });
		const afterCount = afterList
			.split("\n")
			.filter(Boolean).length;

		if (afterCount > beforeCount) {
			const stashRef = execSync('git stash list --format="%gd" -1', {
				encoding: "utf-8",
			}).trim();
			const fileCount = status.split("\n").length;
			return {
				success: true,
				stashRef,
				message: `Stashed ${fileCount} file(s)`,
			};
		}

		return {
			success: true,
			stashRef: null,
			message: "No changes stashed (all files committed)",
		};
	} catch (err) {
		return {
			success: false,
			stashRef: null,
			message: `Stash failed: ${err instanceof Error ? err.message : String(err)}`,
		};
	}
}

/**
 * Pop a specific stash ref to restore stashed files.
 * Handles missing stash refs and merge conflicts gracefully.
 */
export function stashResume(stashRef: string): StashResult {
	try {
		// Verify stash exists
		const stashList = execSync("git stash list", { encoding: "utf-8" });
		if (!stashList.includes(stashRef)) {
			return {
				success: false,
				stashRef,
				message: `Stash ${stashRef} not found. It may have been popped manually.`,
			};
		}

		// Attempt pop
		execSync(`git stash pop "${stashRef}"`, { encoding: "utf-8" });
		return {
			success: true,
			stashRef: null,
			message: "Stash restored successfully",
		};
	} catch (err) {
		const errStr =
			err instanceof Error ? err.message : String(err);
		if (errStr.includes("CONFLICT")) {
			return {
				success: false,
				stashRef,
				message:
					"Stash pop failed: merge conflicts detected. Resolve conflicts manually, then run `git stash drop`.",
			};
		}
		return {
			success: false,
			stashRef,
			message: `Stash pop failed: ${errStr}`,
		};
	}
}

// ─── Progress Calculation ───────────────────────────────────────────────────

/**
 * Calculate overall project progress and current phase progress.
 * Reads ROADMAP.md for phase listing and counts SUMMARY files per phase.
 *
 * Overall progress = (completedPhases + currentPhasePlanProgress/totalPlansInPhase) / totalPhases * 100
 */
export function calculateProgress(planningDir: string): {
	overall: number;
	currentPhase: { completed: number; total: number };
} {
	const roadmapPath = join(planningDir, ROADMAP_FILENAME);
	if (!fse.pathExistsSync(roadmapPath)) {
		return { overall: 0, currentPhase: { completed: 0, total: 0 } };
	}

	const roadmapContent = fse.readFileSync(roadmapPath, "utf-8");
	const lines = roadmapContent.split("\n");

	// Count phases from roadmap: lines matching "- [ ] **Phase" or "- [x] **Phase"
	const phaseLines = lines.filter(
		(l) =>
			l.match(/^-\s+\[[ x]\]\s+\*\*Phase\s+\d+/) !== null,
	);
	const totalPhases = phaseLines.length;
	if (totalPhases === 0) {
		return { overall: 0, currentPhase: { completed: 0, total: 0 } };
	}

	// Count completed phases
	const completedPhases = phaseLines.filter((l) =>
		l.match(/^-\s+\[x\]/),
	).length;

	// Determine current phase from STATE.md
	const position = readPosition(planningDir);
	const currentPhaseNum = position?.phase ?? completedPhases + 1;

	// Find phase directory for current phase
	const phasesDir = join(planningDir, "phases");
	let currentPhaseDir: string | null = null;
	let totalPlansInPhase = 0;
	let completedPlansInPhase = 0;

	if (fse.pathExistsSync(phasesDir)) {
		// Find directory matching current phase number
		const phaseDirs = fse.readdirSync(phasesDir).filter((d: string) => {
			const match = d.match(/^(\d+)-/);
			return match && Number.parseInt(match[1], 10) === currentPhaseNum;
		});

		if (phaseDirs.length > 0) {
			currentPhaseDir = join(phasesDir, phaseDirs[0]);

			// Count PLAN.md files
			const planFiles = fse
				.readdirSync(currentPhaseDir)
				.filter((f: string) => f.match(/^\d+-\d+-PLAN\.md$/) !== null);
			totalPlansInPhase = planFiles.length;

			// Count SUMMARY.md files (completed plans)
			const summaryFiles = fse
				.readdirSync(currentPhaseDir)
				.filter(
					(f: string) => f.match(/^\d+-\d+-SUMMARY\.md$/) !== null,
				);
			completedPlansInPhase = summaryFiles.length;
		}
	}

	// Calculate overall progress
	const currentPhaseFraction =
		totalPlansInPhase > 0
			? completedPlansInPhase / totalPlansInPhase
			: 0;
	const overall = Math.round(
		((completedPhases + currentPhaseFraction) / totalPhases) * 100,
	);

	return {
		overall,
		currentPhase: {
			completed: completedPlansInPhase,
			total: totalPlansInPhase,
		},
	};
}
