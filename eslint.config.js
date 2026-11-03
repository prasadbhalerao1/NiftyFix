import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.worker } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['error', 'log'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['**/*.tsx'],
    ...jsxA11y.flatConfigs.strict,
    settings: {
      'jsx-a11y': {
        components: { Button: 'button' },
        attributes: { for: ['htmlFor', 'for'] },
      },
    },
  },
);
