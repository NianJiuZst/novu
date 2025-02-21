import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SessionGeneratedResponseDto {
  @ApiProperty({
    description: 'JSON Web Token (JWT) for authentication and authorization in the Inbox service',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    type: 'string',
    format: 'jwt',
    required: true,
  })
  @IsNotEmpty({ message: 'JWT cannot be empty' })
  @IsString({ message: 'JWT must be a string' })
  @IsJWT({ message: 'Invalid JWT format' })
  @MinLength(10, { message: 'JWT must be at least 10 characters long' })
  @MaxLength(1000, { message: 'JWT cannot exceed 1000 characters' })
  jwt: string;
}
