import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

import { LoggerProvider } from '../logger-module/logger.provider';

@Injectable()
export class BaseService implements OnModuleInit {
  protected providerName: string;

  protected endpoint: string;

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
    protected logger: LoggerProvider,
  ) {}

  onModuleInit(): any {
    const providerConfig = this.configService.get<{ endpoint: string }>(
      `providers.${this.providerName}`,
    );

    if (!providerConfig) {
      throw new Error(`Config for ${this.providerName} was not found`);
    }

    this.endpoint = providerConfig.endpoint;
  }

  async request(url: string, options: AxiosRequestConfig) {
    const isTest = this.configService.get<boolean>('isTest');

    const config: AxiosRequestConfig = {
      ...options,
      // params: { ...options.params, isTest },
      url,
      baseURL: this.endpoint,
    };

    try {
      const response$ = this.httpService.request(config);

      this.logger.log('OUTGOING_REQUEST', {
        url,
        baseUrl: config.baseURL,
        body: config.data,
      });
      const response = await firstValueFrom(response$);

      this.logger.log('OUTGOING_REQUEST_RESPONSE', {
        url,
        baseUrl: config.baseURL,
        body: config.data,
        response: response.data,
      });

      return response.data;
    } catch (err) {
      this.logger.log('OUTGOING_REQUEST_ERROR', {
        url,
        baseUrl: config.baseURL,
        body: config.data,
        error: err.message,
      });
    }
  }
}
