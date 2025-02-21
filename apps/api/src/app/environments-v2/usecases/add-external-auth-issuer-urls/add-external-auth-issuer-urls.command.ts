import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString, IsUrl } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class AddExternalAuthISsuerUrlsCommand extends EnvironmentWithUserCommand {
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(5)
  externalAuthIssuerUrls: string[];
}
