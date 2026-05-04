export const DIALOGS = {
	leaveActiveTitle: "/until-done active",
	leaveActiveMessage: (used: number, max: number) =>
		`A goal is in progress (${used}/${max} turns). Leave it behind?`,
	forkTitle: "/until-done · forking session",
	forkChoiceCarry: "Carry the goal into the fork",
	forkChoiceLeave: "Leave the goal in this session",
	forkChoiceCancel: "Cancel fork",
	cancelTitle: "/until-done · cancel?",
	cancelMessage: (g: string) => `Cancel goal: ${g}`,
	approveTitle: "/until-done · approve contract?",
	approveMessage:
		"Pi has drafted the contract. Approve to let Pi call `until_done_set` and begin pursuit.",
	askBeforeTitle: "/until-done · ask-before",
	askBeforeMessage: (kind: string, command: string | undefined) =>
		`Pi wants to run a "${kind}" command:\n\n${command ?? ""}\n\nAllow?`,
	replaceGoalTitle: "/until-done already has a goal",
	replaceGoalChoice: (status: string) => `Replace current goal (${status})`,
	keepGoalChoice: "Keep current goal",
	cancelChoice: "Cancel",
};
