import { EnvironmentWithUserObjectCommand } from '@novu/application-generic';
import type { GeneratePreviewRequestDto } from '../../dtos';

export class PreviewCommand extends EnvironmentWithUserObjectCommand {
  workflowIdOrInternalId: string;
  stepIdOrInternalId: string;
  generatePreviewRequestDto: GeneratePreviewRequestDto;
}
