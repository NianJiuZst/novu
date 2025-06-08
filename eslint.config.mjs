import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import deprecationPlugin from 'eslint-plugin-deprecation';
import pandaPlugin from '@pandacss/eslint-plugin';
// import cypressPlugin from 'eslint-plugin-cypress/flat';
// import localRulesPlugin from 'eslint-plugin-local-rules';

/**
 * SHARED CONFIGURATIONS
 */

// Common language options for all TypeScript files
const typescriptLanguageOptions = {
  parser: tseslint.parser,
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
};

// Common rules for all files
const commonRules = {
  '@typescript-eslint/await-thenable': 'warn',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/default-param-last': 'off',
  '@typescript-eslint/no-use-before-define': 'off',
  '@typescript-eslint/only-throw-error': 'error',
  '@typescript-eslint/return-await': 'off',
  '@typescript-eslint/no-base-to-string': 'error',
  'no-return-await': 'off',
  'no-await-in-loop': 'off',
  'no-continue': 'off',
  'no-console': 'warn',
  'no-prototype-builtins': 'off',
  'import/no-cycle': 'off',
  'class-methods-use-this': 'off',
  'no-restricted-syntax': 'off',
  'no-underscore-dangle': 'off',
  'import/prefer-default-export': 'off',
  'import/no-extraneous-dependencies': 'off',
  'import/no-namespace': 'error',
  'lines-between-class-members': 'off',
  'max-classes-per-file': 'off',
  'no-else-return': 'off',
  'import/export': 'off',
  'consistent-return': 'off',
  'no-param-reassign': [
    'error',
    {
      props: true,
      ignorePropertyModificationsFor: ['prev', 'acc'],
    },
  ],
  'max-len': [
    'warn',
    {
      code: 140,
    },
  ],
  'padding-line-between-statements': [
    'error',
    {
      blankLine: 'any',
      prev: ['const', 'let', 'var'],
      next: ['if', 'for'],
    },
    {
      blankLine: 'any',
      prev: ['const', 'let', 'var'],
      next: ['const', 'let', 'var'],
    },
    {
      blankLine: 'always',
      prev: '*',
      next: 'return',
    },
  ],
  'id-length': [
    'error',
    {
      min: 2,
      exceptions: ['i', 'e', 'a', 'b', '_', 't'],
      properties: 'never',
    },
  ],
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'enumMember',
      format: ['UPPER_CASE'],
    },
    {
      selector: 'enum',
      format: ['PascalCase'],
      suffix: ['Enum'],
    },
    {
      selector: 'class',
      format: ['PascalCase'],
    },
    {
      selector: 'variableLike',
      format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'interface',
      format: ['PascalCase'],
      prefix: ['I'],
    },
    {
      selector: ['function'],
      format: ['camelCase', 'PascalCase'],
      leadingUnderscore: 'allow',
    },
  ],
};

// Multi-level import restriction pattern
const noRestrictedImportsMultiLevelNovuPattern = {
  group: [
    '@novu/*/**/*',
    '!@novu/api/**/*',
    ...['framework', 'js', 'novui'].flatMap((pkg) => [`!@novu/${pkg}/**/*`, `@novu/${pkg}/*/**/*`]),
  ],
  message:
    "Please import only from the root package entry point. For example, use 'import { Client } from '@novu/api';' instead of 'import { Client } from '@novu/api/src';'",
};

