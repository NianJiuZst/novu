import { Injectable } from '@nestjs/common';
import { GetLayoutCommand, GetLayoutUseCase } from '@novu/application-generic';
import { CreateLayoutCommand, CreateLayoutUseCase } from '../../../layouts-v1/usecases';
import { DuplicateLayoutCommand } from './duplicate-layout.command';
import { LayoutResponseDto } from '../../dtos';
import { mapToResponseDto } from '../mapper';
import { ResourceTypeEnum, ResourceOriginEnum, slugify } from '@novu/shared';

@Injectable()
export class DuplicateLayoutUseCase {
  constructor(
    private getLayoutUseCase: GetLayoutUseCase,
    private createLayoutUseCase: CreateLayoutUseCase
  ) {}

  async execute(command: DuplicateLayoutCommand): Promise<LayoutResponseDto> {
    // Access user data with explicit casting for TypeScript
    const { user } = command as any;
    
    // Get the source layout using v1 GetLayoutUseCase
    const sourceLayout = await this.getLayoutUseCase.execute(
      GetLayoutCommand.create({
        layoutIdOrInternalId: command.layoutIdOrInternalId,
        environmentId: user.environmentId,
        organizationId: user.organizationId,
      })
    );

    // Generate unique identifier for the duplicated layout
    const duplicatedIdentifier = slugify(command.overrides.name);

    // Create a new layout based on the source layout using v1 CreateLayoutUseCase
    const duplicatedLayout = await this.createLayoutUseCase.execute({
      environmentId: user.environmentId,
      organizationId: user.organizationId,
      userId: user._id,
      name: command.overrides.name,
      identifier: duplicatedIdentifier,
      description: sourceLayout.description ? `Copy of ${sourceLayout.description}` : `Copy of ${sourceLayout.name}`,
      content: sourceLayout.content,
      variables: sourceLayout.variables,
      isDefault: false, // Duplicated layouts should never be default
      type: sourceLayout.type || ResourceTypeEnum.BRIDGE,
      origin: sourceLayout.origin || ResourceOriginEnum.NOVU_CLOUD,
    } as CreateLayoutCommand);

    // Map to v2 response format
    return mapToResponseDto({
      layout: duplicatedLayout,
      controlValues: null, // TODO: implement control values duplication
      variables: { type: 'object', properties: {}, required: [], additionalProperties: false },
    });
  }
}
