import { Injectable } from '@nestjs/common';
import { LayoutEntity, LayoutRepository } from '@novu/dal';
import { InstrumentUsecase } from '@novu/application-generic';
import { DirectionEnum, OrderDirectionEnum } from '@novu/shared';

import { ListLayoutsCommand } from './list-layouts.command';
import { ListLayoutResponseDto, LayoutResponseDto } from '../../dtos';
import { mapToResponseDto } from '../mapper';

@Injectable()
export class ListLayoutsUseCase {
  constructor(private layoutRepository: LayoutRepository) {}

  @InstrumentUsecase()
  async execute(command: ListLayoutsCommand): Promise<ListLayoutResponseDto> {
    const query = this.buildQuery(command);
    const pagination = this.buildPagination(command);

    const [layouts, totalCount] = await Promise.all([
      this.layoutRepository.filterLayouts(query, pagination),
      this.layoutRepository.count(query),
    ]);

    if (!layouts || layouts.length === 0) {
      return { layouts: [], totalCount };
    }

    const layoutDtos = layouts.map((layout) => this.mapLayoutToResponseDto(layout));

    return {
      layouts: layoutDtos,
      totalCount,
    };
  }

  private buildQuery(command: ListLayoutsCommand) {
    const query: any = {
      _environmentId: command.user.environmentId,
      _organizationId: command.user.organizationId,
    };

    if (command.searchQuery) {
      query.$or = [
        { name: { $regex: command.searchQuery, $options: 'i' } },
        { identifier: { $regex: command.searchQuery, $options: 'i' } },
      ];
    }

    return query;
  }

  private buildPagination(command: ListLayoutsCommand) {
    const orderBy = command.orderDirection === DirectionEnum.ASC 
      ? OrderDirectionEnum.ASC 
      : OrderDirectionEnum.DESC;

    return {
      limit: command.limit || 50,
      skip: command.offset || 0,
      sortBy: command.orderBy || 'createdAt',
      orderBy,
    };
  }

  private mapLayoutToResponseDto(layout: LayoutEntity): LayoutResponseDto {
    const layoutDto = this.mapFromEntity(layout);
    
    return mapToResponseDto({
      layout: layoutDto,
      controlValues: null,
      variables: {},
    });
  }

  private mapFromEntity(layout: LayoutEntity) {
    return {
      ...layout,
      _id: layout._id,
      _organizationId: layout._organizationId,
      _environmentId: layout._environmentId,
      isDeleted: layout.deleted,
      controls: {
        uiSchema: layout.controls?.uiSchema,
        dataSchema: layout.controls?.schema,
      },
    };
  }
}
