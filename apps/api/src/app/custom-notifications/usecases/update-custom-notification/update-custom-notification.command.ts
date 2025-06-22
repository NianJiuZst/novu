import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class UpdateCustomNotificationCommand extends EnvironmentWithSubscriber {
  @IsString()
  id: string;

  @IsString()
  @MinLength(10, { message: 'Query must be at least 10 characters long' })
  @MaxLength(500, { message: 'Query must not exceed 500 characters' })
  @IsOptional()
  query?: string;

  @IsString()
  @MinLength(5, { message: 'Content must be at least 5 characters long' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
