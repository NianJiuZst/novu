import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateCustomNotificationDto {
  @ApiPropertyOptional({
    description: 'The custom notification query describing what the user wants to be notified about',
    example: 'Notify me about critical security issues in production environments',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10, { message: 'Query must be at least 10 characters long' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Whether this custom notification is enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
