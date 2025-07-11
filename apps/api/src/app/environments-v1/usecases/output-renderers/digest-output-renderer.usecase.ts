import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import type { DigestRenderOutput } from '@novu/shared';
import type { RenderCommand } from './render-command';

@Injectable()
export class DigestOutputRendererUsecase {
  @InstrumentUsecase()
  execute(renderCommand: RenderCommand): DigestRenderOutput {
    const { skip, ...outputControls } = renderCommand.controlValues ?? {};

    return outputControls as any;
  }
}
