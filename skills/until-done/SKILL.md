---
name: until-done
description: How to drive Pi's `/until-done` autonomous goal loop — owning the contract, calling the four `until_done_*` tools, applying pi-config TDD discipline (ANALYSIS → BOOTSTRAP → RED → GREEN → REFACTOR), and respecting ask-before boundaries. Pi loads this skill on demand whenever a `/until-done` goal is active.
---

# /until-done — Pi-led autonomous goal pursuit

You are the agent in a Pi session where `/until-done` may be active. The
extension hands you a standing goal and lets you keep working across
turns until you (the model) declare the goal done or blocked. **You
call the shots — not the user, not a separate judge.**

## When this skill applies

- The user typed `/until-done <intent>` and the contract has not yet
  been approved → you are in **setup**.
- A `/until-done` goal is already active and you just received an
  auto-continuation message starting with
  `[Continuing toward your standing goal]` → you are in **work mode**.
- The user typed `/until-done resume` → **work mode** with a fresh
  budget.

## TDD-first execution model (from pi-config)

Every production-affecting goal MUST pass through these phases.
Declare your phase by passing `phase` to `until_done_progress`. The
extension shows the phase in the status line so the user can verify
discipline at a glance.

| Phase | Meaning |
| --- | --- |
| **ANALYSIS** | Understand the problem, scope, constraints. Read code. No production edits. |
| **BOOTSTRAP** | Ensure validation infra exists and works. Verify the `verifyCommand` runs. Skip if already in place. |
| **RED** | Write a failing production test that exercises real user behavior, a contract, or a system boundary. Run it. **Confirm it fails.** |
| **GREEN** | Smallest production change to pass the failing test. No preemptive generalization. No extra abstractions. |
| **REFACTOR** | Improve structure / readability / performance without changing externally observable behavior. Run the verify command after. |
| `none` | Goal is research-only or doc-only — no production code shipping. |

Constraints from pi-config:

- nesting depth ≤ 3
- construct ≤ 30 LOC
- file ≤ 200 LOC
- single responsibility per construct

If the goal is a bug fix or a feature addition, the path is always
`analysis → red → green → refactor`. If the goal is research, it can
stay in `analysis` and end with a written summary.

## North Star — what's locked vs. mutable

`until_done_set` locks four things into a **North Star** that **cannot
change** for the lifetime of the goal:

1. `goal` — the destination
2. `doneCriteria` — what counts as arriving
3. `verifyCommand` — the one shell command that proves arrival
4. `askBefore` — boundaries the user controls

If any of those four were drafted wrong, the user must
`/until-done cancel` and start a new setup. **Do not work around
the North Star.** Don't pretend a different verifyCommand is fine.
Don't widen done-criteria to be easier to hit. Don't drop ask-before
items "because the user obviously meant…". The user can read
`/until-done northstar` at any time to verify the contract is intact.

Everything else — the **task list**, current task, learnings,
gotchas, ci commands per task, guardrails, even `phase` and
`maxTurns` — is **mutable**. Use `until_done_replan` to restructure
when reality diverges. Each replan must include a `reason` and gets
logged to `/until-done replan-log`.

## Setup mode

You execute setup as **two locked deliverables presented together for
one approval**: the contract (North Star) and the YAML task list.

1. Read the user's intent.
2. Draft the contract (North Star — locked once you call `until_done_set`):
   - **Goal**: one-line restatement.
   - **Done when**: concrete, verifiable conditions. For
     production-code goals: must include _"all tests in <verifyCommand>
     pass"_.
   - **verifyCommand**: the single command that proves done (e.g.
     `bun test`, `mise run check`, `pytest -q`). Omit for
     research/doc.
   - **Ask before**: operations needing user approval. Be specific
     (`git push`, `rm -rf`, `npm publish`, sending mail). Empty list
     `[]` if none.
   - **Decision style**: one short sentence on how to make trade-offs
     ("favor smaller diffs", "prefer adding tests over fixing types",
     etc.).
   - **startPhase**: `analysis` for most goals; `red` if the user's
     intent already names the failing case; `none` for non-code goals.
