import { Injectable } from '@nestjs/common';
import { DelayRenderOutput } from '@novu/shared';
import { InstrumentUsecase } from '../../../../instrumentation';
import { RenderCommand } from './render-command';

@Injectable()
export class DelayOutputRendererUsecase {
  @InstrumentUsecase()
  execute(renderCommand: RenderCommand): DelayRenderOutput {
    const { skip, ...outputControls } = renderCommand.controlValues ?? {};

    return outputControls as any;
  }
}
