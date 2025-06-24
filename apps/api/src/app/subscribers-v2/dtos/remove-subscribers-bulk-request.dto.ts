import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class RemoveSubscribersBulkRequestDto {
  @ApiProperty({
    description: 'Array of subscriber IDs to delete',
    type: [String],
    example: ['subscriber1', 'subscriber2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  subscriberIds: string[];
}
