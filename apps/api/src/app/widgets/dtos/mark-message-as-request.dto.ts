import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateBy, IsDefined } from 'class-validator';
import { Types } from 'mongoose';

// Custom validator for messageId that can be string or string[]
function IsMessageId() {
  return ValidateBy({
    name: 'isMessageId',
    validator: {
      validate(value: any): boolean {
        if (typeof value === 'string') {
          return Types.ObjectId.isValid(value);
        }
        if (Array.isArray(value)) {
          return value.every(id => typeof id === 'string' && Types.ObjectId.isValid(id));
        }
        return false;
      },
      defaultMessage(): string {
        return 'messageId must be a valid MongoDB ObjectId or an array of valid MongoDB ObjectIds';
      },
    },
  });
}

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
  @IsDefined()
  @IsMessageId()
  messageId: string | string[];

  @ApiProperty({
    type: MarkMessageFields,
  })
  mark: MarkMessageFields;
}
