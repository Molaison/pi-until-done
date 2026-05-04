import type {
	ExtensionAPI,
	InputEventResult,
} from "@mariozechner/pi-coding-agent";
import type { Store } from "../store";

export const registerInputHook = (pi: ExtensionAPI, store: Store): void => {
	pi.on("input", (_event): InputEventResult => {
		store.userMessagedThisTurn = true;
		return { action: "continue" };
	});
};
