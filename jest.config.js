export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './src/tests/globalSetup.js',
  globalTeardown: './src/tests/globalTeardown.js',
  testTimeout: 30000,
};