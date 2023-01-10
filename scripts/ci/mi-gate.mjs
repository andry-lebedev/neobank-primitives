#!/usr/bin/env node
// Per-file Maintainability Index gate.
//
// Strips TypeScript types via the compiler API, then runs typhonjs-escomplex
// over the resulting ES module to obtain Halstead V + cyclomatic + SLoC -> MI.
// escomplex returns the original SEI Maintainability Index (uncapped, ~0-171),
// not the clamped 0-100 variant — simple files can score above 100. The 75
// floor is applied on that scale.
//
// Usage:
//   node scripts/ci/mi-gate.mjs <file.ts> [file.ts ...]
//
// Env:
//   MIN_MI   default 75. Per-file MI floor.
//   FORMAT   "table" (default) or "json".
//
// Exit codes:
//   0  every file passes
//   1  at least one file is below MIN_MI

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import escomplex from "typhonjs-escomplex";
import ts from "typescript";

const MIN_MI = Number(process.env.MIN_MI ?? 75);
const FORMAT = process.env.FORMAT ?? "table";

function stripTypes(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    },
  }).outputText;
}

function analyze(filePath) {
  const source = readFileSync(filePath, "utf8");
  const js = stripTypes(source);
  const report = escomplex.analyzeModule(js);
  return {
    file: filePath,
    mi: Number(report.maintainability.toFixed(1)),
    sloc: report.aggregate.sloc.physical,
    cyclomatic: report.aggregate.cyclomatic,
  };
}

const files = process.argv.slice(2).filter((f) => existsSync(resolve(f)));
if (files.length === 0) {
  console.log("mi-gate: no files to check");
  process.exit(0);
}

const results = [];
for (const f of files) {
  try {
    results.push(analyze(f));
  } catch (err) {
    console.error(`mi-gate: failed to analyze ${f}: ${err.message}`);
    process.exit(1);
  }
}

const failures = results.filter((r) => r.mi < MIN_MI);

if (FORMAT === "json") {
  console.log(JSON.stringify({ minMi: MIN_MI, results, failures }, null, 2));
} else {
  const w = Math.max(...results.map((r) => r.file.length));
  for (const r of results) {
    const flag = r.mi < MIN_MI ? " ✗" : "";
    console.log(
      `${r.file.padEnd(w)}  MI=${String(r.mi).padStart(5)}  SLoC=${String(r.sloc).padStart(4)}  CC=${String(r.cyclomatic).padStart(3)}${flag}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\nFAIL: ${failures.length} file(s) below MI ${MIN_MI}:`);
  for (const f of failures) {
    console.error(`  ${f.file}  MI=${f.mi}`);
  }
  console.error(
    `\nLower per-file maintainability is usually driven by length, deep nesting, or many branches per function.`,
  );
  console.error(
    `Either split the file (preferred — extract a sibling module) or simplify the densest functions.`,
  );
  process.exit(1);
}

console.log(`\nOK: all ${results.length} file(s) ≥ MI ${MIN_MI}.`);
