import { EnvironmentLevelCommand } from '@novu/application-generic';
import { PostActionEnum } from '@novu/framework/internal';
import { IsDefined, IsEnum, IsObject, IsString } from 'class-validator';

export class ConstructFrameworkWorkflowCommand extends EnvironmentLevelCommand {
  @IsString()
  @IsDefined()
  workflowId: string;

  @IsObject()
  @IsDefined()
  controlValues: Record<string, unknown>;

  @IsEnum(PostActionEnum)
  action: PostActionEnum;
}
