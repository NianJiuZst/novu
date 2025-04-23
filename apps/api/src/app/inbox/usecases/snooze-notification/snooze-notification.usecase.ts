import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  NotImplementedException,
} from '@nestjs/common';
import {
  CreateExecutionDetails,
  CreateExecutionDetailsCommand,
  DetailEnum,
  StandardQueueService,
  FeatureFlagsService,
  SYSTEM_LIMITS,
} from '@novu/application-generic';
import {
  JobEntity,
  JobRepository,
  MessageRepository,
  MessageEntity,
  OrganizationEntity,
  EnvironmentEntity,
  UserEntity,
  CommunityOrganizationRepository,
} from '@novu/dal';
import {
  ApiServiceLevelEnum,
  ExecutionDetailsSourceEnum,
  ExecutionDetailsStatusEnum,
  FeatureFlagsKeysEnum,
  FeatureNameEnum,
  getFeatureForTierAsNumber,
  JobStatusEnum,
  MessagesDeliveryStatusEnum,
} from '@novu/shared';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { SnoozeNotificationCommand } from './snooze-notification.command';
import { MarkNotificationAs } from '../mark-notification-as/mark-notification-as.usecase';
import { MarkNotificationAsCommand } from '../mark-notification-as/mark-notification-as.command';

@Injectable()
export class SnoozeNotification {
  private readonly logger = new Logger(SnoozeNotification.name);

  constructor(
    private messageRepository: MessageRepository,
    private jobRepository: JobRepository,
    private standardQueueService: StandardQueueService,
    private organizationRepository: CommunityOrganizationRepository,
    private createExecutionDetails: CreateExecutionDetails,
    private markNotificationAs: MarkNotificationAs,
    private featureFlagsService: FeatureFlagsService
  ) {}

  public async execute(command: SnoozeNotificationCommand) {
    await this.isSnoozeEnabled(command);
    const transactionId = uuidv4();

    /*
     * TODO: test errorm.essage , error.stack
     * TODO: inbox sorted by createdAt, when notif unsoozed it needs to be on top
     */

    const originalMessage = await this.findOriginalMessage(command);
    const delayAmount = this.calculateDelayInMs(command.snoozeUntil);
    // await this.validateDelayDuration(command, delayAmount);

    try {
      const originalJob = await this.findOriginalJob(command, originalMessage._jobId);

      let scheduledJob = {} as JobEntity;
      let scheduledMessage = {} as MessageEntity;

      await this.messageRepository.withTransaction(async () => {
        scheduledJob = await this.createScheduledJob(originalJob, transactionId, delayAmount);
        await this.snoozeOriginalMessage(command);
        scheduledMessage = await this.createScheduledMessage(
          originalMessage,
          scheduledJob._id,
          transactionId,
          command.snoozeUntil
        );
      });

      await this.queueJob(scheduledJob, 10_000);

      await this.handleSnoozeSuccess(scheduledJob, {
        snoozeOriginMessageId: originalMessage._id,
        scheduledMessageId: scheduledMessage._id,
        delayInMs: delayAmount,
        snoozeUntil: command.snoozeUntil,
      });
    } catch (error) {
      await this.handleSnoozeError(command, error, transactionId);
      throw new InternalServerErrorException(`Failed to snooze notification: ${error.message}`);
    }
  }

  public async queueJob(job: JobEntity, delay: number) {
    this.logger.verbose(`Adding deferred job ${job._id} to Standard Queue`);

    const jobData = {
      _environmentId: job._environmentId,
      _id: job._id,
      _organizationId: job._organizationId,
      _userId: job._userId,
    };

    await this.standardQueueService.add({
      name: job._id,
      data: jobData,
      groupId: job._organizationId,
      options: { delay },
    });
  }

