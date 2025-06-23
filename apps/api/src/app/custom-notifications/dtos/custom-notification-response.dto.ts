import { ApiProperty } from '@nestjs/swagger';

export class CustomNotificationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the custom notification',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'The custom notification query describing what the user wants to be notified about',
    example: 'Notify me about critical security issues in production environments',
  })
  query: string;

  @ApiProperty({
    description: 'The content template for the notification that will be delivered to the user',
    example: 'Security Alert: {{eventContext.alertType}} detected in {{eventContext.environment}}',
  })
  content: string;

  @ApiProperty({
    description: 'Whether this custom notification is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Whether this is a one-time notification that will be deactivated after being triggered',
    example: false,
  })
  isOneTime: boolean;

  @ApiProperty({
    description: 'When this one-time notification was completed/triggered (null if not completed)',
    example: null,
    nullable: true,
  })
  completedAt: Date | null;

  @ApiProperty({
    description: 'When this custom notification was created',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When this custom notification was last updated',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;
}
