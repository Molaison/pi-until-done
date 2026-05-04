export const REFUSAL = {
	planWrongStatus: (status: string) =>
		`plan can only be set during 'active' or 'planning' (status=${status}).`,
	planUnknownDep: (taskId: string, dep: string) =>
		`task ${taskId} depends on unknown task ${dep}.`,
	replanWrongStatus: (status: string) =>
		`replan only allowed in 'active' (status=${status}).`,
	replanNoNorthStar: "northStar not set; call until_done_set first.",
	replanEmptyReason: "reason is required.",
	replanCycle: (taskId: string) =>
		`replan introduces dependency cycle through ${taskId}`,
	taskNotFound: (id: string) => `No task with id ${id}.`,
	goalExists: (status: string) =>
		`a goal is already ${status}. Cancel it with /until-done cancel first.`,
	notConfirmed:
		"setup contract has not been confirmed by the user. Run /until-done <intent> and confirm via the dialog first.",
	noActiveGoal: (status: string) => `Refused: no active goal (status=${status}).`,
	noActiveBlock: (status: string) => `No active goal to block (status=${status}).`,
	userDenied: (kind: string) => `user denied "${kind}"`,
};
