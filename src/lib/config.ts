import { join } from "node:path";
import fse from "fs-extra";
import { z } from "zod";

// ─── Config filename ────────────────────────────────────────────────────────

/** Megazord config filename, stored in the .planning/ directory */
export const CONFIG_FILENAME = "megazord.config.json";

// ─── Sub-schemas ────────────────────────────────────────────────────────────

/** Quality discipline settings */
export const qualitySchema = z.object({
	tdd: z.boolean().default(true),
	review: z.enum(["auto", "manual", "off"]).default("auto"),
	brainstorming: z.boolean().default(true),
	cortex: z.boolean().default(true),
	debug: z.enum(["systematic", "quick"]).default("systematic"),
});

/** Workflow agent settings */
export const workflowSchema = z.object({
	research: z.boolean().default(true),
	plan_check: z.boolean().default(true),
	verifier: z.boolean().default(true),
});

/** Agent Teams coordination settings */
export const agentTeamsSchema = z.object({
	enabled: z.enum(["auto", "always", "never"]).default("auto"),
	worktree_dir: z.string().optional(),
	strict_ownership: z.boolean().default(false),
});

/** Model values for agent overrides */
const modelEnum = z.enum(["opus", "sonnet", "haiku", "inherit"]);

/** Per-agent model overrides — optional, override wins over profile */
export const modelOverridesSchema = z
	.object({
		researcher: modelEnum.optional(),
		planner: modelEnum.optional(),
		executor: modelEnum.optional(),
		reviewer: modelEnum.optional(),
		verifier: modelEnum.optional(),
		mapper: modelEnum.optional(),
	})
	.optional();

// ─── Full config schema ─────────────────────────────────────────────────────

/** Megazord project configuration schema — single source of truth */
export const configSchema = z.object({
	/** Schema version for future migrations */
	version: z.literal(1).default(1),

	/** Project identity */
	project_name: z.string(),

	/** Absolute path to the Megazord plugin directory (auto-detected by /mz:init) */
	plugin_path: z.string().optional(),

	/** Execution mode: yolo (autonomous) or interactive (confirm at each step) */
	mode: z.enum(["yolo", "interactive"]).default("yolo"),

	/** Planning depth */
	depth: z.enum(["quick", "standard", "comprehensive"]).default("comprehensive"),

	/** Whether to run plans in parallel when possible */
	parallelization: z.boolean().default(true),

	/** Whether to commit planning docs alongside code */
	commit_docs: z.boolean().default(true),

	/** AI model selection for planning agents */
	model_profile: z.enum(["quality", "balanced", "budget"]).default("quality"),

	/** Per-agent model overrides (optional, override wins over profile) */
	model_overrides: modelOverridesSchema.default({}),

	/** Quality discipline settings */
	quality: qualitySchema.default({
		tdd: true,
		review: "auto",
		brainstorming: true,
		cortex: true,
		debug: "systematic",
	}),

	/** Workflow agent toggles */
	workflow: workflowSchema.default({
		research: true,
		plan_check: true,
		verifier: true,
	}),

	/** Agent Teams coordination settings */
	agent_teams: agentTeamsSchema.default({
		enabled: "auto",
		strict_ownership: false,
	}),
});

// ─── Type export ────────────────────────────────────────────────────────────

/** Inferred TypeScript type from the config schema */
export type MegazordConfig = z.infer<typeof configSchema>;

// ─── Preset profiles ────────────────────────────────────────────────────────

/** Preset configuration profiles: strict, balanced, minimal */
export const presets: Record<string, Partial<MegazordConfig>> = {
	strict: {
		model_profile: "quality",
		model_overrides: {},
		quality: {
			tdd: true,
			review: "auto",
			brainstorming: true,
			cortex: true,
			debug: "systematic",
		},
		workflow: {
			research: true,
			plan_check: true,
			verifier: true,
		},
		agent_teams: {
			enabled: "auto",
			strict_ownership: true,
		},
	},
	balanced: {
		model_profile: "balanced",
		model_overrides: {},
		quality: {
			tdd: false,
			review: "auto",
			brainstorming: true,
			cortex: false,
			debug: "quick",
		},
		workflow: {
			research: true,
			plan_check: true,
			verifier: true,
		},
		agent_teams: {
			enabled: "auto",
			strict_ownership: false,
		},
	},
	minimal: {
		model_profile: "budget",
		model_overrides: {},
		quality: {
			tdd: false,
			review: "off",
			brainstorming: false,
			cortex: false,
			debug: "quick",
		},
		workflow: {
			research: false,
			plan_check: false,
			verifier: false,
		},
		agent_teams: {
			enabled: "never",
			strict_ownership: false,
		},
	},
};

