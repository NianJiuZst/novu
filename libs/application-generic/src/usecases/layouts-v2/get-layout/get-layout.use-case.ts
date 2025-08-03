import { Injectable } from '@nestjs/common';

import { ControlValuesRepository } from '@novu/dal';
import { ControlValuesLevelEnum, LayoutResponseDto, ResourceOriginEnum, ResourceTypeEnum } from '@novu/shared';
import { AnalyticsService } from '../../../services';
import { GetLayoutUseCase as GetLayoutUseCaseV1 } from '../get-layout';
import { GetLayoutCommand as GetLayoutCommandV1 } from '../get-layout/get-layout.command';
import { LayoutVariablesSchemaUseCase } from '../layout-variables-schema';
import { LayoutVariablesSchemaCommand } from '../layout-variables-schema/layout-variables-schema.command';
import { mapToResponseDto } from '../mapper/mapper';
import { GetLayoutCommand } from './get-layout.command';

@Injectable()
export class GetLayoutUseCase {
  constructor(
    private getLayoutUseCaseV1: GetLayoutUseCaseV1,
    private controlValuesRepository: ControlValuesRepository,
    private layoutVariablesSchemaUseCase: LayoutVariablesSchemaUseCase,
    private analyticsService: AnalyticsService
  ) {}

  async execute(command: GetLayoutCommand): Promise<LayoutResponseDto> {
    const layout = await this.getLayoutUseCaseV1.execute(
      GetLayoutCommandV1.create({
        layoutIdOrInternalId: command.layoutIdOrInternalId,
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        type: ResourceTypeEnum.BRIDGE,
        origin: ResourceOriginEnum.NOVU_CLOUD,
      })
    );

    this.analyticsService.track('Get layout - [Layouts]', command.userId ?? command.environmentId, {
      _organizationId: command.organizationId,
      _environmentId: command.environmentId,
      layoutId: layout._id!,
    });

    if (command.skipAdditionalFields) {
      return mapToResponseDto({
        layout,
      });
    }

    const controlValues = await this.controlValuesRepository.findOne({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _layoutId: layout._id!,
      level: ControlValuesLevelEnum.LAYOUT_CONTROLS,
    });

    const layoutVariablesSchema = await this.layoutVariablesSchemaUseCase.execute(
      LayoutVariablesSchemaCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        controlValues: controlValues?.controls ?? {},
      })
    );

    return mapToResponseDto({
      layout,
      controlValues: controlValues?.controls ?? null,
      variables: layoutVariablesSchema,
    });
  }
}
