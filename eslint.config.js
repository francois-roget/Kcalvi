// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Jest hoists jest.mock() factories above the module's imports and forbids them from
    // referencing out-of-scope variables, so mocking a native module means requiring it
    // locally inside the factory -- an in-file `import` would break at runtime with
    // "module factory is not allowed to reference out-of-scope variables".
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // interface X extends Y {} is the only syntax TypeScript's declaration merging accepts
    // (a type alias can't be augmented), and both styled-components' DefaultTheme and React
    // Navigation's RootParamList are documented to be typed this way.
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'with-single-extends' }],
    },
  },
]);
