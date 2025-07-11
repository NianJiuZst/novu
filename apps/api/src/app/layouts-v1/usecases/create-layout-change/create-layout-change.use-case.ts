import { Injectable } from '@nestjs/common';
import { type CreateChange, CreateChangeCommand } from '@novu/application-generic';
import type { ChangeRepository, LayoutRepository } from '@novu/dal';
import { ChangeEntityTypeEnum } from '@novu/shared';
import { FindDeletedLayoutCommand, type FindDeletedLayoutUseCase } from '../find-deleted-layout';
import type { CreateLayoutChangeCommand } from './create-layout-change.command';

@Injectable()
export class CreateLayoutChangeUseCase {
  constructor(
    private createChange: CreateChange,
    private findDeletedLayout: FindDeletedLayoutUseCase,
    private layoutRepository: LayoutRepository,
    private changeRepository: ChangeRepository
  ) {}

  async execute(command: CreateLayoutChangeCommand, isDeleteChange = false): Promise<void> {
    const item = isDeleteChange
      ? await this.findDeletedLayout.execute(FindDeletedLayoutCommand.create(command))
      : await this.layoutRepository.findOne({
          _id: command.layoutId,
          _environmentId: command.environmentId,
          _organizationId: command.organizationId,
        });

    if (item) {
      const parentChangeId: string = await this.changeRepository.getChangeId(
        command.environmentId,
        ChangeEntityTypeEnum.LAYOUT,
        command.layoutId
      );

      await this.createChange.execute(
        CreateChangeCommand.create({
          organizationId: command.organizationId,
          environmentId: command.environmentId,
          userId: command.userId,
          type: ChangeEntityTypeEnum.LAYOUT,
          item,
          changeId: parentChangeId,
        })
      );
    }
  }
}
