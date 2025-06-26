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
    const res = await this.layoutRepository.getV2List({
      organizationId: command.user.organizationId,
      environmentId: command.user.environmentId,
      skip: command.offset,
      limit: command.limit,
      searchQuery: command.searchQuery,
      orderBy: command.orderBy ? command.orderBy : 'createdAt',
      orderDirection: command.orderDirection === DirectionEnum.ASC ? OrderDirectionEnum.ASC : OrderDirectionEnum.DESC,
    });

    if (res.data === null || res.data === undefined) {
      return { layouts: [], totalCount: 0 };
    }

    const layoutDtos = res.data.map((layout) => this.mapLayoutToResponseDto(layout));

    return {
      layouts: layoutDtos,
      totalCount: res.totalCount,
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
      controls: {},
    };
  }
}
