import { IsDefined, IsOptional, IsString } from 'class-validator';

export class SubscriberSessionRequestDto {
  @IsString()
  @IsOptional()
  readonly applicationIdentifier?: string;

  @IsString()
  @IsDefined()
  readonly subscriberId: string;

  @IsString()
  @IsOptional()
  readonly subscriberHash?: string;
}
