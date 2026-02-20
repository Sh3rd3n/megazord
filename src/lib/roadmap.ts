import { join } from "node:path";
import fse from "fs-extra";

// ─── Constants ──────────────────────────────────────────────────────────────

const ROADMAP_FILENAME = "ROADMAP.md";

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** Parsed phase entry from ROADMAP.md */
export interface RoadmapPhase {
	number: number | string;
	name: string;
	slug: string;
	status: "completed" | "in-progress" | "not-started";
	goal: string;
	requirements: string[];
	depends_on: string;
}

/** Result from addPhase operation */
export interface AddPhaseResult {
	phase_number: number;
	padded: string;
	name: string;
	slug: string;
	directory: string;
}

/** Result from removePhase operation */
export interface RemovePhaseResult {
	removed: number;
	renumbered: Record<number, number>;
}

/** Result from insertPhase operation */
export interface InsertPhaseResult {
	phase_number: string;
	name: string;
	slug: string;
	directory: string;
}

/** Result from checkVerificationGate */
export interface VerificationGateResult {
	exists: boolean;
	status: string | null;
	passed: boolean;
	message: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from a description.
 * Lowercase, replace spaces/special chars with hyphens, strip consecutive hyphens.
 */
export function generateSlug(description: string): string {
	return description
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

/**
 * Pad a phase number to 2 digits.
 */
function padPhase(n: number): string {
	return String(n).padStart(2, "0");
}

/**
 * Find the phase directory for a given phase number (integer or decimal).
 * Scans the phases/ directory for a matching prefix.
 */
function findPhaseDir(planningDir: string, phaseNumber: number | string): string | null {
	const phasesDir = join(planningDir, "phases");
	if (!fse.pathExistsSync(phasesDir)) return null;

	const prefix = typeof phaseNumber === "number" ? padPhase(phaseNumber) : String(phaseNumber);

	const dirs = fse.readdirSync(phasesDir).filter((d: string) => d.startsWith(`${prefix}-`));

	return dirs.length > 0 ? join(phasesDir, dirs[0]) : null;
}

// ─── Roadmap Parsing ────────────────────────────────────────────────────────

/**
 * Parse ROADMAP.md to extract all phases with metadata.
 * Handles both integer phases (1, 2, 3) and decimal phases (6.1, 6.2).
 * Returns sorted by phase number.
 */
export function parseRoadmapPhases(planningDir: string): RoadmapPhase[] {
	const roadmapPath = join(planningDir, ROADMAP_FILENAME);
	if (!fse.pathExistsSync(roadmapPath)) return [];

	const content = fse.readFileSync(roadmapPath, "utf-8");
	const lines = content.split("\n");

	const phases: RoadmapPhase[] = [];

	// Parse phases list entries: "- [x] **Phase N: Name** - Description"
	// or "- [ ] **Phase N: Name** - Description"
	const phaseListRe =
		/^-\s+\[([ x])\]\s+\*\*Phase\s+([\d.]+):\s+(.+?)\*\*(?:\s*-\s*(.+?))?(?:\s*\(completed\s+(.+?)\))?$/;

	for (const line of lines) {
		const match = line.match(phaseListRe);
		if (!match) continue;

		const checked = match[1] === "x";
		const numStr = match[2];
		const name = match[3].trim();
		const description = match[4]?.trim() ?? "";
		const phaseNum = numStr.includes(".") ? Number.parseFloat(numStr) : Number.parseInt(numStr, 10);

		// Determine status
		let status: "completed" | "in-progress" | "not-started";
		if (checked) {
			status = "completed";
		} else {
			// Check if it's in progress by looking for "In Progress" or similar markers
			status = "not-started";
		}

		const slug = generateSlug(name);

		// Parse goal from detail section
		let goal = "";
		let requirements: string[] = [];
		let depends_on = "";

		// Find the ### Phase N: detail section
		const detailHeading = `### Phase ${numStr}: ${name}`;
		const detailIdx = lines.findIndex((l) => l.startsWith(detailHeading));
		if (detailIdx >= 0) {
			for (let i = detailIdx + 1; i < lines.length; i++) {
				if (lines[i].startsWith("### ")) break;

				const goalMatch = lines[i].match(/^\*\*Goal\*\*:\s*(.+)$/);
				if (goalMatch) goal = goalMatch[1].trim();

				const reqMatch = lines[i].match(/^\*\*Requirements\*\*:\s*(.+)$/);
				if (reqMatch) {
					requirements = reqMatch[1]
						.split(",")
						.map((r) => r.trim())
						.filter(Boolean);
				}

				const depMatch = lines[i].match(/^\*\*Depends on\*\*:\s*(.+)$/);
				if (depMatch) depends_on = depMatch[1].trim();
			}
		}

		phases.push({
			number: phaseNum,
			name,
			slug,
			status,
			goal: goal || description,
			requirements,
			depends_on,
		});
	}

	// Sort by phase number (handles both integer and decimal)
	phases.sort((a, b) => {
		const na = typeof a.number === "string" ? Number.parseFloat(a.number) : a.number;
		const nb = typeof b.number === "string" ? Number.parseFloat(b.number) : b.number;
		return na - nb;
	});

	return phases;
}

// ─── Phase Management ───────────────────────────────────────────────────────

/**
 * Add a new phase at the end of the roadmap.
 * Creates phase directory and updates ROADMAP.md.
 */
export function addPhase(planningDir: string, description: string, goal?: string): AddPhaseResult {
	const roadmapPath = join(planningDir, ROADMAP_FILENAME);
	const content = fse.readFileSync(roadmapPath, "utf-8");

	// Find highest existing integer phase
	const phaseMatches = [...content.matchAll(/Phase\s+(\d+):/g)];
	let maxPhase = 0;
	for (const match of phaseMatches) {
		const num = Number.parseInt(match[1], 10);
		if (num > maxPhase) maxPhase = num;
	}

	const newPhase = maxPhase + 1;
	const padded = padPhase(newPhase);
	const slug = generateSlug(description);
	const directory = join(planningDir, "phases", `${padded}-${slug}`);

	// Create phase directory
	fse.mkdirSync(directory, { recursive: true });

	const lines = content.split("\n");

	// Insert phase entry into phases list (after last "- [ ]" or "- [x]" phase line)
	let lastPhaseListIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(/^-\s+\[[ x]\]\s+\*\*Phase\s+\d/)) {
			lastPhaseListIdx = i;
		}
	}

