module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['controllers/**/*.js', 'services/**/*.js', 'middleware/**/*.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 10000,
};
