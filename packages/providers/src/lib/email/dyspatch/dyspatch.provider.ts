import { EmailProviderIdEnum } from '@novu/shared';
import {
  ChannelTypeEnum,
  IEmailOptions,
  IEmailProvider,
  ISendMessageSuccessResponse,
  ICheckIntegrationResponse,
  CheckIntegrationResponseEnum,
  IEmailEventBody,
  EmailEventStatusEnum,
  IAttachmentOptions,
} from '@novu/stateless';
import axios, { AxiosInstance } from 'axios';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

interface IDyspatchSendRequest {
  template: string;
  recipient: {
    address: string;
    name?: string;
  };
  cc?: Array<{
    address: string;
    name?: string;
  }>;
  bcc?: Array<{
    address: string;
    name?: string;
  }>;
  sender?: {
    address: string;
    name?: string;
    reply_to?: string;
  };
  template_data?: Record<string, any>;
  tags?: string[];
  headers?: Record<string, string>;
  attachments?: Array<{
    id: string;
    data: string;
  }>;
}

interface IDyspatchSendResponse {
  success: boolean;
  status: string;
  receipt_id: string;
  email: {
    name: string;
    version_name: string;
  };
}

export class DyspatchEmailProvider extends BaseProvider implements IEmailProvider {
  id = EmailProviderIdEnum.Dyspatch;
  protected casing: CasingEnum = CasingEnum.SNAKE_CASE;
  channelType = ChannelTypeEnum.EMAIL as ChannelTypeEnum.EMAIL;
  public readonly BASE_URL = 'https://api.sendwithus.com/api/v1';
  private axiosInstance: AxiosInstance;

  constructor(
    private config: {
      apiKey: string;
      from: string;
      senderName: string;
    }
  ) {
    super();
    this.axiosInstance = axios.create({
      baseURL: this.BASE_URL,
      auth: {
        username: this.config.apiKey,
        password: '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(
    options: IEmailOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    const templateId = options.customData?.templateId || 'tem_default';
    
    const data: IDyspatchSendRequest = this.transform<IDyspatchSendRequest>(bridgeProviderData, {
      template: templateId as string,
      recipient: {
        address: Array.isArray(options.to) ? options.to[0] : options.to,
        name: options.customData?.recipientName,
      },
      sender: {
        address: options.from || this.config.from,
        name: options.senderName || this.config.senderName,
        reply_to: options.replyTo,
      },
      template_data: {
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...options.customData,
      },
      tags: options.customData?.tags as string[],
      headers: options.headers,
    }).body;

    if (options.cc && options.cc.length > 0) {
      data.cc = options.cc.map((email) => ({ address: email }));
    }

    if (options.bcc && options.bcc.length > 0) {
      data.bcc = options.bcc.map((email) => ({ address: email }));
    }

    if (options.attachments && options.attachments.length > 0) {
      data.attachments = options.attachments.map((attachment: IAttachmentOptions) => ({
        id: attachment.name,
        data: attachment.file.toString('base64'),
      }));
    }

    const response = await this.axiosInstance.post<IDyspatchSendResponse>('/send', data);

    return {
      id: response.data.receipt_id || options.id,
      date: new Date().toISOString(),
    };
  }

  async checkIntegration(options: IEmailOptions): Promise<ICheckIntegrationResponse> {
    try {
      const testData: IDyspatchSendRequest = {
        template: 'test_template',
        recipient: {
          address: 'test@example.com',
        },
        sender: {
          address: options.from || this.config.from,
          name: this.config.senderName,
        },
        template_data: {
          subject: 'Test Integration',
          html: '<p>Testing Dyspatch integration</p>',
        },
      };

      // We'll do a dry run by making a request to the templates endpoint instead
      await this.axiosInstance.get('/templates');

      return {
        success: true,
        message: 'Integration successful',
        code: CheckIntegrationResponseEnum.SUCCESS,
      };
    } catch (error: any) {
      const errorCode = this.mapStatusCodeToCheckIntegrationResponseEnum(error?.response?.status);
      
      return {
        success: false,
        message: error?.response?.data?.message || error.message || 'Unknown error occurred',
        code: errorCode,
      };
    }
  }

  getMessageId(body: any | any[]): string[] {
    if (Array.isArray(body)) {
      return body.map((item) => item.receipt_id || item.id);
    }

    return [body.receipt_id || body.id];
  }

  parseEventBody(body: any | any[], identifier: string): IEmailEventBody | undefined {
    if (Array.isArray(body)) {
      // eslint-disable-next-line no-param-reassign
      body = body.find((item) => item.receipt_id === identifier || item.id === identifier);
    }

    if (!body) {
      return undefined;
    }

    const status = this.getStatus(body.event);

    if (status === undefined) {
      return undefined;
    }

    return {
      status,
      date: new Date(body.timestamp || Date.now()).toISOString(),
      externalId: body.receipt_id || body.id,
      attempts: body.attempt ? parseInt(body.attempt, 10) : 1,
      response: body.response || '',
      row: body,
    };
  }

  private getStatus(event: string): EmailEventStatusEnum | undefined {
    switch (event) {
      case 'opened':
        return EmailEventStatusEnum.OPENED;
      case 'clicked':
        return EmailEventStatusEnum.CLICKED;
      case 'delivered':
        return EmailEventStatusEnum.DELIVERED;
      case 'bounced':
        return EmailEventStatusEnum.BOUNCED;
      case 'spam_report':
        return EmailEventStatusEnum.SPAM;
      case 'unsubscribed':
        return EmailEventStatusEnum.UNSUBSCRIBED;
      case 'dropped':
        return EmailEventStatusEnum.DROPPED;
      default:
        return undefined;
    }
  }

  private mapStatusCodeToCheckIntegrationResponseEnum(statusCode: number): CheckIntegrationResponseEnum {
    switch (statusCode) {
      case 400:
        return CheckIntegrationResponseEnum.INVALID_EMAIL;
      case 401:
      case 403:
        return CheckIntegrationResponseEnum.BAD_CREDENTIALS;
      default:
        return CheckIntegrationResponseEnum.FAILED;
    }
  }
}
