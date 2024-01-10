#!/usr/bin/env bash
# Quality gate for changed production TypeScript files.
#
# Two checks, run cheapest-signal-first:
#   1. Per-function cognitive complexity <= 15 (Sonar default) via
#      eslint-plugin-sonarjs (eslint.cognitive.config.mjs).
#   2. Per-file Maintainability Index >= MIN_MI (default 75) via
#      scripts/ci/mi-gate.mjs.
#
# Scope: files that exist post-change under src/ (tests excluded).
#
# Env:
#   BASE_SHA, HEAD_SHA   git refs to diff (CI sets these from PR base/head).
#   MIN_MI               default 75. Per-file MI floor.

set -euo pipefail

BASE_SHA="${BASE_SHA:-origin/master}"
HEAD_SHA="${HEAD_SHA:-HEAD}"
MIN_MI="${MIN_MI:-75}"

# Production code only. Tests are excluded — the gate measures behavioural code.
CHANGED_LIST=$(
  git diff --name-only --diff-filter=AM "$BASE_SHA" "$HEAD_SHA" -- \
    'src/**/*.ts' 'src/**/*.tsx' \
    ':(exclude)src/**/*.spec.ts' \
    ':(exclude)src/**/*.test.ts' \
    ':(exclude)src/**/*.spec.tsx' \
    ':(exclude)src/**/*.test.tsx'
)

if [ -z "$CHANGED_LIST" ]; then
  echo "complexity-gate: no production TS files changed — skipping"
  exit 0
fi

CHANGED_COUNT=$(echo "$CHANGED_LIST" | wc -l | tr -d ' ')
echo "complexity-gate: checking ${CHANGED_COUNT} file(s)"
echo "$CHANGED_LIST" | sed 's/^/  /'
echo

# IFS=newline so the unquoted "$CHANGED_LIST" expands to one arg per file.
IFS=$'\n'
# shellcheck disable=SC2086
set -- $CHANGED_LIST
unset IFS

FAILED=0

echo "── per-function cognitive complexity (≤ 15) ──"
if ! npx --no-install eslint --config eslint.cognitive.config.mjs --no-warn-ignored "$@"; then
  FAILED=1
fi
echo

echo "── per-file Maintainability Index (≥ ${MIN_MI}) ──"
if ! MIN_MI="$MIN_MI" node scripts/ci/mi-gate.mjs "$@"; then
  FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
  echo
  echo "complexity-gate: FAIL — see violations above."
  echo "Split the file or extract dense functions to reduce per-function cognitive load and raise file MI."
  exit 1
fi

echo
echo "complexity-gate: OK"
