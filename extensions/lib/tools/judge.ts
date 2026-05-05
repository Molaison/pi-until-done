import { complete, type Model } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { GoalState, JudgeModel } from "../types";

export type JudgeVerdict = "done" | "continue" | "parse_error" | "unavailable";

export interface JudgeDecision {
	verdict: JudgeVerdict;
	reason: string;
}

const buildSystemPrompt = (): string =>
	[
		"You are a strict completion judge for /until-done.",
		"The executor will claim a goal is done with cited evidence.",
		"Your job: decide whether the done-criteria are LITERALLY satisfied.",
		"Treat uncertainty as not-yet-done. Reject proxy signals (e.g. 'looks fine', 'should work').",
		"",
		'Respond ONLY with a single JSON object: {"verdict": "done" | "continue", "reason": "<one sentence>"}.',
		'"done" means the criteria are literally satisfied per the cited evidence.',
		'"continue" means the executor needs more work or stronger evidence.',
		"No prose outside the JSON.",
	].join("\n");

const buildUserPrompt = (
	state: GoalState,
	evidence: string,
	summary: string | undefined,
): string =>
	[
		`Goal: ${state.goal}`,
		`Done criteria: ${state.doneCriteria}`,
		`Verify command: ${state.verifyCommand ?? "(none)"}`,
		"",
		"Evidence claimed by executor:",
		evidence,
		summary ? `\nSummary: ${summary}` : "",
		"",
		"Is the goal achieved?",
	]
		.filter(Boolean)
		.join("\n");

const extractJson = (text: string): unknown => {
	const trimmed = text.trim();
	const direct = tryParse(trimmed);
	if (direct !== undefined) return direct;
	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) return undefined;
	return tryParse(trimmed.slice(start, end + 1));
};

const tryParse = (text: string): unknown => {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
};

const interpretJudge = (raw: string): JudgeDecision => {
	const parsed = extractJson(raw) as
		| { verdict?: unknown; reason?: unknown }
		| undefined;
	if (!parsed || typeof parsed !== "object") {
		return {
			verdict: "parse_error",
			reason: "judge response could not be parsed as JSON",
		};
	}
	const verdict = parsed.verdict;
	const reason = typeof parsed.reason === "string" ? parsed.reason : "";
	if (verdict !== "done" && verdict !== "continue") {
		return {
			verdict: "parse_error",
			reason:
				"judge response could not be parsed: missing or invalid 'verdict' field",
		};
	}
	return { verdict, reason };
};

const extractText = (content: unknown): string => {
	if (!Array.isArray(content)) return "";
	const parts: string[] = [];
	for (const block of content) {
		if (
			block &&
			typeof block === "object" &&
			(block as { type?: unknown }).type === "text" &&
			typeof (block as { text?: unknown }).text === "string"
		) {
			parts.push((block as { text: string }).text);
		}
	}
	return parts.join("\n");
};

const runJudge = async (
	ctx: ExtensionContext,
	model: Model<never>,
	state: GoalState,
	evidence: string,
	summary: string | undefined,
): Promise<JudgeDecision> => {
	const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
	if (!auth.ok) {
		return {
			verdict: "unavailable",
			reason: `judge auth failed: ${auth.error}`,
		};
	}
	try {
		const result = await complete(
			model,
			{
				systemPrompt: buildSystemPrompt(),
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: buildUserPrompt(state, evidence, summary) },
						],
						timestamp: Date.now(),
					},
				],
			},
			{ apiKey: auth.apiKey, headers: auth.headers, signal: ctx.signal },
		);
		return interpretJudge(extractText(result.content));
	} catch (e) {
		return {
			verdict: "unavailable",
			reason: `judge call threw: ${e instanceof Error ? e.message : String(e)}`,
		};
	}
};

export const consultJudge = async (
	ctx: ExtensionContext,
	judge: JudgeModel,
	state: GoalState,
	evidence: string,
	summary: string | undefined,
): Promise<JudgeDecision> => {
	const model = ctx.modelRegistry.find(judge.provider, judge.modelId);
	if (!model) {
		return {
			verdict: "unavailable",
			reason: `judge model ${judge.provider}/${judge.modelId} not found in registry`,
		};
	}
	return runJudge(ctx, model as Model<never>, state, evidence, summary);
};

export const consultSelfJudge = async (
	ctx: ExtensionContext,
	state: GoalState,
	evidence: string,
	summary: string | undefined,
): Promise<JudgeDecision> => {
	if (!ctx.model) {
		return {
			verdict: "unavailable",
			reason: "no active executor model — judge step skipped",
		};
	}
	return runJudge(ctx, ctx.model as Model<never>, state, evidence, summary);
};
