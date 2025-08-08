import { Injectable, Optional } from '@nestjs/common';
import {
  BullMqService,
  getWorkflowWorkerOptions,
  IWorkflowDataDto,
  PinoLogger,
  QueueProviderFactory,
  Store,
  storage,
  TriggerEvent,
  WorkerOptions,
  WorkerProcessor,
  WorkflowInMemoryProviderService,
  WorkflowWorkerService,
} from '@novu/application-generic';
import { CommunityOrganizationRepository } from '@novu/dal';
import { ObservabilityBackgroundTransactionEnum } from '@novu/shared';

const nr = require('newrelic');

@Injectable()
export class WorkflowWorker extends WorkflowWorkerService {
  constructor(
    private triggerEventUsecase: TriggerEvent,
    public workflowInMemoryProviderService: WorkflowInMemoryProviderService,
    private organizationRepository: CommunityOrganizationRepository,
    private logger: PinoLogger,
    @Optional() public queueProviderFactory?: QueueProviderFactory
  ) {
    super(new BullMqService(workflowInMemoryProviderService), queueProviderFactory, workflowInMemoryProviderService);
    this.logger.setContext(this.constructor.name);
    // Wrap the old processor to match the new QueueProcessor signature
    const wrappedProcessor = async (job: any): Promise<void> => {
      const oldProcessor = this.getWorkerProcessor();
      if (typeof oldProcessor === 'function') {
        // Cast the processor to the expected function signature
        const processor = oldProcessor as (params: { data: any }) => Promise<any>;
        await processor({ data: job });
      }
    };

    this.initWorker(wrappedProcessor, this.getWorkerOptions()).then(() => {
      // Worker initialized successfully
    }).catch((error) => {
      this.logger.error('Failed to initialize workflow worker:', error);
    });
  }

  private getWorkerOptions(): WorkerOptions {
    return getWorkflowWorkerOptions();
  }

  private getWorkerProcessor(): WorkerProcessor {
    return async ({ data }: { data: IWorkflowDataDto }) => {
      const organizationExists = await this.organizationExist(data);

      if (!organizationExists) {
        this.logger.warn(`Organization not found for organizationId ${data.organizationId}. Skipping job.`);

        return;
      }

      return await new Promise((resolve, reject) => {
        const _this = this;

        this.logger.trace(`Job ${data.identifier} is being processed in the new instance workflow worker`);

        nr.startBackgroundTransaction(
          ObservabilityBackgroundTransactionEnum.TRIGGER_HANDLER_QUEUE,
          'Trigger Engine',
          function processTask() {
            const transaction = nr.getTransaction();

            storage.run(new Store(PinoLogger.root), () => {
              _this.triggerEventUsecase
                .execute(data)
                .then(resolve)
                .catch((e) => {
                  nr.noticeError(e);
                  reject(e);
                })
                .finally(() => {
                  transaction.end();
                });
            });
          }
        );
      });
    };
  }

  private async organizationExist(data: IWorkflowDataDto): Promise<boolean> {
    const { organizationId } = data;

    const organization = await this.organizationRepository.findOne({ _id: organizationId });

    return !!organization;
  }
}
