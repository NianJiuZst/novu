export interface IOnboardCommandOptions {
  subscriberId: string;
  apiKey: string;
  apiUrl?: string;
}

// For backward compatibility
export type OnboardCommandOptions = IOnboardCommandOptions;
