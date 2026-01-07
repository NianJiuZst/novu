import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InstrumentUsecase, PinoLogger } from '@novu/application-generic';
import { LocalizationResourceEnum, NotificationTemplateEntity } from '@novu/dal';
import { SmsRenderOutput } from '@novu/shared';
import { BaseTranslationRendererUsecase } from './base-translation-renderer.usecase';
import { RenderCommand } from './render-command';

export class SmsOutputRendererCommand extends RenderCommand {
  dbWorkflow: NotificationTemplateEntity;
  locale?: string;
}

@Injectable()
export class SmsOutputRendererUsecase extends BaseTranslationRendererUsecase {
  constructor(
    protected moduleRef: ModuleRef,
    protected logger: PinoLogger
  ) {
    super(moduleRef, logger);
  }

  @InstrumentUsecase()
  async execute(renderCommand: SmsOutputRendererCommand): Promise<SmsRenderOutput> {
    const outputControls = renderCommand.controlValues ?? {};
    delete outputControls['skip'];
    const { _environmentId, _organizationId, _id: workflowId } = renderCommand.dbWorkflow;

    const translatedControls = await this.processTranslations({
      controls: outputControls,
      variables: renderCommand.fullPayloadForRender,
      environmentId: _environmentId,
      organizationId: _organizationId,
      resourceId: workflowId,
      resourceType: LocalizationResourceEnum.WORKFLOW,
      locale: renderCommand.locale,
      resourceEntity: renderCommand.dbWorkflow,
      organization: renderCommand.organization,
    });

    const body = translatedControls['body'];

    return {
      body: typeof body === 'string' ? body : '',
    };
  }
}
