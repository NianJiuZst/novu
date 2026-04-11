/**
 * New Relic's agent throws at require() time when NEW_RELIC_APP_NAME is unset.
 * CI runs `nx test` without that env; use no-op implementations so imports do not crash.
 * Mirrors the pattern in analytic-logs/clickhouse-batch.service.ts.
 */
const noopTransaction = { end: () => {} };

export const noopNewRelicForCiTest = {
  startBackgroundTransaction: (_transactionName: string, _groupName: string, callback: () => void) => callback(),
  getTransaction: () => noopTransaction,
  noticeError: (_error: unknown) => {},
  recordMetric: (_name: string, _value: number) => {},
};

export type NewRelicAgentLike = typeof noopNewRelicForCiTest;

export function loadNewRelicOrNoopInCiTest(): NewRelicAgentLike {
  if (process.env.CI && process.env.NODE_ENV === 'test') {
    return noopNewRelicForCiTest;
  }

  // New Relic is CommonJS-only; dynamic import would be async and break call sites.
  // biome-ignore lint/style/noCommonJs: newrelic package has no ESM entry
  return require('newrelic') as NewRelicAgentLike;
}
