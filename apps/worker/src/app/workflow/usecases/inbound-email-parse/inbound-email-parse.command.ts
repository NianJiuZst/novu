import {
  BaseCommand,
  type IConnection,
  type IEnvelopeFrom,
  type IEnvelopeTo,
  type IFrom,
  type IHeaders,
  type IInboundParseDataDto,
  type ITo,
} from '@novu/application-generic';
import { IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class InboundEmailParseCommand extends BaseCommand implements IInboundParseDataDto {
  @IsDefined()
  @IsString()
  html: string;

  @IsDefined()
  @IsString()
  text: string;

  @IsDefined()
  headers: IHeaders;

  @IsDefined()
  @IsString()
  subject: string;

  @IsDefined()
  @IsString()
  messageId: string;

  @IsDefined()
  @IsString()
  priority: string;

  @IsDefined()
  from: IFrom[];

  @IsDefined()
  to: ITo[];

  @IsDefined()
  date: Date;

  @IsDefined()
  @IsString()
  dkim: string;

  @IsDefined()
  @IsString()
  spf: string;

  @IsDefined()
  @IsNumber()
  spamScore: number;

  @IsDefined()
  @IsString()
  language: string;

  @IsDefined()
  cc: any[];

  @IsDefined()
  @IsOptional()
  attachments?: any[];

  @IsDefined()
  connection: IConnection;

  @IsDefined()
  envelopeFrom: IEnvelopeFrom;

  @IsDefined()
  envelopeTo: IEnvelopeTo[];
}
