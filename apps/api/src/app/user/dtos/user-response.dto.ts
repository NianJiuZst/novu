import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IUserEntity, JobTitleEnum } from '@novu/shared';

export class ServicesHashesDto {
  @ApiPropertyOptional()
  plain?: string;
}

export class UserResponseDto implements IUserEntity {
  @ApiProperty()
  _id: string;

  @ApiPropertyOptional()
  resetToken?: string;

  @ApiPropertyOptional()
  resetTokenDate?: string;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  profilePicture?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  showOnBoarding?: boolean;

  @ApiPropertyOptional()
  servicesHashes?: ServicesHashesDto;

  @ApiPropertyOptional({
    enum: JobTitleEnum,
  })
  jobTitle?: JobTitleEnum;

  @ApiProperty()
  hasPassword: boolean;
}
