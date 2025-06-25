import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class DuplicateLayoutRequestDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  name: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  identifier: string;
}

export class DuplicateLayoutResponseDto {
  @ApiProperty()
  _id: string;
}
