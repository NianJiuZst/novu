import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, ValidateIf } from 'class-validator';

class MarkMessageFields {
  @ApiPropertyOptional({
    type: Boolean,
  })
  seen?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
  })
  read?: boolean;
}

export class MarkMessageAsRequestDto {
  @ApiProperty({
    oneOf: [
      { type: 'string' },
      {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    ],
  })
  @ValidateIf((o) => Array.isArray(o.messageId))
  @IsMongoId({ each: true })
  @ValidateIf((o) => typeof o.messageId === 'string')
  @IsMongoId()
  messageId: string | string[];

  @ApiProperty({
    type: MarkMessageFields,
  })
  mark: MarkMessageFields;
}
