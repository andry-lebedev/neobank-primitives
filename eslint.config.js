import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { FORBIDDEN, UI_DIRS, EXEMPT_DIRS } from './src/theme-forbidden.js'

const colorLiteralRules = FORBIDDEN.map((re) => ({
  selector: `JSXAttribute[name.name='className'] Literal[value=/${re.source}/]`,
  message: 'Raw Tailwind color literal in className — use a semantic token instead.',
}))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: UI_DIRS.map((dir) => `src/${dir}/**/*.{ts,tsx}`),
    ignores: EXEMPT_DIRS.map((dir) => `src/${dir}/**`),
    rules: {
      'no-restricted-syntax': ['error', ...colorLiteralRules],
    },
  },
])
