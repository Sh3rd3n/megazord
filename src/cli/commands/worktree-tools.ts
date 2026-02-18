import type { Command } from "commander";
import {
	createWorktree,
	removeWorktree,
	mergeWorktree,
	listTeamWorktrees,
	pruneTeamWorktrees,
} from "../../lib/worktree.js";

/**
 * Register worktree CLI subcommands on the given parent command.
 * All output is JSON for machine-readable consumption by skills.
 */
export function registerWorktreeCommands(parent: Command): void {
	const worktree = parent
		.command("worktree")
		.description("Git worktree operations for Agent Teams isolation");

	worktree
		.command("create")
		.description("Create a new worktree for a team agent")
		.requiredOption("--team <team>", "Team name")
		.requiredOption("--agent <agent>", "Agent identifier")
		.option("--base-ref <ref>", "Base git ref", "HEAD")
		.option("--base-dir <dir>", "Custom worktree base directory")
		.action(
			(opts: {
				team: string;
				agent: string;
				baseRef: string;
				baseDir?: string;
			}) => {
				try {
					const result = createWorktree(
						opts.team,
						opts.agent,
						opts.baseRef,
						opts.baseDir,
					);
					console.log(JSON.stringify(result, null, 2));
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					console.log(JSON.stringify({ error: msg }, null, 2));
					process.exit(1);
				}
			},
		);

	worktree
		.command("list")
		.description("List all worktrees for a team")
		.requiredOption("--team <team>", "Team name")
		.action((opts: { team: string }) => {
			try {
				const result = listTeamWorktrees(opts.team);
				console.log(JSON.stringify(result, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});

	worktree
		.command("merge")
		.description("Merge an agent's worktree branch into current branch")
		.requiredOption("--team <team>", "Team name")
		.requiredOption("--agent <agent>", "Agent identifier")
		.option("--strategy <strategy>", "Merge strategy: merge or rebase", "merge")
		.action(
			(opts: {
				team: string;
				agent: string;
				strategy: string;
			}) => {
				try {
					const result = mergeWorktree(
						opts.team,
						opts.agent,
						opts.strategy as "merge" | "rebase",
					);
					console.log(JSON.stringify(result, null, 2));
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					console.log(JSON.stringify({ error: msg }, null, 2));
					process.exit(1);
				}
			},
		);

	worktree
		.command("remove")
		.description("Remove a worktree and its branch")
		.requiredOption("--team <team>", "Team name")
		.requiredOption("--agent <agent>", "Agent identifier")
		.option("--base-dir <dir>", "Custom worktree base directory")
		.action(
			(opts: {
				team: string;
				agent: string;
				baseDir?: string;
			}) => {
				try {
					removeWorktree(opts.team, opts.agent, opts.baseDir);
					console.log(JSON.stringify({ removed: true }, null, 2));
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					console.log(JSON.stringify({ error: msg }, null, 2));
					process.exit(1);
				}
			},
		);

	worktree
		.command("prune")
		.description("Remove all worktrees for a team and clean up")
		.requiredOption("--team <team>", "Team name")
		.option("--base-dir <dir>", "Custom worktree base directory")
		.action((opts: { team: string; baseDir?: string }) => {
			try {
				pruneTeamWorktrees(opts.team, opts.baseDir);
				console.log(JSON.stringify({ pruned: true }, null, 2));
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.log(JSON.stringify({ error: msg }, null, 2));
				process.exit(1);
			}
		});
}
