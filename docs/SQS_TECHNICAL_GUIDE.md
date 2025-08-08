# SQS Integration Technical Implementation Guide

This document provides technical details for developers working with the SQS queue integration in Novu.

## Architecture Overview

### Core Components

```typescript
// Queue Provider Interface - Abstraction layer
interface IQueueProvider {
  add(params: IJobParams): Promise<void>;
  addBulk(data: IBulkJobParams[]): Promise<void>;
  gracefulShutdown(): Promise<void>;
  createWorker(topic: JobTopicNameEnum, processor: QueueProcessor): void;
}

// Queue Provider Factory - Provider selection
class QueueProviderFactory {
  async createProvider(topic: JobTopicNameEnum): Promise<IQueueProvider>
  async createSecondaryProvider(topic: JobTopicNameEnum, primaryProvider: IQueueProvider): Promise<IQueueProvider | undefined>
}

// Enhanced Queue Base Service - Backward compatible queue service
class QueueBaseService {
  // Maintains backward compatibility while adding SQS support
}
```

### Provider Implementations

#### SqsQueueProvider

Implements the `IQueueProvider` interface using AWS SQS:

```typescript
class SqsQueueProvider implements IQueueProvider {
  private sqsClient: SQSClient;
  private consumers: Map<string, Consumer> = new Map();
  
  // Key features:
  // - Handles SQS message format conversion
  // - Manages sqs-consumer instances for each topic
  // - Enforces 15-minute delay limit
  // - Supports batch operations up to 10 messages
  // - Comprehensive error handling and logging
}
```

#### BullMqQueueProvider

Wraps the existing BullMQ service to implement `IQueueProvider`:

```typescript
class BullMqQueueProvider implements IQueueProvider {
  private bullMqServices: Map<JobTopicNameEnum, BullMqService> = new Map();
  
  // Key features:
  // - Adapter pattern for existing BullMQ functionality
  // - Maintains per-topic BullMQ service instances
  // - Preserves all BullMQ features and options
  // - Backward compatible with existing code
}
```

## Job Routing Logic

### Delay-Based Routing

```typescript
private async addWithNewSystem(params: IJobParams): Promise<void> {
  const hasDelay = params.options?.delay && params.options.delay > 0;
  const exceedsSqsLimit = hasDelay && params.options.delay > 900000; // 15 minutes

  try {
    // Route delayed jobs > 15 minutes to BullMQ if primary provider is SQS
    if (exceedsSqsLimit && this.primaryProvider instanceof SqsQueueProvider) {
      Logger.log(`Job ${params.name} has delay ${params.options.delay}ms (> 15 min), routing to BullMQ`);
      await this.getBullMqProvider().add(providerParams);
      return;
    }

    // Process with primary provider
    await this.primaryProvider.add(providerParams);
    
    // Dual mode: also write to secondary provider
    if (this.isDualMode && this.secondaryProvider) {
      await this.secondaryProvider.add(providerParams);
    }
  } catch (error) {
    if (error instanceof SqsDelayLimitExceededException) {
      // Fallback to BullMQ for delayed jobs
      await this.getBullMqProvider().add(providerParams);
    } else {
      throw error;
    }
  }
}
```

### Provider Selection Algorithm

```typescript
async createProvider(topic: JobTopicNameEnum): Promise<IQueueProvider> {
  const queueProvider = process.env.QUEUE_PROVIDER || 'bullmq';
  const isSqsEnabled = await this.featureFlagsService.getFlag({
    key: FeatureFlagsKeysEnum.IS_SQS_QUEUE_ENABLED,
    defaultValue: false,
  });

  // Community edition always uses BullMQ
  if (this.isCommunityEdition()) {
    return this.getBullMqProvider();
  }

  // Use SQS only if explicitly enabled and configured
  if (queueProvider === 'sqs' && isSqsEnabled && this.isSqsConfigured()) {
    return this.getSqsProvider();
  }

  return this.getBullMqProvider();
}
```

## Message Format

### SQS Message Structure

```typescript
interface SqsMessage {
  QueueUrl: string;
  MessageBody: string; // JSON.stringify(jobData)
  DelaySeconds: number; // Max 900 (15 minutes)
  MessageAttributes: {
    jobName: { DataType: 'String', StringValue: string };
    groupId: { DataType: 'String', StringValue: string };
    attempts: { DataType: 'Number', StringValue: string };
    topic: { DataType: 'String', StringValue: JobTopicNameEnum };
    backoffType?: { DataType: 'String', StringValue: string };
    backoffDelay?: { DataType: 'Number', StringValue: string };
  };
}
```

### BullMQ Message Structure (Unchanged)

