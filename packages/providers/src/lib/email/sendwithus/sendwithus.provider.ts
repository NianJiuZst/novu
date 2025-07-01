import { EmailProviderIdEnum } from '@novu/shared';
import {
  ChannelTypeEnum,
  ISendMessageSuccessResponse,
  IEmailOptions,
  IEmailProvider,
  ICheckIntegrationResponse,
  CheckIntegrationResponseEnum,
  IAttachmentOptions,
} from '@novu/stateless';
import axios, { AxiosInstance } from 'axios';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

export class SendwithusEmailProvider extends BaseProvider implements IEmailProvider {
  id = 'sendwithus' as EmailProviderIdEnum;
  protected casing: CasingEnum = CasingEnum.SNAKE_CASE;
  channelType = ChannelTypeEnum.EMAIL as ChannelTypeEnum.EMAIL;
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
      baseURL: 'https://api.sendwithus.com/api/v1',
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
    const payload = this.createPayload(options);
    const response = await this.axiosInstance.post(
      '/send',
      this.transform(bridgeProviderData, payload).body
    );

    return {
      id: response.data.receipt_id,
      date: new Date().toISOString(),
    };
  }

  async checkIntegration(options: IEmailOptions): Promise<ICheckIntegrationResponse> {
    try {
      const payload = this.createPayload(options);
      await this.axiosInstance.post('/send', payload);

      return {
        success: true,
        message: 'Integration successful',
        code: CheckIntegrationResponseEnum.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
        code: this.mapErrorToCode(error?.response?.status),
      };
    }
  }

  private createPayload(options: IEmailOptions) {
    const attachments = this.mapAttachments(options.attachments || []);
    
    // For direct email sending (non-template based), sendwithus requires a template
    // We'll create a simple template with the HTML/text content
    const payload: any = {
      template: 'novu_direct_send',
      recipient: {
        address: options.to[0],
        name: options.to[0],
      },
      template_data: {
        subject: options.subject,
        html_content: options.html,
        text_content: options.text,
        ...options.customData,
      },
    };

    // Add sender information if provided
    if (options.from || this.config.from) {
      payload.sender = {
        address: options.from || this.config.from,
        name: options.senderName || this.config.senderName,
      };

      if (options.replyTo) {
        payload.sender.reply_to = options.replyTo;
      }
    }

    if (options.cc && options.cc.length > 0) {
      payload.cc = options.cc.map(email => ({ address: email }));
    }

    if (options.bcc && options.bcc.length > 0) {
      payload.bcc = options.bcc.map(email => ({ address: email }));
    }

    if (options.headers) {
      payload.headers = options.headers;
    }

    if (attachments.length > 0) {
      payload.files = attachments;
    }

    return payload;
  }

  private mapAttachments(attachments: IAttachmentOptions[]): any[] {
    return attachments.map(attachment => ({
      id: attachment.name,
      data: attachment.file.toString('base64'),
    }));
  }

  private mapErrorToCode(statusCode?: number): CheckIntegrationResponseEnum {
    switch (statusCode) {
      case 401:
        return CheckIntegrationResponseEnum.BAD_CREDENTIALS;
      case 403:
        return CheckIntegrationResponseEnum.INVALID_EMAIL;
      default:
        return CheckIntegrationResponseEnum.FAILED;
    }
  }
}
