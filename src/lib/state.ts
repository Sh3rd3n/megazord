import { execSync } from "node:child_process";
import fse from "fs-extra";
import { safeJoin } from "./paths.js";

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
	const statePath = safeJoin(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return null;

	const content = fse.readFileSync(statePath, "utf-8");
	const lines = extractSection(content, "Current Position");

	// Parse "Phase: N of M (Name) -- Status" or "Phase: N of M (Name)"
	const phaseLine = extractField(lines, "Phase");
	if (!phaseLine) return null;

	const phaseMatch = phaseLine.match(/^(\d+)\s+of\s+(\d+)\s*\(([^)]+)\)/);
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
	const progressPercent = progressMatch ? Number.parseInt(progressMatch[1], 10) : 0;

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
export function readSessionContinuity(planningDir: string): SessionContinuity | null {
	const statePath = safeJoin(planningDir, STATE_FILENAME);
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
		stashRef: stashRefRaw && stashRefRaw.toLowerCase() !== "none" ? stashRefRaw : null,
		lastError: lastErrorRaw && lastErrorRaw.toLowerCase() !== "none" ? lastErrorRaw : null,
	};
}

// ─── STATE.md Update Functions ──────────────────────────────────────────────

/**
 * Replace a section in STATE.md content (between its ## heading and the next ## heading).
 * Returns the updated full content string.
 */
