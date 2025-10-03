export default {
  preset: null,
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.test.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)',
  ],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/scripts/**'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  testTimeout: 10000,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
