import { Test } from '@nestjs/testing';

import { ActiveJobsMetricQueueService } from './active-jobs-metric-queue.service';

let activeJobsMetricQueueService: ActiveJobsMetricQueueService;

describe('Active Jobs Metric Queue Service', () => {
  describe('Non Cluster Mode', () => {
    beforeEach(async () => {
      process.env.IN_MEMORY_CLUSTER_MODE_ENABLED = 'false';
      const moduleRef = await Test.createTestingModule({
        providers: [ActiveJobsMetricQueueService],
      }).compile();
      activeJobsMetricQueueService = moduleRef.get<ActiveJobsMetricQueueService>(ActiveJobsMetricQueueService);
      await activeJobsMetricQueueService.queue?.drain();
    });

    afterEach(async () => {
      await activeJobsMetricQueueService.queue?.drain();
      await activeJobsMetricQueueService.gracefulShutdown();
    });

    it('should be initialised properly', async () => {
      expect(activeJobsMetricQueueService).toBeDefined();
      expect(activeJobsMetricQueueService).toBeInstanceOf(ActiveJobsMetricQueueService);
      expect(activeJobsMetricQueueService.topic).toEqual('metric-active-jobs');
      await activeJobsMetricQueueService.queue?.drain();
      expect(await activeJobsMetricQueueService.queue?.count()).toEqual(0);
    });
  });

  describe('Cluster Mode', () => {
    beforeEach(async () => {
      process.env.IN_MEMORY_CLUSTER_MODE_ENABLED = 'true';
      const moduleRef = await Test.createTestingModule({
        providers: [ActiveJobsMetricQueueService],
      }).compile();
      activeJobsMetricQueueService = moduleRef.get<ActiveJobsMetricQueueService>(ActiveJobsMetricQueueService);
    });

    afterEach(async () => {
      await activeJobsMetricQueueService.gracefulShutdown();
    });

    it('should be initialised properly for cluster mode', async () => {
      expect(activeJobsMetricQueueService).toBeDefined();
      expect(activeJobsMetricQueueService).toBeInstanceOf(ActiveJobsMetricQueueService);
      expect(activeJobsMetricQueueService.topic).toEqual('metric-active-jobs');
      expect(activeJobsMetricQueueService.queue?.opts?.prefix).toEqual('bull');
    });
  });

  describe('General', () => {
    beforeEach(async () => {
      process.env.IN_MEMORY_CLUSTER_MODE_ENABLED = 'false';
      const moduleRef = await Test.createTestingModule({
        providers: [ActiveJobsMetricQueueService],
      }).compile();
      activeJobsMetricQueueService = moduleRef.get<ActiveJobsMetricQueueService>(ActiveJobsMetricQueueService);
      await activeJobsMetricQueueService.queue?.obliterate();
    });

    it('should have the queue prefix option undefined in the non cluster mode', () => {
      process.env.IN_MEMORY_CLUSTER_MODE_ENABLED = 'false';

      expect(activeJobsMetricQueueService.queue?.opts?.prefix).toEqual(
        process.env.IN_MEMORY_CLUSTER_MODE_ENABLED !== 'true' ? undefined : 'bull'
      );
    });
  });
});