  private async isSnoozeEnabled(command: SnoozeNotificationCommand) {
    const isSnoozeEnabled = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_SNOOZE_ENABLED,
      defaultValue: true,
      organization: { _id: command.organizationId } as OrganizationEntity,
      environment: { _id: command.environmentId } as EnvironmentEntity,
      user: { _id: command.subscriberId } as UserEntity,
    });

    if (!isSnoozeEnabled) {
      throw new NotImplementedException();
    }

    // TODO: add per environment feature on/off on integration settings
  }

  private calculateDelayInMs(snoozeUntil: Date): number {
    return snoozeUntil.getTime() - new Date().getTime();
  }

  private async validateDelayDuration(command: SnoozeNotificationCommand, delay: number) {
    const tierLimit = await this.getTierLimit(command);

    if (delay > tierLimit) {
      throw new HttpException('Payment Required', 402);
    }
  }

  private async getTierLimit(command: SnoozeNotificationCommand) {
    const organization = await this.organizationRepository.findOne({
      _id: command.organizationId,
    });

    const systemLimitMs = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.MAX_DEFER_DURATION_IN_MS_NUMBER,
      defaultValue: SYSTEM_LIMITS.DEFER_DURATION_MS,
      environment: { _id: command.environmentId },
      organization: { _id: command.organizationId },
    });

    const isSpecialLimit = systemLimitMs !== SYSTEM_LIMITS.DEFER_DURATION_MS;
    if (isSpecialLimit) {
      return systemLimitMs;
    }

    const tierLimitMs = getFeatureForTierAsNumber(
      FeatureNameEnum.PLATFORM_MAX_SNOOZE_DURATION,
      organization?.apiServiceLevel || ApiServiceLevelEnum.FREE,
      true
    );

    return Math.min(systemLimitMs, tierLimitMs);
  }

  private async findOriginalMessage(command: SnoozeNotificationCommand): Promise<MessageEntity> {
    const message = await this.messageRepository.findOne({
      _id: command.notificationId,
      _environmentId: command.environmentId,
    });

    if (!message) {
      throw new NotFoundException(`Notification id: "${command.notificationId}" not found`);
    }

    return message;
  }

  private async findOriginalJob(command: SnoozeNotificationCommand, jobId: string): Promise<JobEntity> {
    const job = await this.jobRepository.findOne({
      _id: jobId,
      _environmentId: command.environmentId,
    });

    if (!job) {
      throw new InternalServerErrorException(`Job id: "${jobId}" not found`);
    }

    return job;
  }

  private async createScheduledJob(originalJob: JobEntity, transactionId: string, delay: number): Promise<JobEntity> {
    const newJobData = {
      ...originalJob,
      transactionId,
      status: JobStatusEnum.PENDING,
      delay,
      createdAt: Date.now().toString(),
      id: new Types.ObjectId(),
      _parentId: null,
      payload: {
        ...originalJob.payload,
        snooze: true,
      },
    };

    return this.jobRepository.create(newJobData);
  }

  private async snoozeOriginalMessage(command: SnoozeNotificationCommand) {
    await this.markNotificationAs.execute(
      MarkNotificationAsCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        subscriberId: command.subscriberId,
        notificationId: command.notificationId,
        isSnoozeOrigin: true,
      })
    );
  }

  private async createScheduledMessage(
    originalMessage: MessageEntity,
    newJobId: string,
    transactionId: string,
    snoozeUntil: Date
  ): Promise<MessageEntity> {
    return this.messageRepository.create({
      ...originalMessage,
      id: new Types.ObjectId(),
      transactionId,
      _jobId: newJobId,
      isSnoozeOrigin: false,
      seen: false,
      read: false,
      archived: false,
      status: MessagesDeliveryStatusEnum.SCHEDULED,
      scheduledDate: snoozeUntil.toISOString(),
      _snoozeOriginMessageId: originalMessage._id,
      lastSeenDate: null,
      lastReadDate: null,
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString(),
    });
  }

  private async handleSnoozeError(command: SnoozeNotificationCommand, error: Error, transactionId: string) {
    this.logger.error(`Failed to snooze notification: ${error.message}`, error.stack);

    await this.createExecutionDetails.execute(
      CreateExecutionDetailsCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        notificationId: command.notificationId,
        detail: DetailEnum.MESSAGE_SNOOZE_FAILED,
        source: ExecutionDetailsSourceEnum.INTERNAL,
        status: ExecutionDetailsStatusEnum.FAILED,
        isTest: false,
        isRetry: false,
        raw: JSON.stringify({
          error: error.message,
          snoozeUntil: command.snoozeUntil.toISOString(),
          notificationId: command.notificationId,
        }),
        transactionId,
        subscriberId: command.subscriberId,
      })
    );
  }

  private async handleSnoozeSuccess(
    scheduledJob: JobEntity,
    data: {
      snoozeOriginMessageId: string;
      scheduledMessageId: string;
      delayInMs: number;
      snoozeUntil: Date;
    }
  ) {
    await this.createExecutionDetails.execute(
      CreateExecutionDetailsCommand.create({
        ...CreateExecutionDetailsCommand.getDetailsFromJob(scheduledJob),
        detail: DetailEnum.MESSAGE_SNOOZED,
        source: ExecutionDetailsSourceEnum.INTERNAL,
        status: ExecutionDetailsStatusEnum.PENDING,
        isTest: false,
        isRetry: false,
        raw: JSON.stringify({ data }),
      })
    );
  }
}
