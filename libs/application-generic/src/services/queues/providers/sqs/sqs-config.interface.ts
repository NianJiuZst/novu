export interface SqsConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  queueUrlPrefix: string;
  dlqUrlPrefix?: string;
  maxReceiveCount: number;
  visibilityTimeout: number;
  messageRetentionPeriod: number;
  batchSize: number;
  pollingWaitTime: number;
}

export function createSqsConfig(): SqsConfig {
  return {
    region: process.env.AWS_SQS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_SQS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SQS_SECRET_ACCESS_KEY || '',
    queueUrlPrefix: process.env.AWS_SQS_QUEUE_URL_PREFIX || '',
    dlqUrlPrefix: process.env.AWS_SQS_DLQ_URL_PREFIX,
    maxReceiveCount: parseInt(process.env.AWS_SQS_MAX_RECEIVE_COUNT || '3'),
    visibilityTimeout: parseInt(process.env.AWS_SQS_VISIBILITY_TIMEOUT || '30'),
    messageRetentionPeriod: parseInt(process.env.AWS_SQS_MESSAGE_RETENTION_PERIOD || '345600'),
    batchSize: parseInt(process.env.SQS_BATCH_SIZE || '10'),
    pollingWaitTime: parseInt(process.env.SQS_POLLING_WAIT_TIME || '20'),
  };
}
