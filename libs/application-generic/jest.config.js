/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    axios: 'axios/dist/node/axios.cjs',
    '^@novu/testing$': '<rootDir>/../testing/src/index.ts',
  },
  setupFiles: ['./jest.setup.js'],
};