// ─── Model resolution ──────────────────────────────────────────────────────

/** Agent roles that support model selection */
export type AgentRole = "researcher" | "planner" | "executor" | "reviewer" | "verifier" | "mapper";

/** Uniform profile-to-model mapping (all agents same model) */
const UNIFORM_MODEL_MAP: Record<string, string> = {
	quality: "opus",
	balanced: "sonnet",
	budget: "haiku",
};

/**
 * Differentiated "balanced" profile: planner gets opus for higher-quality
 * reasoning, all others get sonnet. Quality and budget profiles remain uniform.
 */
const BALANCED_PLANNER_MODEL = "opus";
const BUDGET_PLANNER_MODEL = "sonnet";

/**
 * Resolve the model for a specific agent role based on profile and overrides.
 *
 * Precedence: model_overrides[role] > profile mapping.
 * Override "inherit" means "use profile mapping" (same as no override).
 */
export function resolveAgentModel(config: MegazordConfig, agentRole: AgentRole): string {
	// 1. Check per-agent override (override wins, period)
	const override = config.model_overrides?.[agentRole];
	if (override && override !== "inherit") {
		return override;
	}

	// 2. Differentiated profiles for specific roles
	const profile = config.model_profile;
	if (profile === "balanced" && agentRole === "planner") {
		return BALANCED_PLANNER_MODEL;
	}
	if (profile === "budget" && agentRole === "planner") {
		return BUDGET_PLANNER_MODEL;
	}

	// 3. Uniform mapping
	return UNIFORM_MODEL_MAP[profile] ?? "opus";
}

// ─── Load / Save utilities ──────────────────────────────────────────────────

/** Load and validate config from .planning/ directory */
export function loadConfig(planningDir: string): MegazordConfig {
	const configPath = join(planningDir, CONFIG_FILENAME);
	if (!fse.pathExistsSync(configPath)) {
		throw new Error(`Config not found: ${configPath}. Run /mz:init first.`);
	}
	const raw = fse.readJsonSync(configPath);
	const result = configSchema.safeParse(raw);
	if (!result.success) {
		throw new Error(`Invalid config at ${configPath}: ${result.error.message}`);
	}
	return result.data;
}

/** Save config to .planning/ directory with pretty formatting */
export function saveConfig(planningDir: string, config: MegazordConfig): void {
	const configPath = join(planningDir, CONFIG_FILENAME);
	fse.writeJsonSync(configPath, config, { spaces: 2 });
}

/** Apply a preset profile with optional overrides */
export function applyPreset(
	presetName: keyof typeof presets,
	overrides?: Partial<MegazordConfig>,
): Partial<MegazordConfig> {
	const preset = presets[presetName];
	if (!preset) {
		throw new Error(
			`Unknown preset: ${String(presetName)}. Available: ${Object.keys(presets).join(", ")}`,
		);
	}
	return { ...preset, ...overrides };
}

// ─── GSD migration utilities ────────────────────────────────────────────────

/** GSD config.json shape (pre-Megazord format) */
export interface GsdConfig {
	mode?: string;
	depth?: string;
	parallelization?: boolean;
	commit_docs?: boolean;
	model_profile?: string;
	workflow?: {
		research?: boolean;
		plan_check?: boolean;
		verifier?: boolean;
		auto_advance?: boolean;
	};
	git?: {
		branching_strategy?: string;
	};
}

/** Detect if .planning/ contains a GSD-format config (no version field) */
export function detectGsdConfig(planningDir: string): GsdConfig | null {
	const configPath = join(planningDir, "config.json");
	if (!fse.pathExistsSync(configPath)) return null;

	const raw = fse.readJsonSync(configPath);
	// Megazord configs always have version: 1; GSD configs do not
	if (raw.version !== undefined) return null;

	return raw as GsdConfig;
}

/** Migrate a GSD config to Megazord format */
export function migrateGsdConfig(gsd: GsdConfig, projectName: string): MegazordConfig {
	const partial: Record<string, unknown> = {
		project_name: projectName,
		mode: gsd.mode ?? "yolo",
		depth: gsd.depth ?? "comprehensive",
		parallelization: gsd.parallelization ?? true,
		commit_docs: gsd.commit_docs ?? true,
		model_profile: gsd.model_profile ?? "quality",
		workflow: {
			research: gsd.workflow?.research ?? true,
			plan_check: gsd.workflow?.plan_check ?? true,
			verifier: gsd.workflow?.verifier ?? true,
			// auto_advance is GSD-specific — ignored silently
		},
		// Quality defaults to strict preset for GSD migrations
		quality: presets.strict.quality,
	};

	return configSchema.parse(partial);
}
