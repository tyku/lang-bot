import { Injectable } from '@nestjs/common';

import { BaseService } from '../base.service';
import { OPEN_ROUTER_PROVIDER_TOKEN } from '../constants';

const GPT_4_MINI_MODEL = 'openai/gpt-4o-mini';

type TMessageData = {
  type: 'text';
  text: string;
};

@Injectable()
export class OpenRouterProvider extends BaseService {
  protected providerName = OPEN_ROUTER_PROVIDER_TOKEN;

  sendMessage(prompt: string, data: TMessageData[] = []) {
    return this.request(`/api/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      data: {
        model: GPT_4_MINI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              ...data,
            ],
          },
        ],
      },
    });
  }

  private getAuthorization() {
    const token = this.configService.get(
      `providers.${OPEN_ROUTER_PROVIDER_TOKEN}.token`,
    );

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }

  private getTitle() {
    const title = this.configService.get(
      `providers.${OPEN_ROUTER_PROVIDER_TOKEN}.title`,
    );

    return title ? { 'X-Title': title } : {};
  }

  private getReferrer() {
    const referrer = this.configService.get(
      `providers.${OPEN_ROUTER_PROVIDER_TOKEN}.referrer`,
    );

    return referrer ? { 'HTTP-Referer': referrer } : {};
  }

  private getHeaders() {
    return {
      ...this.getAuthorization(),
      ...this.getReferrer(),
      ...this.getTitle(),
      'Content-Type': 'application/json',
    };
  }
}
