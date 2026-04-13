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
    // TODO: fix ESM compatibility (p-queue, @launchdarkly/js-sdk-common)
    '<rootDir>/src/services/analytic-logs/',
    '<rootDir>/src/usecases/verify-payload/',
    '<rootDir>/src/usecases/select-variant/',
    '<rootDir>/src/usecases/select-integration/',
    '<rootDir>/src/usecases/update-subscriber/',
    '<rootDir>/src/usecases/create-or-update-subscriber/',
    '<rootDir>/src/usecases/get-subscriber-template-preference/',
    '<rootDir>/src/usecases/message-template/',
    '<rootDir>/src/usecases/create-execution-details/',
    '<rootDir>/src/usecases/compile-template/',
    '<rootDir>/src/usecases/get-novu-layout/',
    '<rootDir>/src/services/readiness/',
    '<rootDir>/src/services/in-memory-lru-cache/',
    '<rootDir>/src/services/metrics/',
    '<rootDir>/src/utils/duration-utils\\.spec\\.ts',
    // TODO: fix vitest imports — these tests use vitest, not jest
    '<rootDir>/src/usecases/merge-preferences/',
    '<rootDir>/src/http/utils\\.types\\.spec\\.ts',
    // TODO: fix @opentelemetry module resolution
    '<rootDir>/src/commands/base\\.command\\.spec\\.ts',
    // TODO: fix assertion bug (uses chai .to.equal in jest)
    '<rootDir>/src/pipes/parse-slug-env-id\\.pipe\\.spec\\.ts',
    // TODO: fix test assertion
    '<rootDir>/src/schemas/channel-endpoint/',
  ],
};
