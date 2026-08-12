/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '/test/.*\\.spec\\.ts$',
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  collectCoverageFrom: ['lib/**/*.ts', '!lib/index.ts', '!lib/**/index.ts'],
  coverageDirectory: 'coverage',
};
