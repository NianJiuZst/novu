import { ApiProperty } from '@nestjs/swagger';

export class GetSignedUrlResponseDto {
  @ApiProperty()
  signedUrl: string;
  @ApiProperty()
  path: string;
  @ApiProperty()
  additionalHeaders?: Record<string, string>;
}
