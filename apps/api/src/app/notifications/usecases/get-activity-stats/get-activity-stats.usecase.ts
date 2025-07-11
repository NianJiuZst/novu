import { Injectable } from '@nestjs/common';
import type { NotificationRepository } from '@novu/dal';
import type { ActivityStatsResponseDto } from '../../dtos/activity-stats-response.dto';
import type { GetActivityStatsCommand } from './get-activity-stats.command';

@Injectable()
export class GetActivityStats {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(command: GetActivityStatsCommand): Promise<ActivityStatsResponseDto> {
    const result = await this.notificationRepository.getStats(command.environmentId);

    return {
      weeklySent: result.weekly,
      monthlySent: result.monthly,
    };
  }
}