	if (lastPhaseListIdx >= 0) {
		const newEntry = `- [ ] **Phase ${newPhase}: ${description}** - ${goal || "TBD"}`;
		lines.splice(lastPhaseListIdx + 1, 0, newEntry);
	}

	// Find the location to insert phase detail section (before ## Progress)
	let progressIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startsWith("## Progress")) {
			progressIdx = i;
			break;
		}
	}

	const detailSection = [
		"",
		`### Phase ${newPhase}: ${description}`,
		`**Goal**: ${goal || "TBD"}`,
		`**Depends on**: Phase ${maxPhase}`,
		`**Requirements**: TBD`,
		"**Success Criteria** (what must be TRUE):",
		"  1. TBD",
		"**Plans**: 0 plans",
		"",
		"Plans:",
		`- (none yet)`,
	];

	if (progressIdx >= 0) {
		// Adjust progressIdx because we may have inserted a line above
		const adjustedProgressIdx =
			lastPhaseListIdx >= 0 && lastPhaseListIdx < progressIdx ? progressIdx + 1 : progressIdx;
		lines.splice(adjustedProgressIdx, 0, ...detailSection);
	}

	// Update the Progress table: add a new row
	// Find the table in the updated lines
	const updatedContent = lines.join("\n");
	const progressTableLines = updatedContent.split("\n");
	let lastTableRowIdx = -1;
	let inProgressTable = false;
	for (let i = 0; i < progressTableLines.length; i++) {
		if (progressTableLines[i].includes("Plans Complete") && progressTableLines[i].startsWith("|")) {
			inProgressTable = true;
			continue;
		}
		if (inProgressTable && progressTableLines[i].startsWith("|")) {
			// Skip separator row
			if (!progressTableLines[i].match(/^\|[-\s|]+$/)) {
				lastTableRowIdx = i;
			}
		}
		if (
			inProgressTable &&
			!progressTableLines[i].startsWith("|") &&
			progressTableLines[i].trim() !== ""
		) {
			break;
		}
	}

	if (lastTableRowIdx >= 0) {
		const newRow = `| ${newPhase}. ${description} | 0/0 | Not started | - |`;
		progressTableLines.splice(lastTableRowIdx + 1, 0, newRow);
	}

	fse.writeFileSync(roadmapPath, progressTableLines.join("\n"), "utf-8");

	return {
		phase_number: newPhase,
		padded,
		name: description,
		slug,
		directory,
	};
}

/**
 * Remove an unstarted phase from the roadmap.
 * Validates phase is not completed or in-progress.
 * Renumbers subsequent phases.
 */
