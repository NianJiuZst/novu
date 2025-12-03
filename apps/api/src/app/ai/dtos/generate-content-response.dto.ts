import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailContentDto {
  @ApiProperty({ description: 'Email subject line' })
  subject: string;

  @ApiProperty({ description: 'Email body in TipTap JSON format for insertion into editor' })
  body: any;

  @ApiProperty({ description: 'Email body rendered as HTML for preview' })
  bodyHtml: string;
}

export class SmsContentDto {
  @ApiProperty({ description: 'SMS message body' })
  body: string;
}

export class PushContentDto {
  @ApiProperty({ description: 'Push notification title' })
  subject: string;

  @ApiProperty({ description: 'Push notification body' })
  body: string;
}

export class InAppActionDto {
  @ApiProperty({ description: 'Button label' })
  label: string;

  @ApiPropertyOptional({ description: 'Redirect URL' })
  url?: string;
}

export class InAppContentDto {
  @ApiPropertyOptional({ description: 'In-app notification subject' })
  subject?: string;

  @ApiPropertyOptional({ description: 'In-app notification body' })
  body?: string;

  @ApiPropertyOptional({ description: 'Primary action button' })
  primaryAction?: InAppActionDto;

  @ApiPropertyOptional({ description: 'Secondary action button' })
  secondaryAction?: InAppActionDto;
}

export class ChatContentDto {
  @ApiProperty({ description: 'Chat message body' })
  body: string;
}

export type GeneratedContent = EmailContentDto | SmsContentDto | PushContentDto | InAppContentDto | ChatContentDto;

export class GenerateContentResponseDto {
  @ApiProperty({ description: 'AI response message explaining what was generated' })
  aiMessage: string;

  @ApiProperty({ description: 'Generated content specific to the channel type' })
  content: GeneratedContent;

  @ApiPropertyOptional({
    description: 'Suggested sample values for payload variables used in the content',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  suggestedPayload?: Record<string, string>;
}



