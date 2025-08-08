import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  BullMqService,
  getInboundParseMailWorkerOptions,
  IInboundParseDataDto,
  IInboundParseJobDto,
  InboundParseWorkerService,
  QueueProviderFactory,
  WorkerOptions,
  WorkflowInMemoryProviderService,
} from '@novu/application-generic';
import { JobTopicNameEnum } from '@novu/shared';
import { InboundEmailParseCommand } from '../usecases/inbound-email-parse/inbound-email-parse.command';
import { InboundEmailParse } from '../usecases/inbound-email-parse/inbound-email-parse.usecase';

const LOG_CONTEXT = 'InboundParseQueueService';

@Injectable()
export class InboundParseWorker extends InboundParseWorkerService {
  constructor(
    private inboundEmailParseUsecase: InboundEmailParse,
    public workflowInMemoryProviderService: WorkflowInMemoryProviderService,
    @Optional() public queueProviderFactory?: QueueProviderFactory
  ) {
    super(new BullMqService(workflowInMemoryProviderService), queueProviderFactory, workflowInMemoryProviderService);

    // Wrap the old processor to match the new QueueProcessor signature
    const wrappedProcessor = async (job: any): Promise<void> => {
      const oldProcessor = this.getWorkerProcessor();
      await oldProcessor({ data: job });
    };

    this.initWorker(wrappedProcessor, this.getWorkerOptions()).then(() => {
      // Worker initialized successfully
    }).catch((error) => {
      console.error('Failed to initialize inbound parse worker:', error);
    });
  }

  private getWorkerOptions(): WorkerOptions {
    return getInboundParseMailWorkerOptions();
  }

  public getWorkerProcessor() {
    return async ({ data }: { data: IInboundParseDataDto }) => {
      Logger.verbose({ data }, 'Processing the inbound parsed email', LOG_CONTEXT);
      await this.inboundEmailParseUsecase.execute(InboundEmailParseCommand.create({ ...data }));
    };
  }
}
