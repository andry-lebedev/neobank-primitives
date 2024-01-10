// Single-purpose ESLint flat config for the cognitive-complexity gate.
// Not the day-to-day linter (eslint.config.js does that) — only the CI
// quality gate. Threshold 15 is Sonar's default.

import sonarjs from "eslint-plugin-sonarjs";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { sonarjs },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 15],
    },
  },
];
