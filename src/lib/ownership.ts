import fse from "fs-extra";
import type { PlanFile } from "./plan.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Maps agent name to list of file paths the agent is allowed to modify */
export type OwnershipManifest = Record<string, string[]>;

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Generate an ownership manifest from parsed plan files.
 * Each plan gets an entry keyed by `{agentPrefix}-{planNumber}` with
 * the list of files declared in its `files_modified` frontmatter field.
 */
export function generateOwnershipManifest(
	plans: PlanFile[],
	agentPrefix = "exec",
): OwnershipManifest {
	const manifest: OwnershipManifest = {};

	for (const plan of plans) {
		const key = `${agentPrefix}-${plan.metadata.plan}`;
		manifest[key] = plan.metadata.files_modified;
	}

	return manifest;
}

/**
 * Write an ownership manifest to disk as formatted JSON.
 */
export function writeOwnershipManifest(
	manifest: OwnershipManifest,
	outputPath: string,
): void {
	fse.writeJsonSync(outputPath, manifest, { spaces: 2 });
}

/**
 * Validate whether an agent is allowed to modify a given file path.
 * Uses prefix matching for directory-level ownership (e.g., "src/lib/"
 * matches "src/lib/config.ts").
 */
export function validateFileAccess(
	manifest: OwnershipManifest,
	agentName: string,
	filePath: string,
): { allowed: boolean; reason: string } {
	const allowedPaths = manifest[agentName];

	// Agent not in manifest — unrestricted
	if (allowedPaths === undefined) {
		return { allowed: true, reason: "Agent not in manifest (unrestricted)" };
	}

	// Agent has no file restrictions
	if (allowedPaths.length === 0) {
		return { allowed: true, reason: "Agent has no file restrictions" };
	}

	// Check prefix match against declared scope
	for (const allowed of allowedPaths) {
		if (filePath.startsWith(allowed)) {
			return { allowed: true, reason: "File within declared scope" };
		}
	}

	return {
		allowed: false,
		reason: `File '${filePath}' outside declared scope. Allowed: ${allowedPaths.join(", ")}`,
	};
}
