import { Injectable } from '@nestjs/common';
import jsonLogic, { type AdditionalOperation, type RulesLogic } from 'json-logic-js';

@Injectable()
export class EvaluateSubscriptionConditions {
  evaluateConditions(conditions: Record<string, unknown> | undefined, payload: Record<string, unknown>): boolean {
    if (!conditions) {
      return true;
    }

    try {
      const result = jsonLogic.apply(conditions as RulesLogic<AdditionalOperation>, payload);

      return typeof result === 'boolean' ? result : false;
    } catch {
      return false;
    }
  }
}
