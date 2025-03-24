export class SubscriberSessionResponseDto {
  readonly token: string;
  readonly totalUnreadCount: number;
  readonly removeNovuBranding: boolean;
  readonly isDevelopmentMode: boolean;
  readonly applicationIdentifier?: string;
}
