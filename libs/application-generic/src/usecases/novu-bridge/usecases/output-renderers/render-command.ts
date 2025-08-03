import { LAYOUT_CONTENT_VARIABLE } from '@novu/shared';
import { BaseCommand } from '../../../../commands';

export class RenderCommand extends BaseCommand {
  controlValues: Record<string, unknown>;
  fullPayloadForRender: FullPayloadForRender;
}
export class FullPayloadForRender {
  subscriber: Record<string, unknown>;
  payload: Record<string, unknown>;
  steps: Record<string, unknown>; // step.stepId.unknown
  // this variable is used to pass the layout content to the renderer
  [LAYOUT_CONTENT_VARIABLE]?: string;
}
