import { Injectable } from '@nestjs/common';
import type { NotificationRepository } from '@novu/dal';
import { subDays } from 'date-fns';
import type { ActivityGraphStatesResponse } from '../../dtos/activity-graph-states-response.dto';
import type { GetActivityGraphStatsCommand } from './get-activity-graph-states.command';

@Injectable()
export class GetActivityGraphStats {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(command: GetActivityGraphStatsCommand): Promise<ActivityGraphStatesResponse[]> {
    return await this.notificationRepository.getActivityGraphStats(
      subDays(new Date(), command.days),
      command.environmentId
    );
  }
}