function replaceSection(content: string, heading: string, newSectionBody: string): string {
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
export function updatePosition(planningDir: string, updates: Partial<StatePosition>): void {
	const statePath = safeJoin(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return;

	// Read current values
	const current = readPosition(planningDir);
	if (!current) return;

	// Merge updates
	const merged = { ...current, ...updates };

	// Rebuild section body
	const statusSuffix = merged.status !== "Unknown" ? ` -- ${merged.status}` : "";
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
	const statePath = safeJoin(planningDir, STATE_FILENAME);
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
		const beforeCount = beforeList.split("\n").filter(Boolean).length;

		// Stash with tagged message
		const safeDescription = description.replace(/"/g, '\\"');
		execSync(`git stash push -m "mz:pause -- ${safeDescription}"`, {
			encoding: "utf-8",
		});

		// Count stashes after to verify
		const afterList = execSync("git stash list", { encoding: "utf-8" });
		const afterCount = afterList.split("\n").filter(Boolean).length;

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
	// Validate stash ref format (e.g., "stash@{0}")
	if (!/^stash@\{\d+\}$/.test(stashRef)) {
		return {
			success: false,
			stashRef,
			message: `Invalid stash ref format: ${stashRef}`,
		};
	}

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
		const errStr = err instanceof Error ? err.message : String(err);
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
	const roadmapPath = safeJoin(planningDir, ROADMAP_FILENAME);
	if (!fse.pathExistsSync(roadmapPath)) {
		return { overall: 0, currentPhase: { completed: 0, total: 0 } };
	}

	const roadmapContent = fse.readFileSync(roadmapPath, "utf-8");
	const lines = roadmapContent.split("\n");

	// Count phases from roadmap: lines matching "- [ ] **Phase" or "- [x] **Phase"
	const phaseLines = lines.filter((l) => l.match(/^-\s+\[[ x]\]\s+\*\*Phase\s+\d+/) !== null);
	const totalPhases = phaseLines.length;
	if (totalPhases === 0) {
		return { overall: 0, currentPhase: { completed: 0, total: 0 } };
	}

	// Count completed phases
	const completedPhases = phaseLines.filter((l) => l.match(/^-\s+\[x\]/)).length;

	// Determine current phase from STATE.md
	const position = readPosition(planningDir);
	const currentPhaseNum = position?.phase ?? completedPhases + 1;

	// Find phase directory for current phase
	const phasesDir = safeJoin(planningDir, "phases");
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
			currentPhaseDir = safeJoin(phasesDir, phaseDirs[0]);

			// Count PLAN.md files
			const planFiles = fse
				.readdirSync(currentPhaseDir)
				.filter((f: string) => f.match(/^\d+-\d+-PLAN\.md$/) !== null);
			totalPlansInPhase = planFiles.length;

			// Count SUMMARY.md files (completed plans)
			const summaryFiles = fse
				.readdirSync(currentPhaseDir)
				.filter((f: string) => f.match(/^\d+-\d+-SUMMARY\.md$/) !== null);
			completedPlansInPhase = summaryFiles.length;
		}
	}

	// Calculate overall progress
	const currentPhaseFraction =
		totalPlansInPhase > 0 ? completedPlansInPhase / totalPlansInPhase : 0;
	const overall = Math.round(((completedPhases + currentPhaseFraction) / totalPhases) * 100);

	return {
		overall,
		currentPhase: {
			completed: completedPlansInPhase,
			total: totalPlansInPhase,
		},
	};
}

// ─── Execution Lifecycle Functions ──────────────────────────────────────────

/** Result from advancePlan operation */
export interface AdvancePlanResult {
	success: boolean;
	plan: number;
	totalPlans: number;
	isLast: boolean;
}

/**
 * Advance the plan counter in STATE.md by 1.
 * Recalculates progress and detects last-plan edge case.
 * Updates status to "Phase complete" if this was the last plan.
 */
export function advancePlan(planningDir: string): AdvancePlanResult {
	const current = readPosition(planningDir);
	if (!current) {
		return { success: false, plan: 0, totalPlans: 0, isLast: false };
	}

	const newPlan = current.plan + 1;
	const isLast = newPlan >= current.totalPlans;

	// Recalculate progress
	const progress = calculateProgress(planningDir);

	// Update position
	const updates: Partial<StatePosition> = {
		plan: newPlan,
		progressPercent: progress.overall,
	};

	if (isLast) {
		updates.status = "Phase complete";
	}

	updatePosition(planningDir, updates);

	return {
		success: true,
		plan: newPlan,
		totalPlans: current.totalPlans,
		isLast,
	};
}

/**
 * Record execution metrics for a completed plan.
 * Updates the "Performance Metrics" section in STATE.md:
 * - Adds or updates the phase row in the "By Phase" table
 * - Updates the "Velocity" total plans completed and total execution time
 */
export function recordMetric(
	planningDir: string,
	phase: string,
	_plan: string,
	duration: string,
	_tasks: number,
	_files: number,
): void {
	const statePath = safeJoin(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return;

	let content = fse.readFileSync(statePath, "utf-8");
	const lines = content.split("\n");

	// Parse duration string to minutes (e.g., "5min" -> 5)
	const durationMin = parseDurationMin(duration);

	// ─── Update "By Phase" table ────────────────────────────────────────
	// Find the table rows for the phase
	let phaseRowIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(new RegExp(`^\\|\\s*${escapeRegex(phase)}\\s*\\|`))) {
			phaseRowIdx = i;
			break;
		}
	}

	if (phaseRowIdx >= 0) {
		// Update existing row: | Phase | Plans | Total | Avg/Plan |
		const rowMatch = lines[phaseRowIdx].match(
			/^\|\s*([^|]+)\|\s*(\d+)\s*\|\s*(\d+)min\s*\|\s*[\d.]+min\s*\|/,
		);
		if (rowMatch) {
			const existingPlans = Number.parseInt(rowMatch[2], 10);
			const existingTotal = Number.parseInt(rowMatch[3], 10);
			const newPlans = existingPlans + 1;
			const newTotal = existingTotal + durationMin;
			const newAvg =
				newPlans > 0
					? `${(newTotal / newPlans).toFixed(newTotal % newPlans === 0 ? 0 : 1)}min`
					: `${durationMin}min`;
			lines[phaseRowIdx] = `| ${phase} | ${newPlans} | ${newTotal}min | ${newAvg} |`;
		}
	} else {
		// Find the table end to insert new row (after last | line in the By Phase table)
		let tableEndIdx = -1;
		let inByPhaseTable = false;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes("**By Phase:**")) {
				inByPhaseTable = true;
				continue;
			}
			if (inByPhaseTable && lines[i].startsWith("|")) {
				tableEndIdx = i;
			}
			if (
				inByPhaseTable &&
				!lines[i].startsWith("|") &&
				lines[i].trim() !== "" &&
				tableEndIdx > 0
			) {
				break;
			}
		}
		if (tableEndIdx >= 0) {
			const newRow = `| ${phase} | 1 | ${durationMin}min | ${durationMin}min |`;
			lines.splice(tableEndIdx + 1, 0, newRow);
		}
	}

	// ─── Update "Velocity" section ──────────────────────────────────────
	for (let i = 0; i < lines.length; i++) {
		// Update total plans completed
		const plansMatch = lines[i].match(/^-\s+Total plans completed:\s*(\d+)/);
		if (plansMatch) {
			const current = Number.parseInt(plansMatch[1], 10);
			lines[i] = `- Total plans completed: ${current + 1}`;
		}

		// Update total execution time (in hours)
		const timeMatch = lines[i].match(/^-\s+Total execution time:\s*([\d.]+)\s*hours?/);
		if (timeMatch) {
			const currentHours = Number.parseFloat(timeMatch[1]);
			const newHours = (currentHours + durationMin / 60).toFixed(2);
			lines[i] = `- Total execution time: ${newHours} hours`;
		}

		// Update average duration
		const avgMatch = lines[i].match(/^-\s+Average duration:\s*(\d+)min/);
		if (avgMatch) {
			// Recalculate from total time and total plans
			// Find the updated values
			const totalPlansLine = lines.find((l) => l.match(/^-\s+Total plans completed:/));
			const totalTimeLine = lines.find((l) => l.match(/^-\s+Total execution time:/));
			if (totalPlansLine && totalTimeLine) {
				const tp = Number.parseInt(totalPlansLine.match(/(\d+)$/)?.[1] ?? "1", 10);
				const tt = Number.parseFloat(totalTimeLine.match(/([\d.]+)\s*hours?/)?.[1] ?? "0");
				const avgMin = Math.round((tt * 60) / tp);
				lines[i] = `- Average duration: ${avgMin}min`;
			}
		}
	}

	content = lines.join("\n");
	fse.writeFileSync(statePath, content, "utf-8");
}

