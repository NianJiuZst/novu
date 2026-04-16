import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DomainEntity, DomainRepository, DomainRoute } from '@novu/dal';
import { DomainRouteTypeEnum, DomainStatusEnum } from '@novu/shared';
import axios from 'axios';
import { InboundEmailParseCommand } from '../inbound-email-parse.command';
import { normalizeReferences, resolveThreadId } from './resolve-thread-id';

const LOG_CONTEXT = 'DomainRouteStrategy';

export type DomainRouteEmailPayload = {
  domain: {
    id: string;
    name: string;
  };
  route: {
    address: string;
    destination: string;
    type: DomainRouteTypeEnum;
  };
  mail: {
    from: InboundEmailParseCommand['from'];
    to: InboundEmailParseCommand['to'];
    subject: InboundEmailParseCommand['subject'];
    html: InboundEmailParseCommand['html'];
    text: InboundEmailParseCommand['text'];
    headers: InboundEmailParseCommand['headers'];
    attachments: InboundEmailParseCommand['attachments'];
    messageId: InboundEmailParseCommand['messageId'];
    inReplyTo: InboundEmailParseCommand['inReplyTo'];
    references: InboundEmailParseCommand['references'];
    date: InboundEmailParseCommand['date'];
    cc: InboundEmailParseCommand['cc'];
  };
};

@Injectable()
export class DomainRouteStrategy {
  constructor(private domainRepository: DomainRepository) {}

  async execute(command: InboundEmailParseCommand): Promise<void> {
    const toAddress = command.to[0].address;

    Logger.log({ toAddress }, 'Processing domain-route email', LOG_CONTEXT);

    const domain = await this.domainRepository.findByRouteAddress(toAddress);

    if (!domain) {
      this.throwError(`No domain found for address ${toAddress}`);
    }

    if (domain.status !== DomainStatusEnum.VERIFIED) {
      this.throwError(`Domain ${domain.name} is not verified`);
    }

    if (!domain.mxRecordConfigured) {
      this.throwError(`Domain ${domain.name} does not have MX records configured`);
    }

    const route = domain.routes.find((r) => r.address === toAddress.split('@')[0]);

    if (!route) {
      this.throwError(`No route found matching address ${toAddress} on domain ${domain.name}`);
    }

    if (route.type === DomainRouteTypeEnum.AGENT) {
      await this.handleAgentRoute(command, domain, route, toAddress);

      return;
    }

    if (route.type === DomainRouteTypeEnum.WEBHOOK) {
      await this.handleWebhookRoute(command, domain, route, toAddress);
    }
  }

  private async handleAgentRoute(
    command: InboundEmailParseCommand,
    domain: DomainEntity,
    route: DomainRoute,
    toAddress: string
  ): Promise<void> {
    const _agentPayload: DomainRouteEmailPayload = {
      domain: {
        id: domain._id,
        name: domain.name,
      },
      route: {
        address: route.address,
        destination: route.destination,
        type: route.type,
      },
      mail: {
        from: command.from,
        to: command.to,
        subject: command.subject,
        html: command.html,
        text: command.text,
        headers: command.headers,
        attachments: command.attachments,
        messageId: command.messageId,
        inReplyTo: command.inReplyTo,
        references: command.references,
        date: command.date,
        cc: command.cc,
      },
    };

    const threadInfo = {
      threadId: resolveThreadId(toAddress, command.messageId, command.inReplyTo, command.references),
      messageId: command.messageId,
      inReplyTo: command.inReplyTo ?? null,
      references: normalizeReferences(command.references),
      subject: command.subject,
      isReply: !!command.inReplyTo,
    };

    // TODO: Implement agent request in next step
    // await this.sendToAgent(route.destination, _agentPayload, threadInfo);
    Logger.log(
      { toAddress, destination: route.destination, threadInfo },
      'Agent route — thread info collected, forwarding not yet implemented',
      LOG_CONTEXT
    );
  }

  private async handleWebhookRoute(
    command: InboundEmailParseCommand,
    domain: DomainEntity,
    route: DomainRoute,
    toAddress: string
  ): Promise<void> {
    const payload: DomainRouteEmailPayload = {
      domain: {
        id: domain._id,
        name: domain.name,
      },
      route: {
        address: route.address,
        destination: route.destination,
        type: route.type,
      },
      mail: {
        from: command.from,
        to: command.to,
        subject: command.subject,
        html: command.html,
        text: command.text,
        headers: command.headers,
        attachments: command.attachments,
        messageId: command.messageId,
        inReplyTo: command.inReplyTo,
        references: command.references,
        date: command.date,
        cc: command.cc,
      },
    };

    await axios.post(route.destination, payload);

    Logger.log({ toAddress, destination: route.destination }, 'Forwarded email to webhook destination', LOG_CONTEXT);
  }

  private throwError(error: string): never {
    Logger.error(error, LOG_CONTEXT);
    throw new BadRequestException(error);
  }
}
