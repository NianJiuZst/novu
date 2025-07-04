import { ApiProperty } from '@nestjs/swagger';
import { MessagesStatusEnum } from '@novu/shared';
import { IsDefined, IsEnum, IsMongoId } from 'class-validator';

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
  @IsMongoId({ each: true })
  messageId: string | string[];

  @ApiProperty({
    enum: MessagesStatusEnum,
  })
  @IsDefined()
  @IsEnum(MessagesStatusEnum)
  markAs: MessagesStatusEnum;
}