export default [
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/styled-system/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.storybook/**',
      '**/.nx/**',
      '**/config-overrides.js',
      '**/env-config.js',
      '**/*.config.{js,cjs,mjs}',
      '**/iframeResizer.contentWindow.js',
      '**/size-limit.mjs',
      '**/eslint-local-rules.js',
      '**/get-packages-folder.mjs',
      '**/scripts/**',
      '**/jest.setup.js',
      '**/check-ee.mjs',
      '**/libs/embed/src/shared/**',
      '**/*.stories.*',
      '**/notifications-cache.test.ts',
      '**/novu.test.ts',
      '**/swagger.controller.ts',
    ],
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration for all TS files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // Main TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: typescriptLanguageOptions,
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      promise: promisePlugin,
      import: importPlugin,
    },
    rules: {
      ...commonRules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [noRestrictedImportsMultiLevelNovuPattern],
        },
      ],
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Disable TypeScript-specific rules for JS files
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Framework package configuration
  {
    files: ['packages/framework/**/*.{ts,tsx}'],
    plugins: {
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'max-len': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'import/prefer-default-export': 'off',
      'unused-imports/no-unused-imports': 'error',
    },
  },

  // Providers package configuration
  {
    files: ['packages/providers/**/*.{ts,tsx}'],
    plugins: {
      deprecation: deprecationPlugin,
    },
    rules: {
      'deprecation/deprecation': 'error',
    },
  },

  // API application configuration
  {
    files: ['apps/api/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noRestrictedImportsMultiLevelNovuPattern,
            {
              group: ['@nestjs/common'],
              importNames: ['Logger'],
              message: 'Please use the PinoLogger from @novu/application-generic instead',
            },
            {
              group: ['@novu/application-generic'],
              importNames: ['Logger'],
              message: 'Please use the PinoLogger from @novu/application-generic instead',
            },
            {
              group: ['svix'],
              importNames: ['Svix'],
              message: 'Please use the SvixClient from @novu/application-generic instead',
            },
            {
              group: ['@nestjs/swagger'],
              importNames: [
                'ApiOkResponse',
                'ApiCreatedResponse',
                'ApiAcceptedResponse',
                'ApiNoContentResponse',
                'ApiMovedPermanentlyResponse',
                'ApiFoundResponse',
                'ApiBadRequestResponse',
                'ApiUnauthorizedResponse',
                'ApiTooManyRequestsResponse',
                'ApiNotFoundResponse',
                'ApiInternalServerErrorResponse',
                'ApiBadGatewayResponse',
                'ApiConflictResponse',
                'ApiForbiddenResponse',
                'ApiGatewayTimeoutResponse',
                'ApiGoneResponse',
                'ApiMethodNotAllowedResponse',
                'ApiNotAcceptableResponse',
                'ApiNotImplementedResponse',
                'ApiPreconditionFailedResponse',
                'ApiPayloadTooLargeResponse',
                'ApiRequestTimeoutResponse',
                'ApiServiceUnavailableResponse',
                'ApiUnprocessableEntityResponse',
                'ApiUnsupportedMediaTypeResponse',
                'ApiDefaultResponse',
              ],
              message: "Use 'Api<Error>Response' from '/shared/framework/response.decorator' instead.",
            },
          ],
        },
      ],
    },
  },

  // Application-generic library configuration
  {
    files: ['libs/application-generic/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['svix'],
              importNames: ['Svix'],
              message: 'Please use the SvixClient from @novu/application-generic instead',
            },
          ],
        },
      ],
    },
  },

  // Web packages configuration (React apps)
  {
    files: [
      'libs/design-system/**/*.{ts,tsx}',
      'libs/novui/**/*.{ts,tsx}',
      'apps/web/**/*.{ts,tsx,js,jsx}',
      'apps/dashboard/**/*.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@pandacss': pandaPlugin,
      'react-hooks': reactHooksPlugin,
      react: reactPlugin,
      // cypress: cypressPlugin.plugins.cypress,
    },
    rules: {
      ...pandaPlugin.configs.recommended.rules,
      'func-names': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-array-index-key': 'off',
      'no-empty-pattern': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-closing-bracket-location': 'off',
      '@typescript-eslint/ban-types': 'off',
      'react/jsx-wrap-multilines': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'promise/catch-or-return': 'off',
      'react/jsx-one-expression-per-line': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'jsx-a11y/aria-role': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react/require-default-props': 'off',
      'react/no-danger': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          filter: '_',
          selector: 'variableLike',
          leadingUnderscore: 'allow',
          format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
        },
      ],
      '@pandacss/no-config-function-in-source': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Inbox packages configuration
  {
    files: ['packages/js/**/*.{ts,tsx}', 'packages/react/**/*.{ts,tsx}'],
    // plugins: {
    //   'local-rules': localRulesPlugin,
    // },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          filter: '_',
          selector: 'variableLike',
          leadingUnderscore: 'allow',
          format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
        },
      ],
      // 'local-rules/no-class-without-style': 'error',
      'id-length': 'off',
      '@typescript-eslint/no-shadow': 'off',
    },
  },
];
