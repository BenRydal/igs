import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier'
import ts from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import svelteParser from 'svelte-eslint-parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      parser: parser,
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: parser,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/', '.yarn/'],
  },
]
