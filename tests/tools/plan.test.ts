import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTask } from "../helpers/factories";
import {
	createTestRuntime,
	type TestRuntime,
} from "../helpers/runtime-harness";
import { driveToolCall, seedActive } from "./_helpers";

let rt: TestRuntime | undefined;

afterEach(async () => {
	await rt?.dispose();
	rt = undefined;
});

describe("until_done_plan", () => {
	test("rejects unknown dependency", async () => {
		rt = await createTestRuntime();
		seedActive(rt);
		await driveToolCall(rt, "until_done_plan", {
			tasks: [
				makeTask({ id: "T-001", dependencies: ["T-NOT-REAL"] }),
				makeTask({ id: "T-002" }),
			],
		});
		expect(rt.store.state.tasks).toHaveLength(0);
		expect(rt.store.state.planComplete).toBe(false);
	});

	test("accepts a valid plan; first dep-free task becomes current", async () => {
		rt = await createTestRuntime();
		seedActive(rt);
		await driveToolCall(rt, "until_done_plan", {
			tasks: [
				makeTask({ id: "T-001", phase: "red" }),
				makeTask({ id: "T-002", dependencies: ["T-001"] }),
			],
		});
		expect(rt.store.state.tasks).toHaveLength(2);
		expect(rt.store.state.currentTaskId).toBe("T-001");
		expect(rt.store.state.planComplete).toBe(true);
		expect(rt.store.state.phase).toBe("red");
	});

	test("writes real tasks.yaml to cwd/.until-done/", async () => {
		rt = await createTestRuntime();
		seedActive(rt);
		await driveToolCall(rt, "until_done_plan", {
			tasks: [makeTask({ id: "T-001" })],
		});
		const yamlPath = join(rt.cwd, ".until-done", "tasks.yaml");
		expect(existsSync(yamlPath)).toBe(true);
		const text = await readFile(yamlPath, "utf8");
		expect(text).toContain("T-001");
	});

	test("rejects when status is paused", async () => {
		rt = await createTestRuntime();
		seedActive(rt);
		rt.store.state.status = "paused";
		await driveToolCall(rt, "until_done_plan", {
			tasks: [makeTask()],
		});
		expect(rt.store.state.tasks).toHaveLength(0);
	});
});
