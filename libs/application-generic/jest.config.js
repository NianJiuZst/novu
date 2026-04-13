/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    axios: 'axios/dist/node/axios.cjs',
  },
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Integration tests — require running Redis/BullMQ
    '<rootDir>/src/services/queues/',
    '<rootDir>/src/services/bull-mq/',
    '<rootDir>/src/services/in-memory-provider/in-memory-provider\\.service\\.spec\\.ts',
    '<rootDir>/src/services/cache/cache-service\\.spec\\.ts',
  ],
};
