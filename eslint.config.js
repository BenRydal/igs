import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.es2017,
				...globals.node
			},
			ecmaVersion: 2020,
			sourceType: 'module'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		// Disable rules for p5.js sketch files
		files: ['src/lib/sketch-gui/*.js', 'src/lib/draw/*.js', 'src/lib/floorplan/*.js', 'src/lib/video/*.js'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-this-alias': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'no-undef': 'off'
		}
	},
	{
		ignores: [
			'.DS_Store',
			'node_modules',
			'build/',
			'.svelte-kit/',
			'package/',
			'.env',
			'.env.*',
			'!.env.example',
			'pnpm-lock.yaml',
			'package-lock.json',
			'yarn.lock',
			'static/**/*.min.js'
		]
	}
];
