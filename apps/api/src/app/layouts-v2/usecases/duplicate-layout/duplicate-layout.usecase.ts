import { Injectable } from '@nestjs/common';
import { GetLayoutCommand, GetLayoutUseCase } from '@novu/application-generic';
import { CreateLayoutCommand, CreateLayoutUseCase } from '../../../layouts/usecases';
import { DuplicateLayoutCommand } from './duplicate-layout.command';
import { LayoutDto } from '../../../layouts/dtos';

@Injectable()
export class DuplicateLayoutUseCase {
  constructor(
    private getLayoutUseCase: GetLayoutUseCase,
    private createLayoutUseCase: CreateLayoutUseCase
  ) {}

  async execute(command: DuplicateLayoutCommand): Promise<LayoutDto & { _id: string }> {
    // Get the source layout
    const sourceLayout = await this.getLayoutUseCase.execute(
      GetLayoutCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        layoutId: command.sourceLayoutId,
      })
    );

    // Create a new layout based on the source layout
    const duplicatedLayout = await this.createLayoutUseCase.execute(
      CreateLayoutCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        userId: command.userId,
        name: command.name,
        identifier: command.identifier,
        description: sourceLayout.description ? `Copy of ${sourceLayout.description}` : `Copy of ${sourceLayout.name}`,
        content: sourceLayout.content,
        variables: sourceLayout.variables,
        isDefault: false, // Duplicated layouts should never be default
      })
    );

    return duplicatedLayout;
  }
}
