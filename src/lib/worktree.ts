import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import fse from "fs-extra";
import { safeJoin, sanitizeEntry } from "./paths.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Information about a git worktree managed by Megazord */
export interface WorktreeInfo {
	/** Absolute worktree directory path */
	path: string;
	/** Branch name, format: mz/{team}/{agent} */
	branch: string;
	/** Agent identifier */
	agent: string;
	/** Team name */
	team: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXEC_OPTS = { encoding: "utf-8" as const, stdio: "pipe" as const };

/** Validate that a team/agent name contains only safe characters */
function validateName(name: string, label: string): string {
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		throw new Error(
			`Invalid ${label} name: must contain only alphanumeric, hyphens, and underscores`,
		);
	}
	return name;
}

/**
 * Returns the base directory for worktrees.
 * Uses `configDir` if provided, otherwise defaults to `~/.megazord/worktrees`.
 */
export function getWorktreeBase(configDir?: string): string {
	return configDir ?? join(homedir(), ".megazord", "worktrees");
}

// ─── Worktree lifecycle ──────────────────────────────────────────────────────

/**
 * Create a new git worktree for the given team/agent.
 * Path: `{base}/{team}/{agent}`, branch: `mz/{team}/{agent}`.
 */
export function createWorktree(
	team: string,
	agent: string,
	baseRef = "HEAD",
	baseDir?: string,
): WorktreeInfo {
	validateName(team, "team");
	validateName(agent, "agent");
	const base = getWorktreeBase(baseDir);
	const wtPath = safeJoin(base, team, agent);
	const branch = `mz/${team}/${agent}`;

	try {
		fse.ensureDirSync(join(base, team));
		execSync(`git worktree add "${wtPath}" -b "${branch}" ${baseRef}`, EXEC_OPTS);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to create worktree for ${agent} in team ${team}: ${msg}`);
	}

	return { path: wtPath, branch, agent, team };
}

/**
 * Remove a worktree and its tracking branch.
 * Silently ignores errors if worktree or branch was already removed.
 */
export function removeWorktree(team: string, agent: string, baseDir?: string): void {
	validateName(team, "team");
	validateName(agent, "agent");
	const base = getWorktreeBase(baseDir);
	const wtPath = safeJoin(base, team, agent);
	const branch = `mz/${team}/${agent}`;

	try {
		execSync(`git worktree remove "${wtPath}" --force`, EXEC_OPTS);
	} catch {
		// Silently ignore if already removed
	}

	try {
		execSync(`git branch -D "${branch}"`, EXEC_OPTS);
	} catch {
		// Silently ignore if branch already removed
	}
}

/**
 * Merge a worktree agent's branch back into the current branch.
 * Supports "merge" (default) and "rebase" strategies.
 */
export function mergeWorktree(
	team: string,
	agent: string,
	strategy: "merge" | "rebase" = "merge",
): { success: boolean; conflicts: boolean; message: string } {
	validateName(team, "team");
	validateName(agent, "agent");
	const branch = `mz/${team}/${agent}`;

	try {
		let output: string;
		if (strategy === "merge") {
			output = execSync(
				`git merge ${branch} --no-ff -m "merge(${team}): merge ${agent} work"`,
				EXEC_OPTS,
			);
		} else {
			output = execSync(`git rebase ${branch}`, EXEC_OPTS);
		}
		return { success: true, conflicts: false, message: output.trim() };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const hasConflicts = msg.includes("CONFLICT");
		return { success: false, conflicts: hasConflicts, message: msg };
	}
}

/**
 * List all worktrees belonging to a team.
 * Parses `git worktree list --porcelain` output and filters by team prefix.
 */
export function listTeamWorktrees(team: string): WorktreeInfo[] {
	const prefix = `mz/${team}/`;
	const results: WorktreeInfo[] = [];

	try {
		const raw = execSync("git worktree list --porcelain", EXEC_OPTS);
		const entries = raw.split("\n\n").filter((e) => e.trim().length > 0);

		for (const entry of entries) {
			const lines = entry.split("\n");
			let wtPath = "";
			let branch = "";

			for (const line of lines) {
				if (line.startsWith("worktree ")) {
					wtPath = line.slice("worktree ".length);
				}
				if (line.startsWith("branch refs/heads/")) {
					branch = line.slice("branch refs/heads/".length);
				}
			}

			if (branch.startsWith(prefix)) {
				const agent = branch.slice(prefix.length);
				results.push({ path: wtPath, branch, agent, team });
			}
		}
	} catch {
		// If git worktree list fails, return empty array
	}

	return results;
}

/**
 * Remove all worktrees for a team, clean up directories, and prune stale entries.
 */
export function pruneTeamWorktrees(team: string, baseDir?: string): void {
	const base = getWorktreeBase(baseDir);
	const teamDir = join(base, team);

	// Remove each agent worktree
	if (fse.pathExistsSync(teamDir)) {
		const agents = fse.readdirSync(teamDir);
		for (const agent of agents) {
			removeWorktree(team, sanitizeEntry(agent as string), baseDir);
		}
		fse.removeSync(teamDir);
	}

	// Prune stale worktree references
	try {
		execSync("git worktree prune", EXEC_OPTS);
	} catch {
		// Ignore prune errors
	}
}
