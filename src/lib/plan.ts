import { basename } from "node:path";
import fse from "fs-extra";
import matter from "gray-matter";
import { z } from "zod";
import { safeJoin, sanitizeEntry } from "./paths.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

/** Zod schema for PLAN.md frontmatter validation */
export const PlanMetadataSchema = z.object({
	phase: z.string(),
	plan: z.union([z.string(), z.number()]).transform((v) => String(v).padStart(2, "0")),
	type: z.string().default("execute"),
	wave: z.number().default(1),
	depends_on: z.array(z.string()).default([]),
	files_modified: z.array(z.string()).default([]),
	autonomous: z.boolean().default(true),
	requirements: z.array(z.string()).default([]),
});

/** Validated plan frontmatter */
export type PlanMetadata = z.infer<typeof PlanMetadataSchema>;

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** A parsed plan file with metadata and full content */
export interface PlanFile {
	path: string;
	filename: string;
	metadata: PlanMetadata;
	content: string;
}

/** A group of plans in the same execution wave */
export interface PlanWave {
	wave: number;
	plans: PlanFile[];
}

// ─── Plan filename pattern ──────────────────────────────────────────────────

const PLAN_FILENAME_RE = /^\d+-\d+-PLAN\.md$/;
const _SUMMARY_FILENAME_RE = /^\d+-\d+-SUMMARY\.md$/;

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Parse a single PLAN.md file: read from disk, extract frontmatter via
 * gray-matter, validate with Zod, return a PlanFile with full content
 * (including frontmatter) for embedding in Task prompts.
 */
export function parsePlan(planPath: string): PlanFile {
	const raw = fse.readFileSync(planPath, "utf-8");
	const parsed = matter(raw);

	const result = PlanMetadataSchema.safeParse(parsed.data);
	if (!result.success) {
		throw new Error(`Invalid frontmatter in ${planPath}: ${result.error.message}`);
	}

	return {
		path: planPath,
		filename: basename(planPath),
		metadata: result.data,
		content: raw, // Full content including frontmatter for embedding
	};
}

/**
 * List all PLAN.md files in a phase directory.
 * Filters for files matching the pattern `NN-NN-PLAN.md`, sorts by name,
 * and parses each one.
 */
export function listPlanFiles(phaseDir: string): PlanFile[] {
	if (!fse.pathExistsSync(phaseDir)) return [];

	const files = fse
		.readdirSync(phaseDir)
		.filter((f: string) => PLAN_FILENAME_RE.test(f))
		.sort();

	return files.map((f: string) => parsePlan(safeJoin(phaseDir, sanitizeEntry(f))));
}

/**
 * Group plans into waves based on the `wave` field in frontmatter.
 * Returns an array of PlanWave sorted by wave number.
 */
export function computeWaves(plans: PlanFile[]): PlanWave[] {
	const waveMap = new Map<number, PlanFile[]>();

	for (const plan of plans) {
		const w = plan.metadata.wave;
		if (!waveMap.has(w)) {
			waveMap.set(w, []);
		}
		waveMap.get(w)?.push(plan);
	}

	return Array.from(waveMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([wave, wavePlans]) => ({ wave, plans: wavePlans }));
}

/**
 * Check if a plan has been completed by looking for its matching SUMMARY.md.
 * Extracts the phase number prefix from `meta.phase` (e.g., "04" from
 * "04-subagent-execution-and-atomic-commits").
 */
export function isPlanComplete(phaseDir: string, meta: PlanMetadata): boolean {
	const padded = meta.phase.split("-")[0];
	const summaryFilename = `${padded}-${meta.plan}-SUMMARY.md`;
	return fse.pathExistsSync(safeJoin(phaseDir, summaryFilename));
}

/**
 * Return only incomplete plans (those without a matching SUMMARY.md).
 */
export function getIncompletePlans(phaseDir: string): PlanFile[] {
	const plans = listPlanFiles(phaseDir);
	return plans.filter((p) => !isPlanComplete(phaseDir, p.metadata));
}

/**
 * Detect file-level conflicts between plans in the same wave.
 * Builds a map of file paths to owner plan IDs (e.g., "04-01"),
 * and returns only entries with 2+ owners.
 */
export function detectWaveConflicts(plans: PlanFile[]): Map<string, string[]> {
	const fileOwners = new Map<string, string[]>();

	for (const plan of plans) {
		const padded = plan.metadata.phase.split("-")[0];
		const ownerId = `${padded}-${plan.metadata.plan}`;

		for (const file of plan.metadata.files_modified) {
			if (!fileOwners.has(file)) {
				fileOwners.set(file, []);
			}
			fileOwners.get(file)?.push(ownerId);
		}
	}

	// Filter to only conflicting files (2+ owners)
	const conflicts = new Map<string, string[]>();
	for (const [file, owners] of fileOwners) {
		if (owners.length >= 2) {
			conflicts.set(file, owners);
		}
	}

	return conflicts;
}
