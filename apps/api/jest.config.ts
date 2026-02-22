export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  moduleNameMapper: {
    '^@mmulpuri/data$': '<rootDir>/../../libs/data/src/index.ts',
    '^@mmulpuri/auth$': '<rootDir>/../../libs/auth/src/index.ts',
  },
};
