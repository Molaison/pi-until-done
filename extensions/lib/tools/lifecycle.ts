import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Static } from "typebox";
import { HARD_BUDGET_CEILING } from "../constants";
import { routeThroughMise } from "../mise";
import { BlockParams, CompleteParams, ProgressParams, SetParams } from "../schemas/lifecycle";
import { persist, type Store } from "../store";
import {
	REFUSAL,
	TOOL_DESCRIPTIONS,
	TOOL_LABELS,
	TOOL_PROMPT_SNIPPET,
	TOOL_RESULTS,
} from "../strings";
import type { GoalState, NorthStar } from "../types";
import { failed, ok, refused } from "./result";

type SetInput = Static<typeof SetParams>;
type CompleteInput = Static<typeof CompleteParams>;
type BlockInput = Static<typeof BlockParams>;
type ProgressInput = Static<typeof ProgressParams>;

const buildNorthStar = (params: SetInput, verify: string | undefined): NorthStar => ({
	goal: params.goal,
	doneCriteria: params.doneCriteria,
	verifyCommand: verify,
	askBefore: params.askBefore ?? [],
	decisionStyle: params.decisionStyle,
	goalType: params.goalType,
	surfaces: params.surfaces ?? [],
});

const setPatch = (params: SetInput, currentMaxTurns: number): Partial<GoalState> => {
	const verify = routeThroughMise(params.verifyCommand);
	return {
		goal: params.goal,
		doneCriteria: params.doneCriteria,
		askBefore: params.askBefore ?? [],
		decisionStyle: params.decisionStyle,
		verifyCommand: verify,
		northStar: buildNorthStar(params, verify),
		goalType: params.goalType,
		surfaces: params.surfaces ?? [],
		phase: params.startPhase ?? "analysis",
		maxTurns: Math.min(params.maxTurns ?? currentMaxTurns, HARD_BUDGET_CEILING),
		status: "active",
		createdAt: Date.now(),
		turnsUsed: 0,
	};
};

const executeSet = async (pi: ExtensionAPI, store: Store, params: SetInput) => {
	const s = store.state;
	if (s.status === "active" || s.status === "paused") {
		return refused(REFUSAL.goalExists(s.status), "goal_exists");
	}
	if (!s.confirmedByUser) return refused(REFUSAL.notConfirmed, "not_confirmed");
	persist(pi, store, "set", setPatch(params, s.maxTurns), "contract activated; north star locked");
	return ok(TOOL_RESULTS.setActivated, { status: store.state.status });
};

const executeComplete = async (pi: ExtensionAPI, store: Store, params: CompleteInput) => {
	const s = store.state;
	if (s.status !== "active") return failed(REFUSAL.noActiveGoal(s.status), "no_active_goal");
	persist(pi, store, "complete", {
		status: "done",
		lastVerdict: "done",
		lastReason: params.summary ?? params.evidence.slice(0, 200),
		evidence: [...s.evidence, params.evidence],
	}, params.summary);
	return ok(TOOL_RESULTS.completeMarked(params.summary ?? params.evidence), {
		status: "done",
	});
};

const executeBlock = async (pi: ExtensionAPI, store: Store, params: BlockInput) => {
	const s = store.state;
	if (s.status !== "active") return failed(REFUSAL.noActiveBlock(s.status), "no_active_goal");
	persist(pi, store, "block", {
		status: "blocked",
		pausedReason: params.reason,
		lastVerdict: "blocked",
		lastReason: params.question,
	}, params.question);
	return ok(TOOL_RESULTS.blocked(params.question), { status: "blocked" });
};

const executeProgress = async (pi: ExtensionAPI, store: Store, params: ProgressInput) => {
	const patch: Partial<GoalState> = {
		evidence: [...store.state.evidence, params.note],
	};
	if (params.phase) patch.phase = params.phase;
	persist(pi, store, "progress", patch, params.note);
	const text = params.phase
		? TOOL_RESULTS.progressInPhase(params.phase, params.note)
		: TOOL_RESULTS.progressNoted(params.note);
	return ok(text, { phase: params.phase ?? store.state.phase });
};

const registerSet = (pi: ExtensionAPI, store: Store) => {
	pi.registerTool({
		name: "until_done_set",
		label: TOOL_LABELS.set,
		description: TOOL_DESCRIPTIONS.set,
		parameters: SetParams,
		promptSnippet: TOOL_PROMPT_SNIPPET,
		async execute(_id, params) {
			return executeSet(pi, store, params);
		},
	});
};

const registerComplete = (pi: ExtensionAPI, store: Store) => {
	pi.registerTool({
		name: "until_done_complete",
		label: TOOL_LABELS.complete,
		description: TOOL_DESCRIPTIONS.complete,
		parameters: CompleteParams,
		async execute(_id, params) {
			return executeComplete(pi, store, params);
		},
	});
};

const registerBlock = (pi: ExtensionAPI, store: Store) => {
	pi.registerTool({
		name: "until_done_block",
		label: TOOL_LABELS.block,
		description: TOOL_DESCRIPTIONS.block,
		parameters: BlockParams,
		async execute(_id, params) {
			return executeBlock(pi, store, params);
		},
	});
};

const registerProgress = (pi: ExtensionAPI, store: Store) => {
	pi.registerTool({
		name: "until_done_progress",
		label: TOOL_LABELS.progress,
		description: TOOL_DESCRIPTIONS.progress,
		parameters: ProgressParams,
		async execute(_id, params) {
			return executeProgress(pi, store, params);
		},
	});
};

export const registerLifecycleTools = (pi: ExtensionAPI, store: Store): void => {
	registerSet(pi, store);
	registerComplete(pi, store);
	registerBlock(pi, store);
	registerProgress(pi, store);
};
