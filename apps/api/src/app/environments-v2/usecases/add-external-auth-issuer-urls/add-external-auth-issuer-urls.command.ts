import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString, IsUrl } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class AddExternalAuthISsuerUrlsCommand extends EnvironmentWithUserCommand {
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true, message: 'Each external auth issuer URL must be a valid URL' })
  @ArrayMaxSize(5, { message: 'Max 5 URLs allowed' })
  externalAuthIssuerUrls: string[];
}
