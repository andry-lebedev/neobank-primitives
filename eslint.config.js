import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import { FORBIDDEN, EXEMPT, UI_DIRS } from './src/theme-forbidden.js'

// Seam 1 editor-time guard: flag raw Tailwind color literals inside className
// string literals so the developer sees it before the vitest build gate does.
const colorLiteralRules = FORBIDDEN.map((re) => ({
  selector: `JSXAttribute[name.name='className'] Literal[value=/${re.source}/]`,
  message: 'Raw Tailwind color literal in className — use a semantic token instead.',
}))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: UI_DIRS.map((dir) => `src/${dir}/**/*.{js,jsx}`),
    ignores: [...EXEMPT].map((name) => `**/${name}`),
    rules: {
      'no-restricted-syntax': ['error', ...colorLiteralRules],
    },
  },
])
