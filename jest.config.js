/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  testMatch: ['**/tests/unit/**/*.test.js'],
  collectCoverageFrom: [
    'src/core/db.js',
    'src/core/security.js',
    'src/utils/formatters.js',
  ],
  coverageThreshold: {
    global: { branches: 75, functions: 85, lines: 85, statements: 85 },
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  coverageReporters: ['text', 'html'],
};
