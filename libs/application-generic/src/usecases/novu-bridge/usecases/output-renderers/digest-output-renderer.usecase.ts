import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DigestRenderOutput } from '@novu/shared';
import { InstrumentUsecase } from '../../../../instrumentation';
import { RenderCommand } from './render-command';

@Injectable()
export class DigestOutputRendererUsecase {
  @InstrumentUsecase()
  execute(renderCommand: RenderCommand): DigestRenderOutput {
    const { skip, ...outputControls } = renderCommand.controlValues ?? {};

    return outputControls as any;
  }
}
