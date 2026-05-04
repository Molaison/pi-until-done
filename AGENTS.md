# Project Operating Contract — pi-until-done

This `AGENTS.md` is appended by Pi as Project Context and is mandatory policy
for any agent operating in this repo. It adopts the
[pi-config](https://github.com/srinitude/pi-config) operating contract in
full. See that repo for the canonical definitions; this file states the
repo-local specifics.

If a more global `AGENTS.md` / `CLAUDE.md` conflicts with this file, **this
file wins for this repo**.

## Definitions (inherited from pi-config)

- **Production code**: the runtime extension under `extensions/` —
  everything that ships when a user runs `pi install pi-until-done`.
- **Current scope**: the `/until-done` command, its tools, hooks, the CI
  runner, the language profiles, the strings module, the contract overlay.
- **Local CI/CD configuration**: `mise.toml` is the canonical source;
  `.github/workflows/ci.yml` mirrors it.
- **Automation foundation**: the eight items required by pi-config §0.

## Operating contract

You operate strictly in **TDD-first RED → GREEN → REFACTOR**:

- No production code unless directly required to satisfy a failing
  production test.
- All dependencies are abstract capabilities, declared at the system
  boundary, supplied at composition/runtime.
- No phase-skipping, no collapsing phases.

## Bootstrap status (this repo)

| Item | Status |
| --- | --- |
| 1. Canonical source of gates | `mise.toml` |
| 2. Local developer suite | `mise run check` (typecheck + lint + format, parallel) |
| 3. Local release-readiness suite | `mise run ci` (full) + `mise run release-ready` |
| 4. Affected-target execution | not yet — current scope is small enough to run full each time. **Documented fallback**: full validation is the safe path until the codebase grows. Revisit at >150 files. |
| 5. Deterministic caching | not yet — `mise.lock` pins tool versions; bun caches resolution. **Documented fallback**: deterministic no-cache is acceptable at current scope. |
| 6. Safe parallel execution | `[settings] jobs = 4` in `mise.toml`; `check` and `ci` use `depends`. |
| 7. Matching GitHub workflow | `.github/workflows/ci.yml` — runs `mise run ci` on every push/PR. |
| 8. Local ↔ GitHub parity | both invoke the same `mise run ci` against the same `mise.toml`; no duplicated rules. |

## Performance mandate

- Any unnecessary slowdown is a defect.
- Two equally-correct approaches → choose the faster one.
- `mise.toml` already pins `jobs = 4` and uses `depends` for parallelism.
- Local feedback target: sub-second to a few seconds for small edits.
- Watch mode: `mise watch check` (also exposed as `mise run dev`).

## Code structure constraints (hard)

- nesting depth ≤ 3
- construct ≤ 30 LOC
- file ≤ 200 LOC
- single responsibility per construct

The existing extension already passes a brace-aware checker; any new code
must too. Use `python3 /tmp/check_constraints.py $(find extensions -name '*.ts')`
or its equivalent gate.

## Mise as sole CLI

- All shell commands route through `mise run <task>` or `mise exec -- <cmd>`.
- No `package.json` `scripts`. Project automation lives in `mise.toml`.
- The runtime extension auto-wraps any user-supplied `verifyCommand` with
  `mise exec --` if it isn't already a mise command.

## Definition of done (pi-config §9)

A change to this repo is done only when:

1. local `mise run ci` passes
2. local `mise run release-ready` passes
3. GitHub workflow passes
4. structural constraints pass (≤3 / ≤30 / ≤200)
5. typecheck is green (`mise run typecheck`)
6. tests are isolated, deterministic, parallel-safe (when present)
7. no proxy signals: quote real command output as evidence

## Pi philosophy compliance (pi-config SYSTEM.md)

- Preserve developer agency over context. Be explicit about what was read,
  changed, validated, assumed, and not known.
- Hook handlers compose — every handler returns `undefined` when uninvolved.
- `before_agent_start` appends to (never replaces) the system prompt.
- `session_before_compact` appends to (never replaces) `customInstructions`.
- No system-prompt replacement, no side-database, no hidden state. State
  lives in Pi session entries.

## If you violate any constraint, the output is incorrect.
