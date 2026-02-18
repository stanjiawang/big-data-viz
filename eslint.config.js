import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist', 'node_modules', 'coverage', 'artifacts', 'test-results', 'playwright-report'],
  },
  js.configs.recommended,
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/set-state-in-effect': 'warn',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/dashboard/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/dashboard/constants/*'],
              message: 'Import dashboard constants from "@/features/dashboard" instead.',
            },
            {
              group: ['@/features/dashboard/routes/*'],
              message: 'Import dashboard routes from "@/features/dashboard" instead.',
            },
            {
              group: ['@/features/dashboard/sections/*'],
              message: 'Import dashboard section types from "@/features/dashboard" instead.',
            },
            {
              group: ['@/features/dashboard/state/*'],
              message: 'Import dashboard state APIs from "@/features/dashboard" instead.',
            },
            {
              group: ['@/features/dashboard/ui/*'],
              message: 'Import dashboard UI APIs from "@/features/dashboard" instead.',
            },
          ],
        },
      ],
    },
  },
];
