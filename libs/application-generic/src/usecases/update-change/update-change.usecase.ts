import { Injectable } from '@nestjs/common';
import type { ChangeRepository } from '@novu/dal';
import type { UpdateChangeCommand } from './update-change.command';

@Injectable()
export class UpdateChange {
  constructor(private changeRepository: ChangeRepository) {}

  async execute(command: UpdateChangeCommand) {
    await this.changeRepository.update(
      {
        _environmentId: command.environmentId,
        _entityId: command._entityId,
        type: command.type,
        enabled: false,
      },
      {
        $set: {
          _parentId: command.parentChangeId,
        },
      }
    );
  }
}
