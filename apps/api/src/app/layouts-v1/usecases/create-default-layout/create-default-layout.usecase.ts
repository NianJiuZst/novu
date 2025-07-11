import { Injectable } from '@nestjs/common';
import type { GetNovuLayout } from '@novu/application-generic';
import type { LayoutRepository } from '@novu/dal';
import type { LayoutDto } from '../../dtos';
import { CreateLayoutCommand, type CreateLayoutUseCase } from '../create-layout';
import type { SetDefaultLayoutUseCase } from '../set-default-layout';
import type { CreateDefaultLayoutCommand } from './create-default-layout.command';

@Injectable()
export class CreateDefaultLayout {
  constructor(
    private setDefaultLayout: SetDefaultLayoutUseCase,
    private layoutRepository: LayoutRepository,
    private createLayout: CreateLayoutUseCase,
    private getNovuLayout: GetNovuLayout
  ) {}

  async execute(command: CreateDefaultLayoutCommand): Promise<LayoutDto> {
    return await this.createLayout.execute(
      CreateLayoutCommand.create({
        userId: command.userId,
        name: 'Default Layout',
        isDefault: true,
        identifier: 'novu-default-layout',
        content: await this.getNovuLayout.execute({}),
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        description: 'The default layout created by Novu',
      })
    );
  }
}