```typescript
interface BullMqJob {
  name: string;
  data: any;
  opts: {
    delay?: number;
    attempts?: number;
    backoff?: BackoffOptions;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
    // ... other BullMQ options
  };
}
```

## Worker Implementation

### Enhanced Worker Base Service

```typescript
class EnhancedWorkerBaseService {
  protected async initWorker(processor: QueueProcessor, workerOptions?: any): Promise<void> {
    if (this.isEnhancedMode && this.dualQueueWorker) {
      // Use enhanced dual queue worker
      await this.dualQueueWorker.initialize(this.topic, processor);
    } else {
      // Fallback to legacy BullMQ worker
      await this.initLegacyWorker(processor, workerOptions);
    }
  }
}
```

### Dual Queue Worker

```typescript
class DualQueueWorkerService {
  async initialize(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    if (this.isDualMode) {
      await this.initializeBothWorkers(topic, processor);
    } else {
      await this.initializeSingleWorker(topic, processor);
    }
  }

  private async initializeBothWorkers(topic: JobTopicNameEnum, processor: QueueProcessor): Promise<void> {
    this.primaryProvider = await this.queueProviderFactory.createProvider(topic);
    this.secondaryProvider = await this.queueProviderFactory.createSecondaryProvider(topic, this.primaryProvider);

    this.primaryProvider.createWorker(topic, processor);
    if (this.secondaryProvider) {
      this.secondaryProvider.createWorker(topic, processor);
    }
  }
}
```

## Error Handling

### Exception Types

```typescript
class SqsDelayLimitExceededException extends Error {
  constructor(public readonly requestedDelay: number) {
    super(`SQS delay limit exceeded. Requested: ${requestedDelay}ms, Max: 900000ms (15 minutes)`);
  }
}
```

### Error Recovery Patterns

1. **Provider Initialization Failure**
   ```typescript
   try {
     this.primaryProvider = await this.queueProviderFactory.createProvider(this.topic);
   } catch (error) {
     Logger.error(`Failed to initialize queue providers: ${error.message}`);
     // Fallback to legacy BullMQ
     this.primaryProvider = undefined;
   }
   ```

2. **SQS Delay Limit Exceeded**
   ```typescript
   try {
     await this.primaryProvider.add(params);
   } catch (error) {
     if (error instanceof SqsDelayLimitExceededException) {
       // Route to BullMQ for delayed jobs
       await this.getBullMqProvider().add(params);
     } else {
       throw error;
     }
   }
   ```

3. **Secondary Provider Failure (Dual Mode)**
   ```typescript
   if (this.isDualMode && this.secondaryProvider) {
     try {
       await this.secondaryProvider.add(params);
     } catch (error) {
       Logger.error(`Secondary queue failed: ${error.message}`);
       // Don't fail the operation - continue with primary only
     }
   }
   ```

## Configuration Management

### Environment Variable Validation

```typescript
export const envValidators = {
  QUEUE_PROVIDER: str({ choices: ['bullmq', 'sqs'], default: 'bullmq' }),
  AWS_SQS_REGION: str({ default: 'us-east-1' }),
  AWS_SQS_ACCESS_KEY_ID: str({ default: '' }),
  AWS_SQS_SECRET_ACCESS_KEY: str({ default: '' }),
  AWS_SQS_QUEUE_URL_PREFIX: str({ default: '' }),
  // ... other SQS config
  ENABLE_DUAL_QUEUE_PROCESSING: bool({ default: false }),
};
```

### SQS Configuration Factory

```typescript
export function createSqsConfig(): SqsConfig {
  return {
    region: process.env.AWS_SQS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_SQS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SQS_SECRET_ACCESS_KEY || '',
    queueUrlPrefix: process.env.AWS_SQS_QUEUE_URL_PREFIX || '',
    // ... other config mapping
  };
}
```

## Testing Strategies

### Unit Testing

```typescript
describe('SqsQueueProvider', () => {
  let service: SqsQueueProvider;
  let mockSqsClient: MockedSQSClient;

  beforeEach(() => {
    mockSqsClient = mockClient(SQSClient);
    service = new SqsQueueProvider(mockConfig);
  });

  it('should send message to SQS', async () => {
    mockSqsClient.on(SendMessageCommand).resolves({});
    
    await service.add(testJobParams);
    
    expect(mockSqsClient).toHaveReceivedCommandWith(SendMessageCommand, {
      QueueUrl: expect.stringContaining('novu-standard-queue'),
      MessageBody: JSON.stringify(testJobParams.data),
    });
  });
});
```

### Integration Testing

