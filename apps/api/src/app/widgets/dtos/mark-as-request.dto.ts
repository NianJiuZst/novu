import { ApiProperty } from '@nestjs/swagger';
import { MessagesStatusEnum } from '@novu/shared';
import { IsDefined, IsEnum, IsMongoId, ValidateIf } from 'class-validator';

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
  @ValidateIf((o) => Array.isArray(o.messageId))
  @IsMongoId({ each: true })
  @ValidateIf((o) => typeof o.messageId === 'string')
  @IsMongoId()
  messageId: string | string[];

  @ApiProperty({
    enum: MessagesStatusEnum,
  })
  @IsDefined()
  @IsEnum(MessagesStatusEnum)
  markAs: MessagesStatusEnum;
}
