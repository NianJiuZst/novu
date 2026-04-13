import type { Context } from '../types';

export type ChannelConnectionResponse = {
  identifier: string;
  integrationIdentifier: string;
  providerId: string;
  channel: string;
  subscriberId?: string;
  contextKeys: string[];
  workspace: { id: string; name?: string };
  createdAt: string;
  updatedAt: string;
};

export type ChannelEndpointResponse = {
  identifier: string;
  integrationIdentifier: string;
  connectionIdentifier?: string;
  providerId: string;
  channel: string;
  subscriberId: string;
  contextKeys: string[];
  type: string;
  endpoint: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type GenerateChatOAuthUrlArgs = {
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId?: string;
  context?: Context;
  scope?: string[];
  /**
   * The type of channel endpoint to automatically create after the OAuth connection is established.
   * When provided together with `endpointData`, eliminates the need for a separate create-endpoint call.
   */
  endpointType?: string;
  /**
   * The endpoint payload to use when auto-creating the channel endpoint.
   * Shape depends on `endpointType`:
   * - `slack_channel` → `{ channelId }`
   * - `slack_user` → `{ userId }`
   * - `webhook` → `{ url, channel? }`
   * - `ms_teams_channel` → `{ teamId, channelId }`
   * - `ms_teams_user` → `{ userId }`
   * - `phone` → `{ phoneNumber }`
   */
  endpointData?: Record<string, string>;
};

export type ListChannelConnectionsArgs = {
  subscriberId?: string;
  integrationIdentifier?: string;
  channel?: string;
  providerId?: string;
  contextKeys?: string[];
  limit?: number;
  after?: string;
  before?: string;
};

export type GetChannelConnectionArgs = {
  identifier: string;
};

export type CreateChannelConnectionArgs = {
  identifier?: string;
  integrationIdentifier: string;
  subscriberId?: string;
  context?: Context;
  workspace: { id: string; name?: string };
  auth: { accessToken: string };
};

export type DeleteChannelConnectionArgs = {
  identifier: string;
};

export type ListChannelEndpointsArgs = {
  subscriberId?: string;
  integrationIdentifier?: string;
  connectionIdentifier?: string;
  channel?: string;
  providerId?: string;
  contextKeys?: string[];
  limit?: number;
  after?: string;
  before?: string;
};

export type GetChannelEndpointArgs = {
  identifier: string;
};

export type CreateChannelEndpointArgs = {
  identifier?: string;
  integrationIdentifier: string;
  connectionIdentifier?: string;
  subscriberId: string;
  context?: Context;
  type: string;
  endpoint: Record<string, string>;
};

export type DeleteChannelEndpointArgs = {
  identifier: string;
};
