import { EnvironmentLevelCommand } from '@novu/application-generic';
import { IsDefined, IsEnum, IsObject, IsString } from 'class-validator';
import { PostActionEnum, Workflow } from '@novu/framework/internal';

export class ConstructFrameworkWorkflowCommand extends EnvironmentLevelCommand {
  @IsString()
  @IsDefined()
  workflowId: string;

  @IsObject()
  @IsDefined()
  controlValues: Record<string, unknown>;

  @IsObject()
  @IsDefined()
  workflow?: Record<string, unknown>;

  @IsEnum(PostActionEnum)
  action: PostActionEnum;
}
