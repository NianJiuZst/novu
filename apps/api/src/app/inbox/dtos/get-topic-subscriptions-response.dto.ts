import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicDto {
  @ApiProperty({
    description: 'The internal unique identifier of the topic',
    example: '64f5e95d3d7946d80d0cb677',
  })
  _id: string;

  @ApiProperty({
    description: 'The key identifier of the topic',
    example: 'product-updates',
  })
  key: string;

  @ApiPropertyOptional({
    description: 'The name of the topic',
    example: 'Product Updates',
  })
  name?: string;
}

export class SubscriberDto {
  @ApiProperty({
    description: 'The unique identifier of the subscriber',
    example: '64f5e95d3d7946d80d0cb678',
  })
  _id: string;

  @ApiProperty({
    description: 'The external identifier of the subscriber',
    example: 'external-subscriber-id',
  })
  subscriberId: string;

  @ApiPropertyOptional({
    description: 'The avatar URL of the subscriber',
    example: 'https://example.com/avatar.png',
  })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'The first name of the subscriber',
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'The last name of the subscriber',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'The email of the subscriber',
    example: 'john.doe@example.com',
  })
  email?: string;
}

export class SubscriptionWorkflowDto {
  @ApiProperty({
    description: 'The workflow identifier',
    example: 'workflow-1',
  })
  id: string;

  @ApiProperty({
    description: 'The workflow name',
    example: 'Welcome Email',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the workflow is enabled for this subscription',
    example: true,
  })
  enabled: boolean;
}

export class TopicSubscriptionDto {
  @ApiProperty({
    description: 'The unique identifier of the subscription',
    example: '64f5e95d3d7946d80d0cb679',
  })
  _id: string;

  @ApiProperty({
    description: 'The topic information',
    type: TopicDto,
  })
  topic: TopicDto;

  @ApiProperty({
    description: 'The subscriber information',
    type: SubscriberDto,
  })
  subscriber: SubscriberDto;

  @ApiPropertyOptional({
    description: 'JSONLogic filter conditions for conditional subscription',
    type: 'object',
  })
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'The workflows associated with the subscription',
    type: [SubscriptionWorkflowDto],
  })
  workflows?: SubscriptionWorkflowDto[];

  @ApiProperty({
    description: 'The creation date of the subscription',
    example: '2025-04-24T05:40:21Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'The last update date of the subscription',
    example: '2025-04-24T05:40:21Z',
  })
  updatedAt: string;
}
