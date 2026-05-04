import { Type } from "typebox";
import { DEFAULT_MAX_TURNS, HARD_BUDGET_CEILING } from "../constants";
import { PhaseLiteral } from "./literals";

export const GoalTypeLiteral = Type.Union(
	[Type.Literal("ticket"), Type.Literal("exploratory")],
	{
		description:
			'"ticket" if the solution shape is known up-front (full TDD applies). "exploratory" if only the destination is known and the path is discovered by running.',
	},
);

export const SurfaceSchema = Type.Object({
	kind: Type.String({
		description:
			"Surface category — e.g. 'logs', 'metrics', 'staging-url', 'flame-graph', 'cost-report', 'sandbox', 'staging-db'.",
	}),
	location: Type.String({
		description: "Where to find it — file path, URL, command, or instructions.",
	}),
	notes: Type.Optional(
		Type.String({
			description: "Caveats Pi should know — auth, rate limits, freshness.",
		}),
	),
});

export const CoreSetFields = {
	goal: Type.String({
		description: "One-line restatement of the user's intent.",
	}),
	doneCriteria: Type.String({
		description:
			"Concrete, externally verifiable conditions that must all be true for the goal to count as done. For production-code goals: must include 'all tests in <verifyCommand> pass'.",
	}),
	verifyCommand: Type.Optional(
		Type.String({
			description:
				"Single shell command that proves done-criteria are met (e.g. 'bun test', 'mise run check'). Required for production-code goals; omit for research/doc goals.",
		}),
	),
	askBefore: Type.Array(Type.String(), {
		description:
			"Operations that require explicit user approval before /until-done proceeds. Examples: 'git push', 'destructive sql', 'send email'.",
	}),
	decisionStyle: Type.String({
		description:
			"How trade-offs should be made while pursuing the goal autonomously. One short sentence.",
	}),
};

export const ShapeSetFields = {
	goalType: GoalTypeLiteral,
	surfaces: Type.Array(SurfaceSchema, {
		description:
			"Data/access Pi has been granted — logs, metrics, staging URLs, flame graphs, cost tables. A goal is only as effective as the surfaces it can act on. Empty array is allowed; do not invent surfaces that do not exist.",
	}),
};

export const RuntimeSetFields = {
	startPhase: Type.Optional(PhaseLiteral),
	maxTurns: Type.Optional(
		Type.Integer({
			description: `Override the turn budget. Default ${DEFAULT_MAX_TURNS}. Hard ceiling ${HARD_BUDGET_CEILING}.`,
			minimum: 1,
			maximum: HARD_BUDGET_CEILING,
		}),
	),
};
