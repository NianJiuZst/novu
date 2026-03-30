import { ApiProperty } from '@nestjs/swagger';

export class DeleteAgentResponseDto {
  @ApiProperty()
  acknowledged: boolean;

  @ApiProperty()
  status: string;
}
