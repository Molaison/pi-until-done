import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import type { Store } from "../store";
import { COMMAND_DESCRIPTION } from "../strings";
import { cmdAsk } from "./ask";
import { cmdAutopilot, cmdBudget, cmdCancel, cmdPause, cmdResume } from "./control";
import {
	cmdDetail,
	cmdHelp,
	cmdNorthStar,
	cmdPlanPath,
	cmdReplanLog,
	cmdStatus,
	cmdTasks,
} from "./info";
import { cmdSetup } from "./setup";

export const subcommands = [
	"status",
	"pause",
	"resume",
	"cancel",
	"budget",
	"detail",
	"plan",
	"tasks",
	"northstar",
	"replan-log",
	"ask",
	"help",
	"autopilot",
] as const;

const dispatch = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
	head: string,
	rest: string[],
	args: string,
): Promise<void> => {
	if (!args || head === "help") return cmdHelp(ctx);
	if (head === "status") return cmdStatus(store, ctx);
	if (head === "pause") return cmdPause(pi, store, ctx);
	if (head === "resume") return cmdResume(pi, store, ctx);
	if (head === "cancel") return cmdCancel(pi, store, ctx);
	if (head === "budget") return cmdBudget(pi, store, ctx, rest.join(" "));
	if (head === "detail") return cmdDetail(store, ctx);
	if (head === "tasks") return cmdTasks(store, ctx);
	if (head === "plan") return cmdPlanPath(ctx);
	if (head === "northstar") return cmdNorthStar(store, ctx);
	if (head === "replan-log") return cmdReplanLog(store, ctx);
	if (head === "ask") return cmdAsk(pi, store, ctx, rest.join(" "));
	if (head === "autopilot") return cmdAutopilot(pi, store, ctx);
	return cmdSetup(pi, store, ctx, args);
};

const completionFor = (s: string) => ({ value: s, label: s });

const argumentCompletions = (prefix: string) => {
	const lower = prefix.toLowerCase();
	return subcommands.filter((s) => s.startsWith(lower)).map(completionFor);
};

const handlerFor = (pi: ExtensionAPI, store: Store) => async (
	raw: string,
	ctx: ExtensionCommandContext,
) => {
	const args = raw.trim();
	const [head = "", ...rest] = args.split(/\s+/);
	await dispatch(pi, store, ctx, head, rest, args);
};

export const registerCommand = (pi: ExtensionAPI, store: Store): void => {
	pi.registerCommand("until-done", {
		description: COMMAND_DESCRIPTION,
		getArgumentCompletions: argumentCompletions,
		handler: handlerFor(pi, store),
	});
};
