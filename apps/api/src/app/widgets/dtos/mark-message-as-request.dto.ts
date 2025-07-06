import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { IsMongoIdOrArray } from '../../shared/validators/mongo-id-or-array.validator';

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
  @IsDefined({ message: 'messageId is required' })
  @IsMongoIdOrArray()
  messageId: string | string[];

  @ApiProperty({
    type: MarkMessageFields,
  })
  mark: MarkMessageFields;
}
