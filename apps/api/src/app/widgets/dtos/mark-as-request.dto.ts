import { ApiProperty } from '@nestjs/swagger';
import { MessagesStatusEnum } from '@novu/shared';
import { IsDefined, IsEnum } from 'class-validator';
import { IsMongoIdOrArray } from '../../shared/validators/mongo-id-or-array.validator';

export class MessageMarkAsRequestDto {
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
    enum: MessagesStatusEnum,
  })
  @IsDefined()
  @IsEnum(MessagesStatusEnum)
  markAs: MessagesStatusEnum;
}
