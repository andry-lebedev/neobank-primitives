# Quality gates

Repository checks cover different failure classes and should be run together:

```bash
npm run typecheck
npm test
npm run lint
npm run gate
npm run build
```

Type checking protects domain and integration contracts. Tests protect behavior.
Linting catches unsafe or inconsistent source patterns. The complexity gate
flags changed code that is becoming difficult to reason about. The production
build verifies compilation and bundling as one deployable artifact.

Do not weaken a gate to make an unrelated change pass. Fix the scoped issue or
document a pre-existing baseline failure clearly before proceeding.
