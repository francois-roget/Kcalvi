module.exports = {
  // Press "e" in --watch/--watchAll mode to toggle coverage collection on/off (default key
  // for `collectCoverage` from this plugin -- off by default so watch mode stays fast on
  // every keystroke-triggered run; coverage is only computed on demand).
  watchPlugins: [['jest-watch-toggle-config', { setting: 'collectCoverage' }]],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.dbtest.ts',
    '!src/**/index.ts',
    '!src/i18n/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  projects: [
    {
      displayName: 'App',
      preset: 'jest-expo',
      testPathIgnorePatterns: ['/node_modules/', '/.maestro/'],
    },
    {
      // Tests that hit a real SQLite database (better-sqlite3) through the real
      // WatermelonDB SQLiteAdapter, rather than a mock. Isolated from the "App"
      // project: under the jest-expo preset, RN module resolution prefers
      // `.native.js` files (no native bridge under Jest); this project
      // deliberately avoids that preset so Node resolves the non-native SQLite
      // bridge WatermelonDB ships for its own tests (adapters/sqlite/sqlite-node,
      // based on better-sqlite3).
      displayName: 'DB',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/*.dbtest.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': [
          'babel-jest',
          {
            presets: [require.resolve('expo/internal/babel-preset')],
            caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
          },
        ],
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    },
  ],
};
