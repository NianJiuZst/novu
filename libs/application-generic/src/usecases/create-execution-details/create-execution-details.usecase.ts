import { Injectable } from '@nestjs/common';
import type { ExecutionDetailsEntity, ExecutionDetailsRepository } from '@novu/dal';
import type { CreateExecutionDetailsCommand } from './create-execution-details.command';
import {
  type CreateExecutionDetailsResponseDto,
  mapExecutionDetailsCommandToEntity,
} from './dtos/execution-details.dto';

@Injectable()
export class CreateExecutionDetails {
  constructor(private executionDetailsRepository: ExecutionDetailsRepository) {}

  async execute(command: CreateExecutionDetailsCommand): Promise<CreateExecutionDetailsResponseDto> {
    let entity = mapExecutionDetailsCommandToEntity(command);

    entity = this.cleanFromNulls(entity);

    const { _id, createdAt } = await this.executionDetailsRepository.create(entity, {
      writeConcern: 1,
    });

    return {
      id: _id,
      createdAt,
    };
  }

  private cleanFromNulls(
    entity: Omit<ExecutionDetailsEntity, 'createdAt' | '_id'>
  ): Omit<ExecutionDetailsEntity, 'createdAt' | '_id'> {
    const cleanEntity = { ...entity };

    if (cleanEntity.raw === null) {
      delete cleanEntity.raw;
    }

    return cleanEntity;
  }
}
