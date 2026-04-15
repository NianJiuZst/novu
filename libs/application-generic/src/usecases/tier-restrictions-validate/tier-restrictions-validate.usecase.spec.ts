import { ApiServiceLevelEnum, StepTypeEnum } from '@novu/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TierRestrictionsValidateUsecase } from './tier-restrictions-validate.usecase';

describe('TierRestrictionsValidateUsecase', () => {
  let usecase: TierRestrictionsValidateUsecase;

  beforeEach(() => {
    const orgRepoStub = {
      findById: vi.fn().mockResolvedValue({
        _id: 'org-id',
        apiServiceLevel: ApiServiceLevelEnum.FREE,
      }),
    };
    const featureFlagsStub = {
      getFlag: vi.fn().mockResolvedValue(30 * 24 * 60 * 60 * 1000),
    };

    usecase = new TierRestrictionsValidateUsecase(orgRepoStub as any, featureFlagsStub as any);
  });

  describe('invalid cron expressions', () => {
    it('should not throw when cron is an invalid expression like "pay"', async () => {
      const result = await usecase.execute({
        organizationId: 'org-id',
        environmentId: 'env-id',
        userId: 'user-id',
        stepType: StepTypeEnum.DIGEST,
        cron: 'pay',
      } as any);

      expect(result).toEqual([]);
    });

    it('should not throw when cron contains random text', async () => {
      const result = await usecase.execute({
        organizationId: 'org-id',
        environmentId: 'env-id',
        userId: 'user-id',
        stepType: StepTypeEnum.DIGEST,
        cron: 'every monday at 9am',
      } as any);

      expect(result).toEqual([]);
    });

    it('should validate a valid cron expression without throwing', async () => {
      const result = await usecase.execute({
        organizationId: 'org-id',
        environmentId: 'env-id',
        userId: 'user-id',
        stepType: StepTypeEnum.DIGEST,
        cron: '0 9 * * 1',
      } as any);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
