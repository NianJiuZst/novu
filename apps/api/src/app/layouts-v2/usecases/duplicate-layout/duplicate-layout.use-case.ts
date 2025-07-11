import { Injectable } from '@nestjs/common';
import type { AnalyticsService } from '@novu/application-generic';
import type { ControlValuesRepository } from '@novu/dal';
import { ControlValuesLevelEnum } from '@novu/shared';
import type { LayoutResponseDto } from '../../dtos';
import { GetLayoutCommand, type GetLayoutUseCase } from '../get-layout';
import { UpsertLayoutCommand, type UpsertLayoutUseCase } from '../upsert-layout';
import type { DuplicateLayoutCommand } from './duplicate-layout.command';

@Injectable()
export class DuplicateLayoutUseCase {
  constructor(
    private getLayoutUseCase: GetLayoutUseCase,
    private upsertLayoutUseCase: UpsertLayoutUseCase,
    private controlValuesRepository: ControlValuesRepository,
    private analyticsService: AnalyticsService
  ) {}

  async execute(command: DuplicateLayoutCommand): Promise<LayoutResponseDto> {
    const originalLayout = await this.getLayoutUseCase.execute(
      GetLayoutCommand.create({
        layoutIdOrInternalId: command.layoutIdOrInternalId,
        environmentId: command.user.environmentId,
        organizationId: command.user.organizationId,
        userId: command.user._id,
        skipAdditionalFields: true,
      })
    );

    const originalControlValues = await this.controlValuesRepository.findOne({
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
      _layoutId: originalLayout._id!,
      level: ControlValuesLevelEnum.LAYOUT_CONTROLS,
    });

    const duplicatedLayout = await this.upsertLayoutUseCase.execute(
      UpsertLayoutCommand.create({
        layoutDto: {
          name: command.overrides.name,
          controlValues: originalControlValues?.controls ?? null,
        },
        user: command.user,
      })
    );

    this.analyticsService.track('Duplicate layout - [Layouts]', command.user._id, {
      _organizationId: command.user.organizationId,
      _environmentId: command.user.environmentId,
      originalLayoutId: originalLayout._id!,
      duplicatedLayoutId: duplicatedLayout._id,
    });

    return duplicatedLayout;
  }
}
