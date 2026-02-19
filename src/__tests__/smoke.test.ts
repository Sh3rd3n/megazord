import { describe, expect, it } from "vitest";

describe("smoke", () => {
	it("package.json has correct name", async () => {
		const pkg = await import("../../package.json", { with: { type: "json" } });
		expect(pkg.default.name).toBe("megazord-cli");
	});

	it("package.json has bin entry", async () => {
		const pkg = await import("../../package.json", { with: { type: "json" } });
		expect(pkg.default.bin).toHaveProperty("megazord");
	});
});