export function removePhase(planningDir: string, phaseNumber: number): RemovePhaseResult {
	const phases = parseRoadmapPhases(planningDir);
	const target = phases.find((p) => p.number === phaseNumber);

	if (!target) {
		throw new Error(`Phase ${phaseNumber} not found in ROADMAP.md`);
	}

	if (target.status === "completed") {
		throw new Error(`Phase ${phaseNumber} is completed and cannot be removed`);
	}

	if (target.status === "in-progress") {
		throw new Error(`Phase ${phaseNumber} is in-progress and cannot be removed`);
	}

	const roadmapPath = join(planningDir, ROADMAP_FILENAME);
	let content = fse.readFileSync(roadmapPath, "utf-8");

	// Remove the phase list entry
	const listPattern = new RegExp(
		`^-\\s+\\[[ x]\\]\\s+\\*\\*Phase\\s+${phaseNumber}:.*\\*\\*.*$`,
		"m",
	);
	content = content.replace(listPattern, "").replace(/\n{3,}/g, "\n\n");

	// Remove the detail section (### Phase N: ...)
	const lines = content.split("\n");
	const result: string[] = [];
	let skipping = false;

	for (const line of lines) {
		if (line.match(new RegExp(`^###\\s+Phase\\s+${phaseNumber}:\\s+`))) {
			skipping = true;
			continue;
		}
		if (skipping && line.startsWith("### ")) {
			skipping = false;
		}
		if (!skipping) {
			result.push(line);
		}
	}

	content = result.join("\n");

	// Remove the progress table row
	const tableRowPattern = new RegExp(`^\\|\\s*${phaseNumber}\\.\\s+.*\\|.*\\|.*\\|.*\\|$`, "m");
	content = content.replace(tableRowPattern, "").replace(/\n{3,}/g, "\n\n");

	// Remove phase directory if it exists and has no SUMMARY files
	const phaseDir = findPhaseDir(planningDir, phaseNumber);
	if (phaseDir && fse.pathExistsSync(phaseDir)) {
		const files = fse.readdirSync(phaseDir);
		const hasSummaries = files.some((f: string) => f.match(/SUMMARY\.md$/));
		if (!hasSummaries) {
			fse.removeSync(phaseDir);
		}
	}

	// Renumber subsequent integer phases
	const renumbered: Record<number, number> = {};
	const subsequentPhases = phases
		.filter(
			(p) => typeof p.number === "number" && Number.isInteger(p.number) && p.number > phaseNumber,
		)
		.sort(
			(a, b) =>
				(typeof a.number === "number" ? a.number : 0) -
				(typeof b.number === "number" ? b.number : 0),
		);

	for (const phase of subsequentPhases) {
		const oldNum = phase.number as number;
		const newNum = oldNum - 1;
		renumbered[oldNum] = newNum;

		const oldPadded = padPhase(oldNum);
		const newPadded = padPhase(newNum);

		// Update references in ROADMAP.md content
		content = content
			.replace(new RegExp(`Phase\\s+${oldNum}:`, "g"), `Phase ${newNum}:`)
			.replace(new RegExp(`Phase\\s+${oldNum}\\b`, "g"), `Phase ${newNum}`)
			.replace(new RegExp(`${oldNum}\\.\\s+${phase.name}`, "g"), `${newNum}. ${phase.name}`);

		// Rename phase directory
		const oldDir = findPhaseDir(planningDir, oldNum);
		if (oldDir && fse.pathExistsSync(oldDir)) {
			const dirName = oldDir.split("/").pop() ?? "";
			const newDirName = dirName.replace(new RegExp(`^${oldPadded}`), newPadded);
			const newDir = join(planningDir, "phases", newDirName);
			fse.moveSync(oldDir, newDir);
		}
	}

	fse.writeFileSync(roadmapPath, content, "utf-8");

	return { removed: phaseNumber, renumbered };
}

/**
 * Insert a decimal phase between existing phases.
 * Finds the next available decimal number after `afterPhase`.
 * Does NOT renumber existing phases.
 */
