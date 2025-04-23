import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class FilterTopicsCommand extends EnvironmentCommand {
  @IsArray()
  @IsOptional()
  keys?: string[];

  @IsOptional()
  @IsBoolean()
  shouldReturnSubscriberList?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  pageSize?: number = 10;

  @ApiProperty({
    example: 'someSubscriberId',
    required: false,
    type: 'string',
    description: 'filter By Topics Assigned To Subscriber Id',
  })
  @IsString()
  @IsOptional()
  public subscriberId?: string;
}
