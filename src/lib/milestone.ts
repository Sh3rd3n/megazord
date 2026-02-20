import { execSync } from "node:child_process";
import { join } from "node:path";
import fse from "fs-extra";

// ─── Constants ──────────────────────────────────────────────────────────────

const MILESTONES_DIR = "milestones";
const MILESTONES_LOG = "MILESTONES.md";

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** Result from createMilestone */
export interface CreateMilestoneResult {
	version: string;
	name: string;
	phases: number[];
	path: string;
}

/** Result from archiveMilestone */
export interface ArchiveResult {
	version: string;
	date: string;
	archived: string[];
}

/** Detail for a single phase in an audit check */
export interface AuditDetail {
	phase: number;
	verification_exists: boolean;
	status: string | null;
	passed: boolean;
}

/** Result from checkMilestoneAudit */
export interface AuditCheckResult {
	all_passed: boolean;
	details: AuditDetail[];
	failed_phases: number[];
	missing_verification: number[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Pad a phase number to 2 digits.
 */
function padPhase(n: number): string {
	return String(n).padStart(2, "0");
}

/**
 * Find the phase directory for a given phase number.
 */
function findPhaseDir(planningDir: string, phaseNumber: number): string | null {
	const phasesDir = join(planningDir, "phases");
	if (!fse.pathExistsSync(phasesDir)) return null;

	const prefix = padPhase(phaseNumber);
	const dirs = fse.readdirSync(phasesDir).filter((d: string) => d.startsWith(`${prefix}-`));

	return dirs.length > 0 ? join(phasesDir, dirs[0]) : null;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD).
 */
function today(): string {
	return new Date().toISOString().split("T")[0];
}

// ─── Milestone Create ───────────────────────────────────────────────────────

/**
 * Create a MILESTONE.md in .planning/ with version, name, phases, and status.
 */
export function createMilestone(
	planningDir: string,
	version: string,
	name: string,
	phases: number[],
): CreateMilestoneResult {
	const milestonePath = join(planningDir, "MILESTONE.md");

	const content = [
		"---",
		`version: ${version}`,
		`name: ${name}`,
		`phases: [${phases.join(", ")}]`,
		"status: active",
		`created: ${today()}`,
		"---",
		"",
		`# Milestone: ${version} - ${name}`,
		"",
		"## Phases",
		"",
		...phases.map((p) => `- Phase ${p}`),
		"",
		"## Status",
		"",
		"Active - In progress",
		"",
		`*Created: ${today()}*`,
		"",
	].join("\n");

	fse.writeFileSync(milestonePath, content, "utf-8");

	return {
		version,
		name,
		phases,
		path: milestonePath,
	};
}

// ─── Milestone Archive ──────────────────────────────────────────────────────

/**
 * Archive a milestone by copying ROADMAP.md and REQUIREMENTS.md to milestones/,
 * optionally copying phase directories, creating a MILESTONES.md log entry,
 * and creating a git tag.
 */
export function archiveMilestone(planningDir: string, version: string): ArchiveResult {
	const milestonesDir = join(planningDir, MILESTONES_DIR);
	fse.mkdirSync(milestonesDir, { recursive: true });

	const archived: string[] = [];

	// Archive ROADMAP.md
	const roadmapSrc = join(planningDir, "ROADMAP.md");
	const roadmapDst = join(milestonesDir, `${version}-ROADMAP.md`);
	if (fse.pathExistsSync(roadmapSrc)) {
		fse.copySync(roadmapSrc, roadmapDst);
		archived.push(roadmapDst);
	}

	// Archive REQUIREMENTS.md
	const reqSrc = join(planningDir, "REQUIREMENTS.md");
	const reqDst = join(milestonesDir, `${version}-REQUIREMENTS.md`);
	if (fse.pathExistsSync(reqSrc)) {
		fse.copySync(reqSrc, reqDst);
		archived.push(reqDst);
	}

	// Optionally copy phase directories to milestones/{version}-phases/
	const phasesDir = join(planningDir, "phases");
	if (fse.pathExistsSync(phasesDir)) {
		const phaseArchiveDir = join(milestonesDir, `${version}-phases`);
		fse.copySync(phasesDir, phaseArchiveDir);
		archived.push(phaseArchiveDir);
	}

	// Create/append to MILESTONES.md log
	const logPath = join(milestonesDir, MILESTONES_LOG);
	const dateStr = today();
	const logEntry = `| ${version} | ${dateStr} | Archived | ${archived.length} files |\n`;

	if (fse.pathExistsSync(logPath)) {
		const existing = fse.readFileSync(logPath, "utf-8");
		fse.writeFileSync(logPath, existing + logEntry, "utf-8");
	} else {
		const logContent = [
			"# Milestones Log",
			"",
			"| Version | Date | Status | Details |",
			"|---------|------|--------|---------|",
			logEntry,
		].join("\n");
		fse.writeFileSync(logPath, logContent, "utf-8");
	}

	// Create git tag
	try {
		const tagMessage = `Milestone ${version} archived on ${dateStr}`;
		execSync(`git tag -a "milestone/${version}" -m "${tagMessage.replace(/"/g, '\\"')}"`, {
			encoding: "utf-8",
		});
	} catch (_err) {
		// Tag creation is best-effort; may fail if tag already exists
	}

	return {
		version,
		date: dateStr,
		archived,
	};
}

// ─── Milestone Audit ────────────────────────────────────────────────────────

/**
 * Check verification status for all phases in a milestone.
 * For each phase: check VERIFICATION.md exists and status is passed.
 */
export function checkMilestoneAudit(planningDir: string, phases: number[]): AuditCheckResult {
	const details: AuditDetail[] = [];
	const failedPhases: number[] = [];
	const missingVerification: number[] = [];

	for (const phase of phases) {
		const phaseDir = findPhaseDir(planningDir, phase);

		if (!phaseDir || !fse.pathExistsSync(phaseDir)) {
			details.push({
				phase,
				verification_exists: false,
				status: null,
				passed: false,
			});
			missingVerification.push(phase);
			continue;
		}

		// Look for VERIFICATION.md
		const files = fse.readdirSync(phaseDir);
		const verificationFile = files.find((f: string) => f.match(/VERIFICATION\.md$/));

		if (!verificationFile) {
			details.push({
				phase,
				verification_exists: false,
				status: null,
				passed: false,
			});
			missingVerification.push(phase);
			continue;
		}

		const verificationPath = join(phaseDir, verificationFile);
		const content = fse.readFileSync(verificationPath, "utf-8");

		// Parse status from frontmatter
		const statusMatch = content.match(/^status:\s*(.+)$/m);
		const status = statusMatch ? statusMatch[1].trim() : null;

		const passed = status === "passed" || status === "human_needed";

		details.push({
			phase,
			verification_exists: true,
			status,
			passed,
		});

		if (!passed) {
			failedPhases.push(phase);
		}
	}

	const allPassed = failedPhases.length === 0 && missingVerification.length === 0;

	return {
		all_passed: allPassed,
		details,
		failed_phases: failedPhases,
		missing_verification: missingVerification,
	};
}
