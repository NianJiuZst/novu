import { Injectable } from '@nestjs/common';
import { DeleteLayoutCommand as V1DeleteLayoutCommand, DeleteLayoutUseCase as V1DeleteLayoutUseCase } from '../../../layouts-v1/usecases';
import { DeleteLayoutCommand } from './delete-layout.command';

@Injectable()
export class DeleteLayoutUseCase {
  constructor(private v1DeleteLayoutUseCase: V1DeleteLayoutUseCase) {}

  async execute(command: DeleteLayoutCommand): Promise<void> {
    // Access user data with explicit casting for TypeScript
    const { user } = command as any;
    
    // Reuse v1 DeleteLayoutUseCase
    const v1Command = {
      environmentId: user.environmentId,
      organizationId: user.organizationId,
      userId: user._id,
      layoutId: command.layoutIdOrInternalId,
    } as V1DeleteLayoutCommand;

    await this.v1DeleteLayoutUseCase.execute(v1Command);
  }
}
