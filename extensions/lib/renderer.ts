import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Component } from "@mariozechner/pi-tui";
import { Text } from "@mariozechner/pi-tui";
import { CONTINUATION_CUSTOM_TYPE } from "./constants";
import { LOOP_TICK } from "./strings";

export const registerRenderer = (pi: ExtensionAPI): void => {
	pi.registerMessageRenderer<{ goal: string; turn: number }>(
		CONTINUATION_CUSTOM_TYPE,
		(message, _opts, theme): Component | undefined => {
			const detail = message.details;
			if (!detail) return undefined;
			const head = theme.fg("muted", LOOP_TICK.rendererPrefix);
			const tail = theme.fg(
				"dim",
				LOOP_TICK.rendererTail(detail.turn, detail.goal),
			);
			return new Text(`${head} ${tail}`, 0, 0);
		},
	);
};