export function insertPhase(
	planningDir: string,
	afterPhase: number,
	description: string,
	goal?: string,
): InsertPhaseResult {
	const roadmapPath = join(planningDir, ROADMAP_FILENAME);
	const content = fse.readFileSync(roadmapPath, "utf-8");

	// Scan for existing decimal phases after `afterPhase`
	const existingDecimals: number[] = [];
	const decimalRe = new RegExp(`Phase\\s+${afterPhase}\\.(\\d+):`, "g");
	let match: RegExpExecArray | null = decimalRe.exec(content);
	while (match !== null) {
		existingDecimals.push(Number.parseInt(match[1], 10));
		match = decimalRe.exec(content);
	}

	// Also scan phase directories for decimal naming
	const phasesDir = join(planningDir, "phases");
	if (fse.pathExistsSync(phasesDir)) {
		const dirs = fse.readdirSync(phasesDir);
		for (const dir of dirs) {
			const dirMatch = (dir as string).match(new RegExp(`^${padPhase(afterPhase)}\\.(\\d+)-`));
			if (dirMatch) {
				existingDecimals.push(Number.parseInt(dirMatch[1], 10));
			}
		}
	}

	// Find next available decimal
	let nextDecimal = 1;
	while (existingDecimals.includes(nextDecimal)) {
		nextDecimal++;
	}

	const phaseNumber = `${afterPhase}.${nextDecimal}`;
	const slug = generateSlug(description);
	const directory = join(planningDir, "phases", `${padPhase(afterPhase)}.${nextDecimal}-${slug}`);

	// Create phase directory
	fse.mkdirSync(directory, { recursive: true });

	const lines = content.split("\n");

	// Find the phase list entry for `afterPhase` and insert after it
	let afterPhaseListIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(new RegExp(`^-\\s+\\[[ x]\\]\\s+\\*\\*Phase\\s+${afterPhase}:`))) {
			afterPhaseListIdx = i;
			break;
		}
	}

	if (afterPhaseListIdx >= 0) {
		const newEntry = `- [ ] **Phase ${phaseNumber}: ${description}** - ${goal || "TBD"} (INSERTED)`;
		lines.splice(afterPhaseListIdx + 1, 0, newEntry);
	}

	// Find the detail section for `afterPhase` and insert a new detail section after it
	let _afterDetailIdx = -1;
	let nextSectionIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(new RegExp(`^###\\s+Phase\\s+${afterPhase}:\\s+`))) {
			_afterDetailIdx = i;
			// Find where this detail section ends
			for (let j = i + 1; j < lines.length; j++) {
				if (lines[j].startsWith("### ") || lines[j].startsWith("## ")) {
					nextSectionIdx = j;
					break;
				}
			}
			break;
		}
	}

	if (nextSectionIdx >= 0) {
		const detailSection = [
			"",
			`### Phase ${phaseNumber}: ${description}`,
			`**Goal**: ${goal || "TBD"}`,
			`**Depends on**: Phase ${afterPhase}`,
			`**Requirements**: TBD`,
			"**Success Criteria** (what must be TRUE):",
			"  1. TBD",
			"**Plans**: 0 plans",
			"",
			"Plans:",
			`- (none yet)`,
			"",
		];

		// Adjust nextSectionIdx because we may have inserted a list entry line above
		const adjustedIdx =
			afterPhaseListIdx >= 0 && afterPhaseListIdx < nextSectionIdx
				? nextSectionIdx + 1
				: nextSectionIdx;
		lines.splice(adjustedIdx, 0, ...detailSection);
	}

	fse.writeFileSync(roadmapPath, lines.join("\n"), "utf-8");

	return {
		phase_number: phaseNumber,
		name: description,
		slug,
		directory,
	};
}

// ─── Verification Gate ──────────────────────────────────────────────────────

/**
 * Check if a phase has a VERIFICATION.md and what its status is.
 * Used by /mz:plan to enforce the verification gate before planning the next phase.
 */
export function checkVerificationGate(
	planningDir: string,
	phaseNumber: number,
): VerificationGateResult {
	const phaseDir = findPhaseDir(planningDir, phaseNumber);

	if (!phaseDir || !fse.pathExistsSync(phaseDir)) {
		return {
			exists: false,
			status: null,
			passed: false,
			message: `Phase directory for phase ${phaseNumber} not found`,
		};
	}

	// Look for VERIFICATION.md (pattern: NN-VERIFICATION.md)
	const files = fse.readdirSync(phaseDir);
	const verificationFile = files.find((f: string) => f.match(/VERIFICATION\.md$/));

	if (!verificationFile) {
		return {
			exists: false,
			status: null,
			passed: false,
			message: `No VERIFICATION.md found for phase ${phaseNumber}`,
		};
	}

	const verificationPath = join(phaseDir, verificationFile);
	const content = fse.readFileSync(verificationPath, "utf-8");

	// Parse status from frontmatter (status: passed | gaps_found | human_needed)
	const statusMatch = content.match(/^status:\s*(.+)$/m);
	const status = statusMatch ? statusMatch[1].trim() : null;

	const passed = status === "passed" || status === "human_needed";

	return {
		exists: true,
		status,
		passed,
		message: passed
			? `Phase ${phaseNumber} verification: ${status}`
			: `Phase ${phaseNumber} verification has not passed (status: ${status || "unknown"})`,
	};
}