```typescript
describe('Queue Routing Integration', () => {
  it('should route delayed jobs to BullMQ when using SQS', async () => {
    process.env.QUEUE_PROVIDER = 'sqs';
    process.env.IS_SQS_QUEUE_ENABLED = 'true';
    
    const job = {
      name: 'delayed-job',
      data: { test: 'data' },
      options: { delay: 3600000 }, // 1 hour
    };
    
    await queueService.add(job);
    
    // Verify job is in BullMQ, not SQS
    expect(bullMqAddSpy).toHaveBeenCalled();
    expect(sqsAddSpy).not.toHaveBeenCalled();
  });
});
```

## Performance Considerations

### Batch Optimization

```typescript
private async sendBatch(topic: JobTopicNameEnum, jobs: IBulkJobParams[]) {
  // SQS batch limit is 10 messages
  const chunks = this.chunkArray(jobs, 10);
  
  for (const chunk of chunks) {
    const entries = chunk.map((job, index) => ({
      Id: `${index}`,
      MessageBody: JSON.stringify(job.data),
      // ... other message attributes
    }));

    await this.sqsClient.send(new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: entries,
    }));
  }
}
```

### Consumer Configuration

```typescript
const consumer = Consumer.create({
  queueUrl,
  sqs: this.sqsClient,
  batchSize: this.config.batchSize, // Default: 10
  visibilityTimeout: this.config.visibilityTimeout, // Default: 30s
  waitTimeSeconds: this.config.pollingWaitTime, // Default: 20s (long polling)
  handleMessageBatch: async (messages) => {
    // Process messages in parallel for better throughput
    await Promise.all(messages.map(processor));
  },
});
```

## Monitoring and Observability

### Structured Logging

```typescript
Logger.verbose(`Job ${params.name} added to SQS queue ${params.topic}`, LOG_CONTEXT);
Logger.warn(`Job ${params.name} has delay > 15 minutes, routing to BullMQ`, LOG_CONTEXT);
Logger.error(`Failed to add job ${params.name} to SQS: ${error.message}`, error.stack, LOG_CONTEXT);
```

### Metrics Collection

```typescript
public async getQueueDepth(topic: JobTopicNameEnum): Promise<number> {
  const queueUrl = this.getQueueUrl(topic);
  
  const command = new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: ['ApproximateNumberOfMessages'],
  });
  
  const result = await this.sqsClient.send(command);
  return parseInt(result.Attributes?.ApproximateNumberOfMessages || '0');
}
```

## Extension Points

### Custom Queue Providers

To add a new queue provider, implement the `IQueueProvider` interface:

```typescript
class CustomQueueProvider implements IQueueProvider {
  async add(params: IJobParams): Promise<void> {
    // Custom implementation
  }
  
  async addBulk(data: IBulkJobParams[]): Promise<void> {
    // Custom implementation
  }
  
  async gracefulShutdown(): Promise<void> {
    // Custom implementation
  }
  
  createWorker(topic: JobTopicNameEnum, processor: QueueProcessor): void {
    // Custom implementation
  }
}
```

Then register it in the `QueueProviderFactory`:

```typescript
// In QueueProviderFactory.createProvider()
if (queueProvider === 'custom') {
  return new CustomQueueProvider(customConfig);
}
```

### Custom Job Routing

Extend the routing logic in `QueueBaseService`:

```typescript
private async addWithNewSystem(params: IJobParams): Promise<void> {
  // Custom routing logic
  if (this.shouldRouteToSpecialProvider(params)) {
    await this.specialProvider.add(params);
    return;
  }
  
  // Default routing logic
  // ...
}
```

## Migration Patterns

### Gradual Rollout

```typescript
// Phase 1: Dual mode, BullMQ primary
QUEUE_PROVIDER=bullmq
ENABLE_DUAL_QUEUE_PROCESSING=true
IS_SQS_QUEUE_ENABLED=false

// Phase 2: Dual mode, SQS primary  
QUEUE_PROVIDER=sqs
ENABLE_DUAL_QUEUE_PROCESSING=true
IS_SQS_QUEUE_ENABLED=true

// Phase 3: SQS only
QUEUE_PROVIDER=sqs
ENABLE_DUAL_QUEUE_PROCESSING=false
IS_SQS_QUEUE_ENABLED=true
```

### Feature Flag Integration

```typescript
const isSqsEnabled = await this.featureFlagsService.getFlag({
  key: FeatureFlagsKeysEnum.IS_SQS_QUEUE_ENABLED,
  defaultValue: false,
  organizationId: context.organizationId,
  environmentId: context.environmentId,
  userId: context.userId,
});
```

This allows for:
- Organization-specific rollouts
- Environment-specific configuration
- User-specific testing
- Instant rollback capabilities

---

This technical guide should help developers understand the implementation details and extend the SQS integration as needed.
