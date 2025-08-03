import { Injectable } from '@nestjs/common';
import { ControlValuesRepository } from '@novu/dal';
import { ControlValuesLevelEnum, ResourceOriginEnum, ResourceTypeEnum } from '@novu/shared';
import { LayoutResponseDto } from '../../../dtos/layouts-v2';
import { AnalyticsService } from '../../../services';
import { GetLayoutV1Command, GetLayoutV1Usecase } from '../../get-layout-v1';
import { GetLayoutCommand } from '../../layouts-v2/get-layout';
import { LayoutVariablesSchemaCommand, LayoutVariablesSchemaUseCase } from '../../layouts-v2/layout-variables-schema';
import { mapToResponseDto } from '../mapper';

@Injectable()
export class GetLayoutUseCase {
  constructor(
    private getLayoutUseCaseV1: GetLayoutV1Usecase,
    private controlValuesRepository: ControlValuesRepository,
    private layoutVariablesSchemaUseCase: LayoutVariablesSchemaUseCase,
    private analyticsService: AnalyticsService
  ) {}

  async execute(command: GetLayoutCommand): Promise<LayoutResponseDto> {
    const layout = await this.getLayoutUseCaseV1.execute(
      GetLayoutV1Command.create({
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
