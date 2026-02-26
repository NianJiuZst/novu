import type { RulesLogic } from 'json-logic-js';

type RelativeDateValue = {
  amount: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
};

type OperationValue = RulesLogic | string | number | boolean | null | RelativeDateValue | unknown[];

interface CustomOperations {
  '=': [OperationValue, OperationValue];
  startsWith: [OperationValue, OperationValue];
  endsWith: [OperationValue, OperationValue];
  contains: [OperationValue, OperationValue];
  doesNotContain: [OperationValue, OperationValue];
  doesNotBeginWith: [OperationValue, OperationValue];
  doesNotEndWith: [OperationValue, OperationValue];
  null: OperationValue;
  notNull: OperationValue;
  notIn: [OperationValue, OperationValue[]];
  between: [OperationValue, [number, number]];
  notBetween: [OperationValue, [number, number]];
  moreThanXAgo: [OperationValue, RelativeDateValue];
  lessThanXAgo: [OperationValue, RelativeDateValue];
  withinLast: [OperationValue, RelativeDateValue];
  notWithinLast: [OperationValue, RelativeDateValue];
  exactlyXAgo: [OperationValue, RelativeDateValue];
}

export type ExtendedOperations = {
  [K in keyof CustomOperations]: { [P in K]: CustomOperations[K] };
}[keyof CustomOperations];
