type SessionArgs = {
  subscriberId: string;
  applicationIdentifier: string;
};
type SessionCallback = () => SessionArgs | Promise<SessionArgs>;
type JWT = string | SessionArgs | SessionCallback | (() => string | Promise<string>);

export type InitializeSessionArgs = {
  /**
   * @deprecated use jwt instead
   */
  applicationIdentifier: string;
  /**
   * @deprecated use jwt instead
   */
  subscriberId: string;
  /**
   * @deprecated use jwt instead
   */
  subscriberHash?: string;
  jwt?: JWT;
};
