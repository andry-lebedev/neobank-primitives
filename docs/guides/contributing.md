# Contributing

Keep changes focused and preserve the starter's zero-configuration demo path.

## Workflow

1. Create a branch from the current default branch.
2. Describe the user or integration outcome the change enables.
3. Add tests at the boundary being changed.
4. Keep pages dependent on domain contracts rather than live transport modules.
5. Run typecheck, tests, lint, complexity gate, and build.
6. Summarize validation and any known baseline issue in the pull request.

Avoid unrelated formatting or dependency churn. Generated UI primitives,
live-adapter internals, and configuration contracts should change only when the
task explicitly requires them.

Documentation should name exact files and commands, avoid secret values, and
distinguish demo behavior from production guarantees.
