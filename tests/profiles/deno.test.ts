import { describe, expect, test } from "bun:test";
import { DENO } from "../../extensions/lib/ci/languages/typescript";

const verbsCovered = DENO.checks.map((c) => c.verb);

describe("DENO profile", () => {
	test("detects via deno.json / deno.jsonc / deno.lock", () => {
		expect(DENO.markers).toContain("deno.json");
		expect(DENO.markers).toContain("deno.jsonc");
		expect(DENO.markers).toContain("deno.lock");
	});

	test("covers typecheck/lint/format/test", () => {
		expect(verbsCovered).toEqual(
			expect.arrayContaining(["typecheck", "lint", "format", "test"]),
		);
	});

	test("every check is routed through mise exec --", () => {
		for (const c of DENO.checks) {
			expect(c.argv.slice(0, 3)).toEqual(["mise", "exec", "--"]);
		}
	});

	test("uses deno's native check/lint/fmt/test", () => {
		const typecheck = DENO.checks.find((c) => c.verb === "typecheck");
		expect(typecheck?.argv).toContain("deno");
		expect(typecheck?.argv).toContain("check");

		const lint = DENO.checks.find((c) => c.verb === "lint");
		expect(lint?.argv).toEqual(["mise", "exec", "--", "deno", "lint"]);

		const format = DENO.checks.find((c) => c.verb === "format");
		expect(format?.argv).toEqual([
			"mise",
			"exec",
			"--",
			"deno",
			"fmt",
			"--check",
		]);

		const t = DENO.checks.find((c) => c.verb === "test");
		expect(t?.argv).toEqual(["mise", "exec", "--", "deno", "test", "--quiet"]);
	});
});
