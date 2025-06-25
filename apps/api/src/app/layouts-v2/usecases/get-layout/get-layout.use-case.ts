import { Injectable } from '@nestjs/common';
import { GetLayoutCommand as V1GetLayoutCommand, GetLayoutUseCase as V1GetLayoutUseCase } from '@novu/application-generic';
import { GetLayoutCommand } from './get-layout.command';
import { LayoutResponseDto } from '../../dtos';
import { mapToResponseDto } from '../mapper';

@Injectable()
export class GetLayoutUseCase {
  constructor(private v1GetLayoutUseCase: V1GetLayoutUseCase) {}

  async execute(command: GetLayoutCommand): Promise<LayoutResponseDto> {
    // Access user data with explicit casting for TypeScript
    const { user } = command as any;
    
    // Reuse v1 GetLayoutUseCase
    const layout = await this.v1GetLayoutUseCase.execute(
      V1GetLayoutCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        layoutId: command.layoutIdOrInternalId,
      })
    );

    // Map to v2 response format
    return mapToResponseDto({
      layout,
      controlValues: null, // TODO: implement control values retrieval
      variables: { type: 'object', properties: {}, required: [], additionalProperties: false },
    });
  }
}
