type BaseStudioState = {
  testUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    emailAddress: string;
  };
  organizationName?: string;
  devSecretKey?: string;
  anonymousId?: string | null;
};

type LocalStudioState = BaseStudioState & {
  isLocalStudio: true;
  localBridgeURL: string;
  tunnelBridgeURL: string;
};

export type StudioState = LocalStudioState;
