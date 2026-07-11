import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type { Store } from "../store";

const showCurrent = (store: Store, ctx: ExtensionCommandContext): void => {
	const d = store.judgeDefault;
	if (!d) {
		ctx.ui.notify(
			"/until-done judge — no default set. `until_done_set` will require an explicit `judgeModel` (cross-model) or `sameModelJudge: true` per goal.\n\nSet a session default with:\n  /until-done judge <provider>/<modelId>     — cross-model (recommended)\n  /until-done judge same                     — same-model self-judge\n  /until-done judge clear                    — unset",
			"info",
		);
		return;
	}
	if (d.mode === "same") {
		ctx.ui.notify(
			"/until-done judge default: same-model self-judge (executor judges its own claim with fresh context). Cross-model is strictly stronger.",
			"info",
		);
		return;
	}
	ctx.ui.notify(
		`/until-done judge default: cross-model — ${d.provider}/${d.modelId}.`,
		"info",
	);
};

const setSame = (store: Store, ctx: ExtensionCommandContext): void => {
	store.judgeDefault = { mode: "same" };
	ctx.ui.notify(
		"/until-done judge default = same-model self-judge. Future setups will inject sameModelJudge:true unless overridden.",
		"warning",
	);
};

const clearDefault = (store: Store, ctx: ExtensionCommandContext): void => {
	store.judgeDefault = undefined;
	ctx.ui.notify(
		"/until-done judge default cleared. `until_done_set` will require an explicit choice per goal.",
		"info",
	);
};

const setCross = (
	store: Store,
	ctx: ExtensionCommandContext,
	provider: string,
	modelId: string,
): void => {
	const exists = ctx.modelRegistry.find(provider, modelId);
	store.judgeDefault = { mode: "cross", provider, modelId };
	const note = exists
		? `cross-model judge default = ${provider}/${modelId}.`
		: `cross-model judge default = ${provider}/${modelId} (warning: not found in current model registry; will fail-open at completion if still missing then).`;
	ctx.ui.notify(`/until-done judge ${note}`, exists ? "info" : "warning");
};

export const cmdJudge = async (
	_pi: unknown,
	store: Store,
	ctx: ExtensionCommandContext,
	rest: string[],
): Promise<void> => {
	if (rest.length === 0) return showCurrent(store, ctx);
	const arg = rest.join(" ").trim();
	if (arg === "same") return setSame(store, ctx);
	if (arg === "clear" || arg === "off" || arg === "none")
		return clearDefault(store, ctx);
	const slash = arg.indexOf("/");
	if (slash <= 0 || slash === arg.length - 1) {
		ctx.ui.notify(
			`/until-done judge — bad model spec "${arg}". Expected "<provider>/<modelId>", "same", or "clear".`,
			"error",
		);
		return;
	}
	setCross(store, ctx, arg.slice(0, slash), arg.slice(slash + 1));
};
