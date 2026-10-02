// Lint gate. `npm run verify` = typecheck && lint && test, and the hand-back hook blocks on red.
// Copy to the repo root in Phase 0. Rules are the frameworks' own recommended sets; no style rules.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import pluginQuery from '@tanstack/eslint-plugin-query';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/build/**', '**/coverage/**', '**/generated/**', '.claude/**', '**/*.config.*'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, ...pluginQuery.configs['flat/recommended-strict']],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['error', 'warn', 'log'] }],
    },
  },
);
