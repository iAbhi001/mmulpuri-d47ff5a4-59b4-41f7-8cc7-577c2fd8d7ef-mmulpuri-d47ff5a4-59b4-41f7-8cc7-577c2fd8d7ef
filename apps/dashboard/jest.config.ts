export default {
  displayName: 'dashboard',
  preset: '../../jest.preset.js',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', useESM: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@ngrx|@angular|rxjs)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/dashboard',
  moduleNameMapper: {
    '^@mmulpuri/data$': '<rootDir>/../../libs/data/src/index.ts',
    '^@mmulpuri/auth$': '<rootDir>/../../libs/auth/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
