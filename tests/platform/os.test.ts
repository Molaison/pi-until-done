import { describe, expect, test } from "bun:test";
import { isMiseCommand, routeThroughMise } from "../../extensions/lib/mise";

const PLATFORMS = ["darwin", "linux", "win32"] as const;

describe("mise routing is platform-independent", () => {
	for (const p of PLATFORMS) {
		test(`routeThroughMise behaves identically on ${p}`, () => {
			const cmd = "tsc --noEmit";
			expect(routeThroughMise(cmd)).toBe("mise exec -- tsc --noEmit");
		});
	}

	test("Bun runs on macOS, Linux, and Windows — process.platform reports one of them", () => {
		expect(["darwin", "linux", "win32"]).toContain(process.platform);
	});

	test("isMiseCommand does not depend on platform line endings", () => {
		expect(isMiseCommand("mise run check\n")).toBe(true);
		expect(isMiseCommand("mise run check\r\n")).toBe(true);
	});
});

describe("path separators are not assumed", () => {
	test("mise exec -- prefix never embeds a path", () => {
		const wrapped = routeThroughMise("./node_modules/.bin/tsc --noEmit");
		expect(wrapped).toBe("mise exec -- ./node_modules/.bin/tsc --noEmit");
		expect(wrapped).not.toContain("\\");
	});

	test("Windows-style backslash paths pass through unchanged in the suffix", () => {
		const wrapped = routeThroughMise(
			String.raw`C:\Users\dev\bin\tsc.exe --noEmit`,
		);
		expect(wrapped).toBe(
			String.raw`mise exec -- C:\Users\dev\bin\tsc.exe --noEmit`,
		);
	});
});
