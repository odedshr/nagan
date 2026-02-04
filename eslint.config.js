import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Custom JSX handling - disable React-specific rules since we use custom JSX
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^jsx$',
        },
      ],
      // Allow any type for flexibility (can be stricter if needed)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty functions
      '@typescript-eslint/no-empty-function': 'off',
      // Allow Function type (used in Context.ts for generic listeners)
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Allow @ts-ignore comments (used in custom JSX)
      '@typescript-eslint/ban-ts-comment': 'off',
      // Allow empty interfaces (used in JSX.d.ts)
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow lexical declarations in case blocks
      'no-case-declarations': 'off',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      // For TSX files with custom JSX, jsx import is used implicitly
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^jsx$',
        },
      ],
      // Allow triple-slash reference for custom JSX type definitions
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    ignores: ['dist/**', 'src-tauri/**', 'node_modules/**'],
  }
);
