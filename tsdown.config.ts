import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/cli/index.ts"],
	outDir: "bin",
	format: "esm",
	clean: true,
	dts: false,
	banner: { js: "#!/usr/bin/env node" },
	external: ["commander", "zod", "picocolors", "ora", "fs-extra", "gray-matter"],
});
