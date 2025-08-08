import { GetQueueAttributesCommand, SendMessageBatchCommand, SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { JobTopicNameEnum } from '@novu/shared';
import { Consumer } from 'sqs-consumer';

import { IBulkJobParams, IJobParams, IQueueProvider, QueueProcessor } from '../queue-provider.interface';
import { SqsConfig } from './sqs-config.interface';

const LOG_CONTEXT = 'SqsQueueProvider';

export class SqsDelayLimitExceededException extends Error {
  constructor(public readonly requestedDelay: number) {
    super(`SQS delay limit exceeded. Requested: ${requestedDelay}ms, Max: 900000ms (15 minutes)`);
  }
}

@Injectable()
export class SqsQueueProvider implements IQueueProvider {
  private sqsClient: SQSClient;
  private consumers: Map<string, Consumer> = new Map();
  private queueUrls: Map<JobTopicNameEnum, string> = new Map();

  constructor(private readonly config: SqsConfig) {
    this.initializeClient();
    this.initializeQueueUrls();
  }

  private initializeClient() {
    this.sqsClient = new SQSClient({
      region: this.config.region,
      credentials:
        this.config.accessKeyId && this.config.secretAccessKey
          ? {
              accessKeyId: this.config.accessKeyId,
              secretAccessKey: this.config.secretAccessKey,
            }
          : undefined,
    });

    Logger.log(`SQS client initialized for region: ${this.config.region}`, LOG_CONTEXT);
  }

  private initializeQueueUrls() {
    const prefix = this.config.queueUrlPrefix;

    this.queueUrls.set(JobTopicNameEnum.STANDARD, `${prefix}/novu-standard-queue`);
    this.queueUrls.set(JobTopicNameEnum.WORKFLOW, `${prefix}/novu-workflow-queue`);
    this.queueUrls.set(JobTopicNameEnum.PROCESS_SUBSCRIBER, `${prefix}/novu-subscriber-queue`);
    this.queueUrls.set(JobTopicNameEnum.INBOUND_PARSE_MAIL, `${prefix}/novu-inbound-queue`);
    this.queueUrls.set(JobTopicNameEnum.WEB_SOCKETS, `${prefix}/novu-websockets-queue`);
    this.queueUrls.set(JobTopicNameEnum.ACTIVE_JOBS_METRIC, `${prefix}/novu-metrics-queue`);

    Logger.log(`Initialized SQS queue URLs with prefix: ${prefix}`, LOG_CONTEXT);
  }

  async add(params: IJobParams): Promise<void> {
    const queueUrl = this.getQueueUrl(params.topic);

    // Check if job has delay exceeding SQS limit
    if (params.options?.delay && params.options.delay > 900000) {
      // 15 minutes
      Logger.warn(
        `Job ${params.name} has delay > 15 minutes (${params.options.delay}ms), must use BullMQ`,
        LOG_CONTEXT
      );
      throw new SqsDelayLimitExceededException(params.options.delay);
    }

    const message = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(params.data),
      DelaySeconds: Math.min(params.options?.delay ? Math.floor(params.options.delay / 1000) : 0, 900),
      MessageAttributes: {
        jobName: { DataType: 'String', StringValue: params.name },
        groupId: { DataType: 'String', StringValue: params.groupId || '' },
        attempts: { DataType: 'Number', StringValue: String(params.options?.attempts || 3) },
        topic: { DataType: 'String', StringValue: params.topic },
        ...(params.options?.backoff &&
          typeof params.options.backoff === 'object' && {
            backoffType: { DataType: 'String', StringValue: params.options.backoff.type },
            ...(params.options.backoff.delay && {
              backoffDelay: { DataType: 'Number', StringValue: String(params.options.backoff.delay) },
            }),
          }),
      },
    };

    console.log('message', message);
    try {
      await this.sqsClient.send(new SendMessageCommand(message));
      Logger.verbose(`Job ${params.name} added to SQS queue ${params.topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to add job ${params.name} to SQS: ${errorMessage}`, errorStack, LOG_CONTEXT);
      throw error;
    }
  }

  async addBulk(data: IBulkJobParams[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    // Group jobs by topic and filter out delayed jobs > 15 minutes
    const batchesByTopic = this.groupByTopic(data);

    for (const [topic, jobs] of batchesByTopic.entries()) {
      // Filter out jobs with excessive delays
      const validJobs = jobs.filter((job) => {
        if (job.options?.delay && job.options.delay > 900000) {
          Logger.warn(`Skipping job ${job.name} in bulk operation due to delay > 15 minutes`, LOG_CONTEXT);

          return false;
        }

        return true;
      });

      if (validJobs.length === 0) continue;

      // Process in chunks of 10 (SQS batch limit)
      const chunks = this.chunkArray(validJobs, 10);

      for (const chunk of chunks) {
        await this.sendBatch(topic, chunk);
      }
    }

    Logger.verbose(`Bulk added ${data.length} jobs to SQS`, LOG_CONTEXT);
  }

  private async sendBatch(topic: JobTopicNameEnum, jobs: IBulkJobParams[]) {
    const queueUrl = this.getQueueUrl(topic);

    const entries = jobs.map((job, index) => ({
      Id: `${index}`,
      MessageBody: JSON.stringify(job.data),
      DelaySeconds: job.options?.delay ? Math.min(Math.floor(job.options.delay / 1000), 900) : 0,
      MessageAttributes: {
        jobName: { DataType: 'String', StringValue: job.name },
        groupId: { DataType: 'String', StringValue: job.groupId || '' },
        topic: { DataType: 'String', StringValue: topic },
        attempts: { DataType: 'Number', StringValue: String(job.options?.attempts || 3) },
      },
    }));

    try {
      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      const result = await this.sqsClient.send(command);

      if (result.Failed && result.Failed.length > 0) {
        Logger.error(`${result.Failed.length} messages failed to send in batch for topic ${topic}`, LOG_CONTEXT);
        for (const failed of result.Failed) {
          Logger.error(`Failed message ID ${failed.Id}: ${failed.Message}`, LOG_CONTEXT);
        }
      }

      Logger.verbose(`Sent batch of ${entries.length} messages to topic ${topic}`, LOG_CONTEXT);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to send batch to topic ${topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);
      throw error;
    }
  }

  createWorker(topic: JobTopicNameEnum, processor: QueueProcessor): void {
    const queueUrl = this.getQueueUrl(topic);

    Logger.log(`Creating SQS consumer for topic ${topic}`, LOG_CONTEXT);

    const consumer = Consumer.create({
      queueUrl,
      sqs: this.sqsClient,
      batchSize: this.config.batchSize,
      visibilityTimeout: this.config.visibilityTimeout,
      waitTimeSeconds: this.config.pollingWaitTime,
      handleMessage: async (message) => {
        console.log('HANDLING', message);
        const startTime = Date.now();
        const jobName = message.MessageAttributes?.jobName?.StringValue || 'unknown';
        const messageId = message.MessageId || 'unknown';

        try {
          const jobData = JSON.parse(message.Body || '{}');

          Logger.verbose(`Processing SQS job ${jobName} (${messageId})`, LOG_CONTEXT);
          await processor(jobData);

          const duration = Date.now() - startTime;
          Logger.verbose(`Completed SQS job ${jobName} (${messageId}) in ${duration}ms`, LOG_CONTEXT);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          Logger.error(`Failed to process SQS job ${jobName} (${messageId}): ${errorMessage}`, errorStack, LOG_CONTEXT);
          throw error;
        }
      },
      handleMessageBatch: async (messages) => {
        Logger.verbose(`Processing batch of ${messages.length} SQS messages`, LOG_CONTEXT);

        // Process messages in parallel for better performance
        const processingPromises = messages.map(async (message) => {
          const jobName = message.MessageAttributes?.jobName?.StringValue || 'unknown';
          const messageId = message.MessageId || 'unknown';

          try {
            const jobData = JSON.parse(message.Body || '{}');
            await processor(jobData);
            Logger.verbose(`Completed batch job ${jobName} (${messageId})`, LOG_CONTEXT);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            Logger.error(`Failed batch job ${jobName} (${messageId}): ${errorMessage}`, errorStack, LOG_CONTEXT);
            throw error;
          }
        });

        await Promise.all(processingPromises);
      },
    });

    this.setupConsumerEventHandlers(consumer, topic);

    consumer.start();
    this.consumers.set(topic, consumer);

    Logger.log(`SQS consumer started for topic ${topic}`, LOG_CONTEXT);
  }

  private setupConsumerEventHandlers(consumer: Consumer, topic: JobTopicNameEnum) {
    consumer.on('error', (err) => {
      Logger.error(`SQS Consumer Error for ${topic}: ${err.message}`, err.stack, LOG_CONTEXT);
    });

    consumer.on('processing_error', (err) => {
      Logger.error(`SQS Processing Error for ${topic}: ${err.message}`, err.stack, LOG_CONTEXT);
    });

    consumer.on('timeout_error', (err) => {
      Logger.error(`SQS Timeout Error for ${topic}: ${err.message}`, err.stack, LOG_CONTEXT);
    });

    consumer.on('message_received', () => {
      Logger.verbose(`Message received on topic ${topic}`, LOG_CONTEXT);
    });

    consumer.on('message_processed', () => {
      Logger.verbose(`Message processed on topic ${topic}`, LOG_CONTEXT);
    });

    consumer.on('stopped', () => {
      Logger.log(`SQS consumer stopped for topic ${topic}`, LOG_CONTEXT);
    });

    consumer.on('started', () => {
      Logger.log(`SQS consumer started for topic ${topic}`, LOG_CONTEXT);
    });
  }

  async gracefulShutdown(): Promise<void> {
    Logger.log('Starting SQS graceful shutdown...', LOG_CONTEXT);

    const shutdownPromises = Array.from(this.consumers.entries()).map(async ([topic, consumer]) => {
      try {
        await consumer.stop();
        Logger.log(`Stopped SQS consumer for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        Logger.error(`Error stopping SQS consumer for ${topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);
      }
    });

    await Promise.all(shutdownPromises);
    this.consumers.clear();

    Logger.log('SQS graceful shutdown completed', LOG_CONTEXT);
  }

  private getQueueUrl(topic: JobTopicNameEnum): string {
    const url = this.queueUrls.get(topic);
    if (!url) {
      throw new Error(`No queue URL configured for topic: ${topic}`);
    }

    return url;
  }

  private groupByTopic(jobs: IBulkJobParams[]): Map<JobTopicNameEnum, IBulkJobParams[]> {
    const grouped = new Map<JobTopicNameEnum, IBulkJobParams[]>();

    for (const job of jobs) {
      if (!grouped.has(job.topic)) {
        grouped.set(job.topic, []);
      }
      const topicJobs = grouped.get(job.topic);
      if (topicJobs) {
        topicJobs.push(job);
      }
    }

    return grouped;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }

  public getConsumer(topic: JobTopicNameEnum): Consumer | undefined {
    return this.consumers.get(topic);
  }

  public async getQueueDepth(topic: JobTopicNameEnum): Promise<number> {
    const queueUrl = this.getQueueUrl(topic);

    try {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages'],
      });

      const result = await this.sqsClient.send(command);
      const depth = parseInt(result.Attributes?.ApproximateNumberOfMessages || '0');

      Logger.verbose(`Queue depth for ${topic}: ${depth}`, LOG_CONTEXT);

      return depth;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      Logger.error(`Failed to get queue depth for ${topic}: ${errorMessage}`, errorStack, LOG_CONTEXT);

      return 0;
    }
  }

  /**
   * Pause all SQS consumers
   */
  async pause(): Promise<void> {
    const pausePromises = Array.from(this.consumers.entries()).map(async ([topic, consumer]) => {
      try {
        consumer.stop();
        Logger.log(`SQS consumer paused for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Failed to pause SQS consumer for ${topic}: ${errorMessage}`, LOG_CONTEXT);
      }
    });

    await Promise.all(pausePromises);
    Logger.log('All SQS consumers paused', LOG_CONTEXT);
  }

  /**
   * Resume all SQS consumers
   */
  async resume(): Promise<void> {
    const resumePromises = Array.from(this.consumers.entries()).map(async ([topic, consumer]) => {
      try {
        consumer.start();
        Logger.log(`SQS consumer resumed for topic: ${topic}`, LOG_CONTEXT);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Failed to resume SQS consumer for ${topic}: ${errorMessage}`, LOG_CONTEXT);
      }
    });

    await Promise.all(resumePromises);
    Logger.log('All SQS consumers resumed', LOG_CONTEXT);
  }
}