/**
 * Add a decision to the "### Decisions" subsection within "## Accumulated Context".
 * Appends `- Phase {phase}: {decision}` after the last existing decision line.
 */
export function addDecision(planningDir: string, phase: string, decision: string): void {
	const statePath = safeJoin(planningDir, STATE_FILENAME);
	if (!fse.pathExistsSync(statePath)) return;

	const content = fse.readFileSync(statePath, "utf-8");
	const lines = content.split("\n");

	// Find the ### Decisions heading
	let decisionsHeadingIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() === "### Decisions") {
			decisionsHeadingIdx = i;
			break;
		}
	}

	if (decisionsHeadingIdx < 0) return;

	// Find the last "- Phase" or "- Roadmap:" decision line after the heading
	let lastDecisionLineIdx = decisionsHeadingIdx;
	for (let i = decisionsHeadingIdx + 1; i < lines.length; i++) {
		// Stop at next heading
		if (lines[i].startsWith("### ") || lines[i].startsWith("## ")) {
			break;
		}
		// Track the last decision-style line
		if (lines[i].match(/^- (Phase|Roadmap)/)) {
			lastDecisionLineIdx = i;
		}
	}

	// Insert after the last decision line
	const newLine = `- Phase ${phase}: ${decision}`;
	lines.splice(lastDecisionLineIdx + 1, 0, newLine);

	fse.writeFileSync(statePath, lines.join("\n"), "utf-8");
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/** Parse a duration string like "5min" or "12min" to numeric minutes */
function parseDurationMin(duration: string): number {
	const match = duration.match(/^(\d+)/);
	return match ? Number.parseInt(match[1], 10) : 0;
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
