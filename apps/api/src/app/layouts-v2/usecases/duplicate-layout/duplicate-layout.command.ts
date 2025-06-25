import { IsDefined, IsString } from 'class-validator';
import { LayoutId } from '../../../layouts/types';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class DuplicateLayoutCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsDefined()
  sourceLayoutId: LayoutId;

  @IsString()
  @IsDefined()
  name: string;

  @IsString()
  @IsDefined()
  identifier: string;
}
