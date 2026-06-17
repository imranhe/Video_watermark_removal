module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/dev-server.js',
    '!src/server.js',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterSetup: ['./tests/setup.js'],
  verbose: true,
};
