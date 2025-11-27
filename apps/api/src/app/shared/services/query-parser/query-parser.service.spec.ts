import { expect } from 'chai';
import { RulesLogic } from 'json-logic-js';

import {
  ExtendedOperations,
  evaluateRules,
  extractFieldsFromRules,
  extractRuleFromTitled,
  extractTitlesFromRules,
  TitledRule,
} from './query-parser.service';

describe('QueryParserService', () => {
  describe('Smoke Tests', () => {
    it('should evaluate a simple equality rule', () => {
      const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
      const data = { value: 42 };
      const { result, error } = evaluateRules(rule, data);
      expect(error).to.be.undefined;
      expect(result).to.be.true;
    });

    it('should evaluate a simple equality rule 2', () => {
      const rule: TitledRule = {
        rule: {
          and: [
            { title: 'Value must equal 42', rule: { '=': [{ var: 'value' }, 42] } },
            { notBetween: [{ var: 'number' }, [1, 5]] },
          ],
        },
      };
      const data = { value: 42, number: 10 };
      const { result, error } = evaluateRules(rule, data);
      expect(error).to.be.undefined;
      expect(result).to.be.true;
    });

    it('should evaluate a complex nested rule', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        and: [
          { '=': [{ var: 'value' }, 42] },
          { startsWith: [{ var: 'text' }, 'hello'] },
          { notBetween: [{ var: 'number' }, [1, 5]] },
        ],
      };
      const data = { value: 42, text: 'hello world', number: 10 };
      const { result, error } = evaluateRules(rule, data);
      expect(error).to.be.undefined;
      expect(result).to.be.true;
    });

    describe('Error Handling', () => {
      it('should handle invalid data types gracefully', () => {
        const rule: RulesLogic<ExtendedOperations> = { startsWith: [{ var: 'text' }, 123] };
        const data = { text: 'hello' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should throw error when safe mode is disabled', () => {
        const rule = { invalid: 'operator' } as unknown as RulesLogic<ExtendedOperations>;
        const data = { text: 'hello' };
        expect(() => evaluateRules(rule, data, false)).to.throw('Failed to evaluate rule');
      });

      it('should return false and error when safe mode is enabled', () => {
        const rule = { invalid: 'operator' } as unknown as RulesLogic<ExtendedOperations>;
        const data = { text: 'hello' };
        const { result, error } = evaluateRules(rule, data, true);
        expect(error).to.not.be.undefined;
        expect(result).to.be.false;
      });

      it('should expect an type error when the rule is invalid', () => {
        // @ts-expect-error - invalid rule
        // biome-ignore lint/correctness/noUnusedVariables: <explanation> x
        const rule: RulesLogic<ExtendedOperations> = { '=@': [{ var: 'value' }, 42] };
      });

      it('should expect an type error when the rule is invalid', () => {
        // @ts-expect-error - invalid rule
        evaluateRules({ '=@': [{ var: 'value' }, 42] }, { value: 42 }, true);
      });
    });
  });

  describe('Custom Operators', () => {
    describe('= operator', () => {
      it('should return true when values are equal', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
        const data = { value: 42 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return true when strings are equal', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'text' }, 'hello'] };
        const data = { text: 'hello' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return true when comparing number and string (type coercion)', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, '42'] };
        const data = { value: 42 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when values are not equal', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
        const data = { value: 43 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when types are different and values cannot be coerced', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 'not a number'] };
        const data = { value: 42 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('startsWith operator', () => {
      it('should return true when string begins with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { startsWith: [{ var: 'text' }, 'hello'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string does not begin with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { startsWith: [{ var: 'text' }, 'world'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('endsWith operator', () => {
      it('should return true when string ends with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { endsWith: [{ var: 'text' }, 'world'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string does not end with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { endsWith: [{ var: 'text' }, 'hello'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('contains operator', () => {
      it('should return true when string contains given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { contains: [{ var: 'text' }, 'llo wo'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string does not contain given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { contains: [{ var: 'text' }, 'xyz'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('doesNotContain operator', () => {
      it('should return true when string does not contain given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotContain: [{ var: 'text' }, 'xyz'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string contains given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotContain: [{ var: 'text' }, 'llo'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('doesNotBeginWith operator', () => {
      it('should return true when string does not begin with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotBeginWith: [{ var: 'text' }, 'world'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string begins with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotBeginWith: [{ var: 'text' }, 'hello'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('doesNotEndWith operator', () => {
      it('should return true when string does not end with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotEndWith: [{ var: 'text' }, 'hello'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when string ends with given value', () => {
        const rule: RulesLogic<ExtendedOperations> = { doesNotEndWith: [{ var: 'text' }, 'world'] };
        const data = { text: 'hello world' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('null operator', () => {
      it('should return true when value is null', () => {
        const rule: RulesLogic<ExtendedOperations> = { null: [{ var: 'value' }] };
        const data = { value: null };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when value is not null', () => {
        const rule: RulesLogic<ExtendedOperations> = { null: [{ var: 'value' }] };
        const data = { value: 'hello' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('notNull operator', () => {
      it('should return true when value is not null', () => {
        const rule: RulesLogic<ExtendedOperations> = { notNull: [{ var: 'value' }] };
        const data = { value: 'hello' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when value is null', () => {
        const rule: RulesLogic<ExtendedOperations> = { notNull: [{ var: 'value' }] };
        const data = { value: null };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('notIn operator', () => {
      it('should return true when value is not in array', () => {
        const rule: RulesLogic<ExtendedOperations> = { notIn: [{ var: 'value' }, ['a', 'b', 'c']] };
        const data = { value: 'd' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when value is in array', () => {
        const rule: RulesLogic<ExtendedOperations> = { notIn: [{ var: 'value' }, ['a', 'b', 'c']] };
        const data = { value: 'b' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when ruleValue is not an array', () => {
        const rule = { notIn: [{ var: 'value' }, 'not an array'] } as unknown as RulesLogic<ExtendedOperations>;
        const data = { value: 'b' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('between operator', () => {
      it('should return true when number is between min and max', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 7 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return true when number equals min', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 5 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return true when number equals max', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 10 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when number is less than min', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 4 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when number is greater than max', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 11 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when value is not a number', () => {
        const rule: RulesLogic<ExtendedOperations> = { between: [{ var: 'value' }, [5, 10]] };
        const data = { value: 'not a number' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when range is not valid', () => {
        const rule = { between: [{ var: 'value' }, [5]] } as unknown as RulesLogic<ExtendedOperations>;
        const data = { value: 7 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('notBetween operator', () => {
      it('should return true when number is less than min', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 4 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return true when number is greater than max', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 11 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should return false when number is between min and max', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 7 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when number equals min', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 5 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when number equals max', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 10 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when value is not a number', () => {
        const rule: RulesLogic<ExtendedOperations> = { notBetween: [{ var: 'value' }, [5, 10]] };
        const data = { value: 'not a number' };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });

      it('should return false when range is not valid', () => {
        const rule = { notBetween: [{ var: 'value' }, [5]] } as unknown as RulesLogic<ExtendedOperations>;
        const data = { value: 7 };
        const { result, error } = evaluateRules(rule, data);
        expect(error).to.be.undefined;
        expect(result).to.be.false;
      });
    });

    describe('Relative Date Operators', () => {
      describe('moreThanXAgo operator', () => {
        it('should return true when date is more than 5 days ago', () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: sevenDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should return false when date is less than 5 days ago', () => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: threeDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });

        it('should return false with invalid date input', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: 'invalid-date' };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });

        it('should return false with invalid rule value', () => {
          const rule = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 'invalid', unit: 'days' }],
          } as unknown as RulesLogic<ExtendedOperations>;
          const data = { createdAt: new Date().toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });
      });

      describe('lessThanXAgo operator', () => {
        it('should return true when date is less than 5 days ago', () => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            lessThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: threeDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should return false when date is more than 5 days ago', () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const rule: RulesLogic<ExtendedOperations> = {
            lessThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: sevenDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });
      });

      describe('withinLast operator', () => {
        it('should return true when date is within last 5 days', () => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            withinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: threeDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should return false when date is more than 5 days ago', () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const rule: RulesLogic<ExtendedOperations> = {
            withinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: sevenDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });

        it('should return false when date is in the future', () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          const rule: RulesLogic<ExtendedOperations> = {
            withinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: tomorrow.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });
      });

      describe('notWithinLast operator', () => {
        it('should return true when date is more than 5 days ago', () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const rule: RulesLogic<ExtendedOperations> = {
            notWithinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: sevenDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should return false when date is within last 5 days', () => {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            notWithinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: threeDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });
      });

      describe('exactlyXAgo operator', () => {
        it('should return true when date is exactly (within tolerance) 5 days ago', () => {
          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

          const rule: RulesLogic<ExtendedOperations> = {
            exactlyXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: fiveDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should return false when date is significantly different from 5 days ago', () => {
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

          const rule: RulesLogic<ExtendedOperations> = {
            exactlyXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'days' }],
          };
          const data = { createdAt: tenDaysAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.false;
        });
      });

      describe('Different time units', () => {
        it('should work with hours', () => {
          const threeHoursAgo = new Date();
          threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            withinLast: [{ var: 'createdAt' }, { amount: 5, unit: 'hours' }],
          };
          const data = { createdAt: threeHoursAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should work with minutes', () => {
          const tenMinutesAgo = new Date();
          tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 5, unit: 'minutes' }],
          };
          const data = { createdAt: tenMinutesAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should work with weeks', () => {
          const threeWeeksAgo = new Date();
          threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 2, unit: 'weeks' }],
          };
          const data = { createdAt: threeWeeksAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should work with months', () => {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 2, unit: 'months' }],
          };
          const data = { createdAt: threeMonthsAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });

        it('should work with years', () => {
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

          const rule: RulesLogic<ExtendedOperations> = {
            moreThanXAgo: [{ var: 'createdAt' }, { amount: 1, unit: 'years' }],
          };
          const data = { createdAt: twoYearsAgo.toISOString() };
          const { result, error } = evaluateRules(rule, data);
          expect(error).to.be.undefined;
          expect(result).to.be.true;
        });
      });
    });
  });

  describe('extractFieldsFromRules', () => {
    it('should extract fields from regular rules', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        and: [{ '=': [{ var: 'user.email' }, 'test@example.com'] }, { '>': [{ var: 'user.age' }, 18] }],
      };

      const fields = extractFieldsFromRules(rule);

      expect(fields).to.have.lengthOf(2);
      expect(fields).to.include('user.email');
      expect(fields).to.include('user.age');
    });

    it('should extract fields from titled rules', () => {
      const titledRule: TitledRule = {
        title: 'User validation',
        rule: {
          and: [
            { title: 'Email check', rule: { '=': [{ var: 'user.email' }, 'test@example.com'] } } as any,
            { title: 'Age check', rule: { '>': [{ var: 'user.age' }, 18] } } as any,
          ],
        },
      };

      const fields = extractFieldsFromRules(titledRule);

      expect(fields).to.have.lengthOf(2);
      expect(fields).to.include('user.email');
      expect(fields).to.include('user.age');
    });

    it('should extract fields from deeply nested titled rules', () => {
      const titledRule: TitledRule = {
        title: 'Main rule',
        rule: {
          and: [
            {
              title: 'Group A',
              rule: {
                or: [
                  { title: 'A1', rule: { '=': [{ var: 'a' }, 1] } } as any,
                  { title: 'A2', rule: { '=': [{ var: 'b' }, 2] } } as any,
                ],
              },
            } as any,
            { title: 'Group B', rule: { '!=': [{ var: 'c' }, 0] } } as any,
          ],
        },
      };

      const fields = extractFieldsFromRules(titledRule);

      expect(fields).to.have.lengthOf(3);
      expect(fields).to.include('a');
      expect(fields).to.include('b');
      expect(fields).to.include('c');
    });

    it('should deduplicate fields', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        and: [{ '=': [{ var: 'user.email' }, 'test@example.com'] }, { '!=': [{ var: 'user.email' }, null] }],
      };

      const fields = extractFieldsFromRules(rule);

      expect(fields).to.have.lengthOf(1);
      expect(fields).to.include('user.email');
    });
  });

  describe('Titled Rules', () => {
    describe('extractRuleFromTitled', () => {
      it('should return the rule as-is if no title wrapper exists', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
        const extracted = extractRuleFromTitled(rule);

        expect(extracted).to.deep.equal(rule);
      });

      it('should extract rule from simple titled rule', () => {
        const titledRule: TitledRule = {
          title: 'Foo bar must equal 42',
          rule: { '=': [{ var: 'value.foo.bar' }, 42] },
        };
        const extracted = extractRuleFromTitled(titledRule);

        expect(extracted).to.deep.equal({ '=': [{ var: 'value.foo.bar' }, 42] });
      });

      it('should extract rules from nested titled rules with and operator', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Foo bar must equal 42',
                rule: { '=': [{ var: 'value.foo.bar' }, 42] },
              } as any,
              {
                title: 'Foo baz must not be empty',
                rule: { '!!': [{ var: 'value.foo.baz' }] },
              } as any,
            ],
          },
        };
        const extracted = extractRuleFromTitled(titledRule);

        expect(extracted).to.deep.equal({
          and: [{ '=': [{ var: 'value.foo.bar' }, 42] }, { '!!': [{ var: 'value.foo.baz' }] }],
        });
      });

      it('should extract rules from deeply nested titled rules', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Subgroup A',
                rule: {
                  or: [
                    { title: 'A1', rule: { '=': [{ var: 'a' }, 1] } } as any,
                    { title: 'A2', rule: { '=': [{ var: 'a' }, 2] } } as any,
                  ],
                },
              } as any,
              { title: 'Subgroup B', rule: { '!=': [{ var: 'b' }, 0] } } as any,
            ],
          },
        };
        const extracted = extractRuleFromTitled(titledRule);

        expect(extracted).to.deep.equal({
          and: [{ or: [{ '=': [{ var: 'a' }, 1] }, { '=': [{ var: 'a' }, 2] }] }, { '!=': [{ var: 'b' }, 0] }],
        });
      });

      it('should handle mixed titled and non-titled rules', () => {
        const input: TitledRule = {
          rule: {
            and: [
              { title: 'First check', rule: { '=': [{ var: 'x' }, 1] } } as any,
              { '=': [{ var: 'y' }, 2] },
              { title: 'Third check', rule: { '=': [{ var: 'z' }, 3] } } as any,
            ],
          },
        };
        const extracted = extractRuleFromTitled(input);

        expect(extracted).to.deep.equal({
          and: [{ '=': [{ var: 'x' }, 1] }, { '=': [{ var: 'y' }, 2] }, { '=': [{ var: 'z' }, 3] }],
        });
      });
    });

    describe('extractTitlesFromRules', () => {
      it('should return empty array if no titles exist', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
        const titles = extractTitlesFromRules(rule);

        expect(titles).to.deep.equal([]);
      });

      it('should extract title from simple titled rule', () => {
        const titledRule: TitledRule = {
          title: 'Foo bar must equal 42',
          rule: { '=': [{ var: 'value.foo.bar' }, 42] },
        };
        const titles = extractTitlesFromRules(titledRule);

        expect(titles).to.deep.equal([{ title: 'Foo bar must equal 42', path: [] }]);
      });

      it('should extract titles from nested titled rules with and operator', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Foo bar must equal 42',
                rule: { '=': [{ var: 'value.foo.bar' }, 42] },
              } as any,
              {
                title: 'Foo baz must not be empty',
                rule: { '!!': [{ var: 'value.foo.baz' }] },
              } as any,
            ],
          },
        };
        const titles = extractTitlesFromRules(titledRule);

        expect(titles).to.deep.equal([
          { title: 'Main rule', path: [] },
          { title: 'Foo bar must equal 42', path: [0] },
          { title: 'Foo baz must not be empty', path: [1] },
        ]);
      });

      it('should extract titles from deeply nested titled rules', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Subgroup A',
                rule: {
                  or: [
                    { title: 'A1', rule: { '=': [{ var: 'a' }, 1] } } as any,
                    { title: 'A2', rule: { '=': [{ var: 'a' }, 2] } } as any,
                  ],
                },
              } as any,
              { title: 'Subgroup B', rule: { '!=': [{ var: 'b' }, 0] } } as any,
            ],
          },
        };
        const titles = extractTitlesFromRules(titledRule);

        expect(titles).to.deep.equal([
          { title: 'Main rule', path: [] },
          { title: 'Subgroup A', path: [0] },
          { title: 'A1', path: [0, 0] },
          { title: 'A2', path: [0, 1] },
          { title: 'Subgroup B', path: [1] },
        ]);
      });

      it('should handle optional titles (only extract present ones)', () => {
        const input: TitledRule = {
          rule: {
            and: [
              { title: 'First check', rule: { '=': [{ var: 'x' }, 1] } } as any,
              { '=': [{ var: 'y' }, 2] },
              { title: 'Third check', rule: { '=': [{ var: 'z' }, 3] } } as any,
            ],
          },
        };
        const titles = extractTitlesFromRules(input);

        expect(titles).to.deep.equal([
          { title: 'First check', path: [0] },
          { title: 'Third check', path: [2] },
        ]);
      });
    });

    describe('Integration with evaluateRules', () => {
      it('should evaluate titled rules correctly when passed through extractRuleFromTitled', () => {
        const titledRule: TitledRule = {
          title: 'Value must equal 42',
          rule: { '=': [{ var: 'value' }, 42] },
        };
        const extracted = extractRuleFromTitled(titledRule);
        const data = { value: 42 };
        const { result, error } = evaluateRules(extracted, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should evaluate titled rules correctly when passed directly to evaluateRules', () => {
        const titledRule: TitledRule = {
          title: 'Value must equal 42',
          rule: { '=': [{ var: 'value' }, 42] },
        };
        const data = { value: 42 };
        const { result, error } = evaluateRules(titledRule, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should evaluate nested titled rules correctly when passed through extractRuleFromTitled', () => {
        const titledRule: TitledRule = {
          title: 'Main validation',
          rule: {
            and: [
              { title: 'Check value', rule: { '=': [{ var: 'value' }, 42] } } as any,
              { title: 'Check text', rule: { startsWith: [{ var: 'text' }, 'hello'] } } as any,
            ],
          },
        };
        const extracted = extractRuleFromTitled(titledRule);
        const data = { value: 42, text: 'hello world' };
        const { result, error } = evaluateRules(extracted, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should evaluate nested titled rules correctly when passed directly to evaluateRules', () => {
        const titledRule: TitledRule = {
          title: 'Main validation',
          rule: {
            and: [
              { title: 'Check value', rule: { '=': [{ var: 'value' }, 42] } } as any,
              { title: 'Check text', rule: { startsWith: [{ var: 'text' }, 'hello'] } } as any,
            ],
          },
        };
        const data = { value: 42, text: 'hello world' };
        const { result, error } = evaluateRules(titledRule, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should evaluate complex nested titled rules correctly when passed through extractRuleFromTitled', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Subgroup A',
                rule: {
                  or: [
                    { title: 'A1', rule: { '=': [{ var: 'a' }, 1] } } as any,
                    { title: 'A2', rule: { '=': [{ var: 'a' }, 2] } } as any,
                  ],
                },
              } as any,
              { title: 'Subgroup B', rule: { '!=': [{ var: 'b' }, 0] } } as any,
            ],
          },
        };
        const extracted = extractRuleFromTitled(titledRule);
        const data = { a: 2, b: 5 };
        const { result, error } = evaluateRules(extracted, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should evaluate complex nested titled rules correctly when passed directly to evaluateRules', () => {
        const titledRule: TitledRule = {
          title: 'Main rule',
          rule: {
            and: [
              {
                title: 'Subgroup A',
                rule: {
                  or: [
                    { title: 'A1', rule: { '=': [{ var: 'a' }, 1] } } as any,
                    { title: 'A2', rule: { '=': [{ var: 'a' }, 2] } } as any,
                  ],
                },
              } as any,
              { title: 'Subgroup B', rule: { '!=': [{ var: 'b' }, 0] } } as any,
            ],
          },
        };
        const data = { a: 2, b: 5 };
        const { result, error } = evaluateRules(titledRule, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });

      it('should handle regular rules without titles', () => {
        const rule: RulesLogic<ExtendedOperations> = { '=': [{ var: 'value' }, 42] };
        const data = { value: 42 };
        const { result, error } = evaluateRules(rule, data);

        expect(error).to.be.undefined;
        expect(result).to.be.true;
      });
    });
  });
});
