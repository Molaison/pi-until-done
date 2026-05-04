import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { HARD_BUDGET_CEILING } from "../constants";
import { initialState } from "../initial-state";
import { persist, type Store } from "../store";
import { DIALOGS, NOTIFY } from "../strings";
import { refreshStatus } from "../ui/status-line";
import { refreshWidget } from "../ui/widget";

export const cmdPause = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
): Promise<void> => {
	const s = store.state.status;
	if (s !== "active" && s !== "blocked") {
		ctx.ui.notify(NOTIFY.nothingToPause(s), "warning");
		return;
	}
	persist(pi, store, "pause", {
		status: "paused",
		pausedReason: "user-paused",
	});
	ctx.ui.notify(NOTIFY.paused, "info");
	refreshStatus(store, ctx);
	refreshWidget(store, ctx, true);
};

export const cmdResume = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
): Promise<void> => {
	const s = store.state;
	if (s.status === "cleared" || s.status === "done" || !s.goal) {
		ctx.ui.notify(NOTIFY.nothingToResume, "warning");
		return;
	}
	persist(pi, store, "resume", {
		status: "active",
		turnsUsed: 0,
		pausedReason: undefined,
	});
	ctx.ui.notify(NOTIFY.resumed(s.goal), "info");
	pi.sendUserMessage(`Resume work on the standing /until-done goal: ${s.goal}`);
	refreshStatus(store, ctx);
	refreshWidget(store, ctx);
};

export const cmdCancel = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
): Promise<void> => {
	if (!store.state.goal) {
		ctx.ui.notify(NOTIFY.noGoalToCancel, "info");
		return;
	}
	const ok = ctx.hasUI
		? await ctx.ui.confirm(
				DIALOGS.cancelTitle,
				DIALOGS.cancelMessage(store.state.goal),
			)
		: true;
	if (!ok) return;
	persist(pi, store, "cancel", initialState(), "user cancelled");
	ctx.ui.notify(NOTIFY.cancelled, "info");
	refreshStatus(store, ctx);
	refreshWidget(store, ctx, true);
};

export const cmdBudget = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
	raw: string,
): Promise<void> => {
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 1 || n > HARD_BUDGET_CEILING) {
		ctx.ui.notify(NOTIFY.budgetRange(HARD_BUDGET_CEILING), "error");
		return;
	}
	persist(pi, store, "budget", { maxTurns: n }, `budget set to ${n}`);
	ctx.ui.notify(NOTIFY.budgetSet(n), "info");
	refreshStatus(store, ctx);
	refreshWidget(store, ctx, true);
};

export const cmdAutopilot = async (
	pi: ExtensionAPI,
	store: Store,
	ctx: ExtensionCommandContext,
): Promise<void> => {
	if (store.state.status !== "setup") {
		ctx.ui.notify(NOTIFY.autopilotOnlySetup, "warning");
		return;
	}
	store.state.confirmedByUser = true;
	persist(pi, store, "confirm", { confirmedByUser: true }, "autopilot");
	ctx.ui.notify(NOTIFY.autopilotEnabled, "warning");
};
