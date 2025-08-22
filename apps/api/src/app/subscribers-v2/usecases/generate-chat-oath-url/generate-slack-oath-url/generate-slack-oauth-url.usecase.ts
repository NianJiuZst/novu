import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from '@novu/application-generic';
import { EnvironmentRepository, ICredentialsEntity, IntegrationEntity, IntegrationRepository } from '@novu/dal';
import { ChatProviderIdEnum } from '@novu/shared';
import { ChannelTypeEnum } from '@novu/stateless';
import { CHAT_OAUTH_CALLBACK_PATH } from '../chat-oauth.constants';
import { GenerateSlackOauthUrlCommand } from './generate-slack-oauth-url.command';

export type StateData = {
  subscriberId: string;
  environmentId: string;
  organizationId: string;
  integrationIdentifier: string;
  providerId: ChatProviderIdEnum;
  timestamp: number;
};

@Injectable()
export class GenerateSlackOauthUrl {
  private readonly SLACK_OAUTH_URL = 'https://slack.com/oauth/v2/authorize?';

  private readonly SLACK_OAUTH_SCOPES = [
    'chat:write',
    'chat:write.public',
    'channels:read',
    'groups:read',
    'users:read',
    'users:read.email',
  ] as const;

  constructor(
    private integrationRepository: IntegrationRepository,
    private environmentRepository: EnvironmentRepository
  ) {}

  async execute(command: GenerateSlackOauthUrlCommand): Promise<string> {
    const { clientId } = await this.getIntegrationCredentials(command);
    const secureState = await this.createSecureState(command);

    return this.getOAuthUrl(clientId!, secureState);
  }

  private async getOAuthUrl(clientId: string, secureState: string): Promise<string> {
    const oauthParams = new URLSearchParams({
      state: secureState,
      client_id: clientId,
      scope: this.SLACK_OAUTH_SCOPES.join(','),
      redirect_uri: GenerateSlackOauthUrl.buildRedirectUri(),
    });

    return `${this.SLACK_OAUTH_URL}${oauthParams.toString()}`;
  }

  private async createSecureState(command: GenerateSlackOauthUrlCommand): Promise<string> {
    const stateData: StateData = {
      subscriberId: command.subscriberId,
      environmentId: command.environmentId,
      organizationId: command.organizationId,
      integrationIdentifier: command.integrationIdentifier,
      providerId: ChatProviderIdEnum.Slack,
      timestamp: Date.now(),
    };

    const payload = JSON.stringify(stateData);
    const secret = await this.getEnvironmentApiKey(command.environmentId);
    const signature = createHash(secret, payload);

    return Buffer.from(`${payload}.${signature}`).toString('base64url');
  }

  static async validateAndDecodeState(
    state: string,
    environmentApiKey: string
  ): Promise<{
    subscriberId: string;
    environmentId: string;
    organizationId: string;
    integrationIdentifier: string;
    providerId: ChatProviderIdEnum;
    timestamp: number;
  }> {
    try {
      const decoded = Buffer.from(state, 'base64url').toString();
      const [payload, signature] = decoded.split('.');

      const expectedSignature = createHash(environmentApiKey, payload);
      if (signature !== expectedSignature) {
        throw new Error('Invalid state signature');
      }

      const data = JSON.parse(payload);

      // Validate timestamp (24 hours expiry)
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > TWENTY_FOUR_HOURS) {
        throw new Error('OAuth state expired');
      }

      return data;
    } catch (error) {
      throw new BadRequestException('Invalid OAuth state parameter');
    }
  }

  static buildRedirectUri(): string {
    if (!process.env.API_ROOT_URL) {
      throw new Error('API_ROOT_URL environment variable is required');
    }

    // const baseUrl = process.env.API_ROOT_URL.replace(/\/$/, ''); // Remove trailing slash
    const baseUrl = 'https://snowman-under-your-bed.loca.lt';
    return `${baseUrl}${CHAT_OAUTH_CALLBACK_PATH}`;
  }

  private async getIntegrationCredentials(command: GenerateSlackOauthUrlCommand): Promise<ICredentialsEntity> {
    const integration = await this.findSlackIntegration(command);

    if (!integration.credentials?.clientId) {
      throw new NotFoundException(`Slack integration missing clientId in environment ${command.environmentId}`);
    }

    return integration.credentials;
  }

  private async findSlackIntegration(command: GenerateSlackOauthUrlCommand): Promise<IntegrationEntity> {
    const query: Partial<IntegrationEntity> & { _environmentId: string } = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      channel: ChannelTypeEnum.CHAT,
      providerId: ChatProviderIdEnum.Slack,
      identifier: command.integrationIdentifier,
    };

    const integration = await this.integrationRepository.findOne(query);

    if (!integration) {
      throw new NotFoundException(
        `Slack integration not found in environment ${command.environmentId} ` +
          `with identifier: ${command.integrationIdentifier}`
      );
    }

    if (!integration.credentials) {
      throw new NotFoundException(`Slack integration missing credentials in environment ${command.environmentId}`);
    }

    return integration;
  }

  private async getEnvironmentApiKey(environmentId: string): Promise<string> {
    const apiKeys = await this.environmentRepository.getApiKeys(environmentId);

    if (!apiKeys.length) {
      throw new NotFoundException(`Environment ID: ${environmentId} not found`);
    }

    return apiKeys[0].key;
  }
}
