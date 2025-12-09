import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class MessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({
    description: 'Content of the message',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