3. Decompose the goal into a complete YAML task list. For each task fill in **every** field:

   ```yaml
   - id: T-001
     title: <imperative one-liner>
     phase: bootstrap | red | green | refactor | analysis | none
     status: pending
     dependencies: []          # earlier T-NNN ids
     blocks: []                 # later T-NNN ids
     prerequisites:             # things that must be true before start
       - description: ...
         cleared: false
     validationSteps:           # ordered, externally verifiable
       - ...
     ciCommands:                # lint/typecheck/test/build/deploy
       - ...
     styleguideRules:           # cite source if external
       - ...
     guardrails:                # boundaries that keep the task on track
       - ...
     learnings: []              # filled in over time
     gotchas:                   # pitfalls to avoid on restart/rewind
       - ...
     context:                   # files & URLs you'll need
       - path: src/foo.ts
         why: ...
       - url: https://...
         why: ...
   ```

   Rules: bootstrap tasks first; every code-changing task is preceded
   by a RED task; final task is verification (run `verifyCommand`,
   confirm done-criteria).

4. Show the contract **and** the YAML task list back to the user as
   plain markdown.
5. Ask explicitly: _"Approve contract + task plan? (yes/no)"_
6. Wait. **Do not call any `until_done_*` tool until the user
   confirms.**
7. After confirmation:
   a. `until_done_set` with the contract fields.
   b. `until_done_plan` with the full `tasks` array.

If the user says no, stop. Do not retry.

## Work mode

Each turn, do **one** of:

1. **Advance the current task.** Call `until_done_task_update` with
   `status='in_progress'` if you haven't already. Use built-in tools
   (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`). Real
   changes only.
2. **Mark task done.** Call `until_done_task_update` with
   `status='done'` and any `addLearning`/`addGotcha`/`addContext`. The
   extension auto-advances to the next ready task.
3. **Replan when reality diverges.** Call `until_done_replan` with
   `operations: [...]` and a non-empty `reason`. Common reasons:

   - **Discovered new sub-task** → `op: "insert"` after the current task
   - **Two tasks turn out to be one** → `op: "merge"`
   - **One task turns out to be three** → `op: "split"`
   - **A planned task is moot** → `op: "remove"` (must be `pending` or `blocked`)
   - **Wrong dependency order** → `op: "reorder"`
   - **Rewrite a pending task** → `op: "replace"`

   `done` tasks are immutable. Don't try to retroactively rewrite
   history. The North Star is also immutable — if the goal itself was
   wrong, tell the user, don't replan around it.

4. **Transition phase** via `until_done_progress` with `phase` set.
5. **Declare done** via `until_done_complete`. Only after the
   verifyCommand passes and you can quote its output.
6. **Block** via `until_done_block` when you need user input.

Before any operation that matches a string in the contract's "ask
before" list, _stop and ask the user_ in plain text. Do not bypass the
user's gate even if "it would obviously be fine".

### When the extension auto-prompts you

If you've marked all planned tasks done but haven't called
`until_done_complete`, the extension sends a follow-up reminder:
"either run verifyCommand and call complete, or replan with reason
'residual_work_discovered'". This is the **clean-end guarantee** —
you cannot drift indefinitely. After two such nudges in a session,
the loop pauses and waits for the user.

## Hard rules

- **Never** call `until_done_complete` speculatively. Run
  `verifyCommand` and paste the output as evidence.
- **Never** call `until_done_set` during work mode (the contract is
  locked once activated).
- **Never** ignore the "ask before" list. If you're unsure whether a
  command matches, ask the user.
- **Never** disable or talk around the turn budget. If you hit it, the
  loop pauses and the user gets a chance to extend with
  `/until-done budget <n>`.
- **Never** assume the loop is the only thing running. The user can
  interject any time. A normal user message arriving mid-loop is the
  new authority for that turn.
- **Never** claim work that wasn't done. From pi-config: "avoid
  pretending hidden context, tests, or guarantees exist when they have
  not been verified."
- **Never** skip RED. If you find yourself writing production code
  without a failing test, stop and add the test first.

## Diagnostics the user can run

| Command | What it does |
| --- | --- |
| `/until-done status` | One-line current state |
| `/until-done detail` | Full contract overlay |
| `/until-done northstar` | Print the locked contract |
| `/until-done tasks` | Print the live task list |
| `/until-done plan` | Show the path to `.until-done/tasks.yaml` |
| `/until-done replan-log` | Audit log of all replans + reasons |
| `/until-done pause` | Halt continuation, keep state |
| `/until-done resume` | Resume + reset budget |
| `/until-done cancel` | Clear the goal (only way to change North Star) |
| `/until-done budget <n>` | Change turn budget (1..200) |

You don't have to surface those — the extension handles them. Stay
focused on the contract.
