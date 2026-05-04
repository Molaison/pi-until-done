## Summary

<!-- 1-3 bullets explaining WHY this change. -->

## Phase

<!-- Which TDD phase is this PR in? -->
- [ ] ANALYSIS
- [ ] BOOTSTRAP
- [ ] RED (failing test added)
- [ ] GREEN (smallest change to pass)
- [ ] REFACTOR
- [ ] CLEANUP

## Test plan

<!-- How did you verify this? Quote the actual command output. -->

```
$ mise run check
…
```

## Constraint check

- [ ] Every file I touched is ≤ 200 LOC
- [ ] Every construct I touched is ≤ 30 LOC
- [ ] Every logical nesting depth I touched is ≤ 3
- [ ] No new `package.json` `scripts` (mise.toml only)
- [ ] No raw binaries — all CLI invocations route through `mise run` / `mise exec --`

## Author attribution

- [ ] **No AI co-authorship trailers** in any commit (`Co-Authored-By: Claude`,
  `Generated with Claude Code`, etc.) — this is a hard project policy.
  See [CONTRIBUTING.md](../CONTRIBUTING.md#no-ai-co-authorship-in-commits-or-prs).

## Linked issues

<!-- Fixes #123 / Closes #456 -->
