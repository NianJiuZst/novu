import { expect } from 'chai';
import { RulesLogic } from 'json-logic-js';

import { ExtendedOperations, AnnotatedRule } from './query-parser.service';
import { QueryIssueTypeEnum, QueryValidatorService } from './query-validator.service';
import { COMPARISON_OPERATORS, JsonLogicOperatorEnum } from './types';

describe('QueryValidatorService', () => {
  let queryValidatorService: QueryValidatorService;

  beforeEach(() => {
    const allowedVariables = [
      'payload.foo',
      'payload.bar',
      'subscriber.firstName',
      'subscriber.email',
      'allowed.field',
    ];
    const allowedNamespaces = ['payload.', 'subscriber.data.'];
    queryValidatorService = new QueryValidatorService(allowedVariables, allowedNamespaces);
  });

  describe('validateQueryRules', () => {
    it('should validate a invalid node structure', () => {
      const rule: RulesLogic<ExtendedOperations> = null;

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Invalid node structure');
      expect(issues[0].path).to.deep.equal([]);
    });

    describe('logical operators', () => {
      for (const operator of [JsonLogicOperatorEnum.AND, JsonLogicOperatorEnum.OR]) {
        it(`should validate valid ${operator} operation`, () => {
          const rule = {
            [operator]: [{ '==': [{ var: 'payload.foo' }, 'value1'] }, { '==': [{ var: 'payload.bar' }, 'value2'] }],
          } as RulesLogic<ExtendedOperations>;

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.be.empty;
        });

        it(`should detect invalid ${operator} structure`, () => {
          const rule: any = {
            [operator]: { '==': [{ var: 'payload.foo' }, 'value'] }, // Invalid: and should be an array
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include(`Invalid logical operator "${operator}"`);
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
        });
      }

      it('should validate NOT operation', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '!': { '==': [{ var: 'payload.foo' }, 'value'] },
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.be.empty;
      });

      it('should detect invalid NOT operation', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '!': { '==': [{ var: 'payload.foo' }, ''] },
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Value is required');
        expect(issues[0].path).to.deep.equal([]);
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
      });
    });

    describe('in operation', () => {
      it('should detect invalid array in operation', () => {
        const rule: any = {
          in: [],
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Invalid operation structure');
        expect(issues[0].path).to.deep.equal([]);
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
      });

      describe('"in" operation', () => {
        it('should validate valid "in" operation', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            in: [{ var: 'subscriber.firstName' }, ['value1', 'value2']],
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.be.empty;
        });

        it('should detect invalid field reference in "in" operation', () => {
          const rule = {
            in: [{}, [1, 2]],
          } as RulesLogic<ExtendedOperations>;

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Invalid field reference in comparison');
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
        });

        it('should detect empty array in "in" operation', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            in: [{ var: 'payload.foo' }, []],
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Value is required');
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
        });
      });

      describe('"contains" operation', () => {
        it('should validate valid "contains" operation', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            in: ['search', { var: 'payload.foo' }],
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.be.empty;
        });

        it('should detect invalid field reference in "contains" operation', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            // @ts-expect-error - invalid rule
            in: ['search', {}],
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Invalid field reference in comparison');
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
        });

        it('should detect invalid value in "contains" operation', () => {
          const rule: RulesLogic<ExtendedOperations> = {
            in: ['', { var: 'payload.foo' }],
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Value is required');
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
        });
      });
    });

    describe('between operation', () => {
      it('should validate valid between operation', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '<=': [1, { var: 'payload.foo' }, 10],
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.be.empty;
      });

      it('should detect invalid between structure from lower bound', () => {
        const rule: any = {
          '<=': [undefined, { var: 'payload.foo' }, 10], // Missing lower bound
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Value is required');
        expect(issues[0].path).to.deep.equal([]);
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
      });

      it('should detect invalid between structure from upper bound', () => {
        const rule: any = {
          '<=': [1, { var: 'payload.foo' }, undefined], // Missing upper bound
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Value is required');
        expect(issues[0].path).to.deep.equal([]);
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
      });

      it('should detect invalid field reference in "contains" operation', () => {
        const rule: any = {
          '<=': [1, {}, 1], // invalid field reference
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Invalid field reference in comparison');
        expect(issues[0].path).to.deep.equal([]);
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
      });
    });

    describe('comparison operators', () => {
      for (const operator of COMPARISON_OPERATORS) {
        it(`should validate a valid simple ${operator} rule`, () => {
          const rule = {
            [operator]: [{ var: 'subscriber.firstName' }, 'value'],
          } as RulesLogic<ExtendedOperations>;

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.be.empty;
        });

        it(`should detect invalid ${operator} structure`, () => {
          const rule: any = {
            [operator]: [{ var: 'subscriber.firstName' }], // Missing second operand
          };

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Invalid operation structure');
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
        });

        it(`should detect invalid field reference in "${operator}" operation`, () => {
          const rule = {
            [operator]: [{}, 'value'],
          } as RulesLogic<ExtendedOperations>;

          const issues = queryValidatorService.validateQueryRules(rule);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Invalid field reference in comparison');
          expect(issues[0].path).to.deep.equal([]);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_STRUCTURE);
        });
      }

      it('should validate valid comparison operations', () => {
        const validOperations: RulesLogic<ExtendedOperations>[] = [
          { '<': [{ var: 'payload.foo' }, 5] },
          { '>': [{ var: 'payload.foo' }, 5] },
          { '<=': [{ var: 'payload.foo' }, 5] },
          { '>=': [{ var: 'payload.foo' }, 5] },
          { '==': [{ var: 'payload.foo' }, 'value'] },
          { '!=': [{ var: 'payload.foo' }, 'value'] },
        ];

        for (const operation of validOperations) {
          const issues = queryValidatorService.validateQueryRules(operation);
          expect(issues).to.be.empty;
        }
      });

      it('should handle null values correctly for isNull', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '==': [{ var: 'payload.foo' }, null],
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.be.empty;
      });

      it('should handle null values correctly for !isNull', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '!=': [{ var: 'payload.foo' }, null],
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.be.empty;
      });

      it('should detect null values for non-equality operators', () => {
        const rule: RulesLogic<ExtendedOperations> = {
          '>': [{ var: 'payload.foo' }, null],
        };

        const issues = queryValidatorService.validateQueryRules(rule);

        expect(issues).to.have.lengthOf(1);
        expect(issues[0].message).to.include('Value is required');
        expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
      });
    });

    describe('path calculation', () => {
      const tests = [
        {
          name: 'single rule',
          rule: {
            and: [
              {
                '==': [
                  {
                    var: 'subscriber.email',
                  },
                  '',
                ],
              },
            ],
          },
          path: [0],
        },
        {
          name: 'second rule',
          rule: {
            and: [
              {
                '==': [
                  {
                    var: 'subscriber.email',
                  },
                  'asdf',
                ],
              },
              {
                '==': [
                  {
                    var: 'subscriber.email',
                  },
                  '',
                ],
              },
            ],
          },
          path: [1],
        },
        {
          name: 'nested rule',
          rule: {
            and: [
              {
                and: [
                  {
                    '==': [
                      {
                        var: 'subscriber.email',
                      },
                      '',
                    ],
                  },
                ],
              },
            ],
          },
          path: [0, 0],
        },
        {
          name: 'nested second rule',
          rule: {
            and: [
              {
                and: [
                  {
                    '==': [
                      {
                        var: 'subscriber.email',
                      },
                      'asdf',
                    ],
                  },
                  {
                    '!=': [
                      {
                        var: 'subscriber.email',
                      },
                      undefined,
                    ],
                  },
                ],
              },
            ],
          },
          path: [0, 1],
        },
        {
          name: 'second or operator first rule',
          rule: {
            or: [
              {
                and: [
                  {
                    '==': [
                      {
                        var: 'subscriber.email',
                      },
                      'asdf',
                    ],
                  },
                  {
                    '!=': [
                      {
                        var: 'subscriber.email',
                      },
                      '22',
                    ],
                  },
                ],
              },
              {
                or: [
                  {
                    '==': [
                      {
                        var: 'subscriber.email',
                      },
                      '',
                    ],
                  },
                ],
              },
            ],
          },
          path: [1, 0],
        },
        {
          name: 'nested not in operation',
          rule: {
            or: [
              {
                and: [
                  {
                    '==': [
                      {
                        var: 'subscriber.email',
                      },
                      'asdf',
                    ],
                  },
                  {
                    '!': {
                      in: [
                        '',
                        {
                          var: 'subscriber.firstName',
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          path: [0, 1],
        },
      ];

      for (const test of tests) {
        it(`should return the correct path for ${test.name}`, () => {
          const { rule, path } = test;

          const issues = queryValidatorService.validateQueryRules(rule as any);

          expect(issues).to.have.lengthOf(1);
          expect(issues[0].message).to.include('Value is required');
          expect(issues[0].path).to.deep.equal(path);
          expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
        });
      }
    });
  });

  describe('field validation', () => {
    it('should validate allowed fields', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'allowed.field' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.be.empty;
    });

    it('should validate fields with allowed prefixes', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'subscriber.data.foo' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.be.empty;
    });

    it('should validate namespace field itself (subscriber.data)', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'subscriber.data' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.be.empty;
    });

    it('should detect invalid namespace field (payload)', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'payload' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should detect invalid field that is not in allowed list', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'not_allowed_field' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should detect empty field value', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: '' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should detect invalid prefix', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'invalid.prefix.field' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should detect invalid field with allowed prefixes', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        '==': [{ var: 'payload.' }, 'value'],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should validate complex query with multiple field references', () => {
      const rule: RulesLogic<ExtendedOperations> = {
        and: [
          { '==': [{ var: 'payload.foo' }, 'value1'] },
          { '==': [{ var: 'subscriber.data.bar' }, 'value2'] },
          { '!=': [{ var: 'invalid.field' }, 'value3'] },
        ],
      };

      const issues = queryValidatorService.validateQueryRules(rule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([2]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });
  });

  describe('Wrapped Rules Validation', () => {
    it('should validate simple wrapped rule correctly', () => {
      const annotatedRule: AnnotatedRule = {
        id: 'Foo bar must equal 42',
        rule: { '==': [{ var: 'payload.foo' }, 42] },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.be.empty;
    });

    it('should validate nested wrapped rules correctly', () => {
      const annotatedRule: AnnotatedRule = {
        id: 'Main rule',
        rule: {
          and: [
            {
              id: 'Foo bar must equal 42',
              rule: { '==': [{ var: 'payload.foo' }, 42] },
            } as any,
            {
              id: 'Subscriber email must be set',
              rule: { '!=': [{ var: 'subscriber.email' }, null] },
            } as any,
          ],
        },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.be.empty;
    });

    it('should detect validation issues in wrapped rules', () => {
      const annotatedRule: AnnotatedRule = {
        id: 'Main rule',
        rule: {
          and: [
            {
              id: 'Valid check',
              rule: { '==': [{ var: 'payload.foo' }, 42] },
            } as any,
            {
              id: 'Invalid check',
              rule: { '==': [{ var: 'invalid.field' }, 'value'] },
            } as any,
          ],
        },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([1]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });

    it('should detect missing values in wrapped rules', () => {
      const annotatedRule: AnnotatedRule = {
        id: 'Main rule',
        rule: {
          and: [
            {
              id: 'Check with missing value',
              rule: { '==': [{ var: 'payload.foo' }, ''] },
            } as any,
          ],
        },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is required');
      expect(issues[0].path).to.deep.equal([0]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.MISSING_VALUE);
    });

    it('should validate deeply nested wrapped rules', () => {
      const annotatedRule: AnnotatedRule = {
        id: 'Main rule',
        rule: {
          and: [
            {
              id: 'Subgroup A',
              rule: {
                or: [
                  { id: 'A1', rule: { '==': [{ var: 'payload.foo' }, 1] } } as any,
                  { id: 'A2', rule: { '==': [{ var: 'payload.bar' }, 2] } } as any,
                ],
              },
            } as any,
            { id: 'Subgroup B', rule: { '!=': [{ var: 'subscriber.email' }, null] } } as any,
          ],
        },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.be.empty;
    });

    it('should handle mixed wrapped and non-wrapped rules', () => {
      const annotatedRule: AnnotatedRule = {
        rule: {
          and: [
            { id: 'First check', rule: { '==': [{ var: 'payload.foo' }, 1] } } as any,
            { '==': [{ var: 'payload.bar' }, 2] },
            { id: 'Third check', rule: { '==': [{ var: 'invalid.field' }, 3] } } as any,
          ],
        },
      };

      const issues = queryValidatorService.validateQueryRules(annotatedRule);

      expect(issues).to.have.lengthOf(1);
      expect(issues[0].message).to.include('Value is not valid');
      expect(issues[0].path).to.deep.equal([2]);
      expect(issues[0].type).to.equal(QueryIssueTypeEnum.INVALID_FIELD_VALUE);
    });
  });
});
