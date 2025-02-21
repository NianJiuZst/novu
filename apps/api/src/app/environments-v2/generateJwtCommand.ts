import { UserSessionData } from '@novu/shared';

export class GenerateJwtCommand {
  user: UserSessionData;
  subscriberId: string;
}
