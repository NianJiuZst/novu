import { ApiProperty } from '@nestjs/swagger';

export class RemoveSubscribersBulkResponseDto {
  @ApiProperty({
    description: 'Indicates whether the operation was acknowledged by the server',
    example: true,
  })
  acknowledged: boolean;

  @ApiProperty({
    description: 'Status of the bulk subscriber removal operation',
    example: 'deleted',
  })
  status: string;

  @ApiProperty({
    description: 'Number of subscribers successfully deleted',
    example: 5,
  })
  deletedCount: number;
}
