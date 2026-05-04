# Changelog

All notable changes to `pi-until-done` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-05-04

### Added

- `/until-done <intent>` slash command with PHASE 0 brainstorm interview
  (goalType + surfaces + verifyCommand) before locking the North Star
  contract.
- All 29 Pi hook events addressed with compose-don't-replace semantics.
- 8 tools: `until_done_set`, `until_done_plan`, `until_done_replan`,
  `until_done_task_update`, `until_done_complete`, `until_done_block`,
  `until_done_progress`, `until_done_distill`.
- `/until-done ask <question>` side-question primitive that does not
  preempt the loop.
- `until_done_distill` — after completion, compiles the journey (goal,
  surfaces, learnings, gotchas, replan log) into a PRD-shaped summary at
  `.until-done/distilled.md`.
- Verifiability discipline injected every turn: do not accept proxy
  signals, treat uncertainty as not achieved, quote evidence, cleanup
  before complete.
- Mise-first CLI policy: every shell command routed through `mise run` or
  `mise exec --`. `verifyCommand` auto-wrapped on lock-in.
- CI on stop event: parallel typecheck/lint/format/compile/test/build via
  mise across 18 language profiles (Swift, C++, Kotlin, Lua, Luau,
  Roblox, Python pip+uv, Go, Rust, Ruby, Elixir, Erlang, Zig, Java
  Gradle+Maven, .NET, TypeScript bun/pnpm/npm/yarn, Deno).
- pi-config principles injected every turn: bootstrap mandate, performance
  mandate, capability injection + test model, definition of done, working
  style.
- Structural-constraints rule applied to every language Pi generates
  code in: ≤3 nesting, ≤30 LOC per construct, ≤200 LOC per file.
- `Ctrl+G` keyboard shortcut to toggle the contract widget.
- `--until-done <text>` CLI flag for setting a goal at startup.
- Compaction annotation that grows the thread's signal-to-noise ratio
  with last 6 evidence + last 8 learnings, preserved verbatim.
- AGENTS.md adopting pi-config's contract for this repo.
- `.github/workflows/ci.yml` matching GitHub Agentic Workflow.
- `mise.toml` as sole CI/CD orchestrator.
- Smoke tests in `tests/`.
- LICENSE (MIT), SECURITY.md.

[Unreleased]: https://github.com/srinitude/pi-until-done/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/srinitude/pi-until-done/releases/tag/v0.1.0
