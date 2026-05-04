import { describe, expect, test } from "bun:test";
import { isMiseCommand, routeThroughMise } from "../extensions/lib/mise";

describe("routeThroughMise", () => {
	test("wraps a raw binary with mise exec --", () => {
		expect(routeThroughMise("bun test")).toBe("mise exec -- bun test");
	});

	test("leaves an existing mise command alone", () => {
		expect(routeThroughMise("mise run typecheck")).toBe("mise run typecheck");
	});

	test("leaves an existing mise exec command alone", () => {
		expect(routeThroughMise("mise exec -- cargo test")).toBe(
			"mise exec -- cargo test",
		);
	});

	test("returns undefined when the input is undefined", () => {
		expect(routeThroughMise(undefined)).toBeUndefined();
	});

	test("is case-insensitive on the mise prefix detection", () => {
		expect(routeThroughMise("MISE run build")).toBe("MISE run build");
	});

	test("does not double-wrap leading whitespace", () => {
		expect(routeThroughMise("  mise run lint")).toBe("  mise run lint");
	});
});

describe("isMiseCommand", () => {
	test("true for raw mise invocation", () => {
		expect(isMiseCommand("mise run x")).toBe(true);
	});

	test("false for raw binaries", () => {
		expect(isMiseCommand("bun test")).toBe(false);
	});

	test("false for undefined", () => {
		expect(isMiseCommand(undefined)).toBe(false);
	});
});
