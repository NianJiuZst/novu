import { Controller, Param, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AgentChatService } from './services/agent-chat.service';
import { sendFetchResponse } from './utils/express-to-fetch';

@Controller({ path: '/agents/:agentId', version: '1' })
@ApiExcludeController()
export class AgentWebhooksController {
  constructor(private readonly agentChatService: AgentChatService) {}

  @Post('/:platform')
  async handleWebhook(
    @Param('agentId') agentId: string,
    @Param('platform') platform: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const fetchResponse = await this.agentChatService.handleWebhook(agentId, platform, req);

    await sendFetchResponse(fetchResponse, res);
  }
}
