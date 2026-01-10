import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { BroadcastProvider } from './broadcast.provider';
import { BroadcastSentProvider } from './broadcast-sent.provider';
import { BroadcastAuthGuard } from './broadcast-auth.guard';
import { LoggerProvider } from '../logger-module/logger.provider';

class SendBroadcastDto {
  broadcastName: string;
}

class CreateBroadcastDto {
  name: string;
  content: string;
  isActive?: boolean;
}

@Controller('broadcast')
@UseGuards(BroadcastAuthGuard)
export class BroadcastController {
  constructor(
    private broadcastService: BroadcastService,
    private broadcastProvider: BroadcastProvider,
    private broadcastSentProvider: BroadcastSentProvider,
    private logger: LoggerProvider,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendBroadcast(@Body() dto: SendBroadcastDto) {
    this.logger.log(
      `Broadcast send request received for: ${dto.broadcastName}`,
    );

    try {
      const result = await this.broadcastService.sendBroadcast(
        dto.broadcastName,
      );
      return {
        success: true,
        message: 'Broadcast sent successfully',
        result,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send broadcast "${dto.broadcastName}": ${error?.message || error}`,
      );
      throw error;
    }
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createBroadcast(@Body() dto: CreateBroadcastDto) {
    this.logger.log(`Broadcast create request received: ${dto.name}`);

    try {
      const broadcast = await this.broadcastProvider.createOrUpdate(
        dto.name,
        {
          name: dto.name,
          content: dto.content,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      );
      return {
        success: true,
        message: 'Broadcast created/updated successfully',
        broadcast,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create broadcast "${dto.name}": ${error?.message || error}`,
      );
      throw error;
    }
  }

  @Get('list')
  async listBroadcasts() {
    try {
      const broadcasts = await this.broadcastProvider.findAll();
      return {
        success: true,
        broadcasts,
      };
    } catch (error: any) {
      this.logger.error(`Failed to list broadcasts: ${error?.message || error}`);
      throw error;
    }
  }

  @Get('stats/:broadcastName')
  async getBroadcastStats(@Param('broadcastName') broadcastName: string) {
    try {
      const broadcast = await this.broadcastProvider.findByName(broadcastName);
      if (!broadcast) {
        return {
          success: false,
          message: `Broadcast "${broadcastName}" not found`,
        };
      }

      const sentCount = await this.broadcastSentProvider.getSentCount(
        broadcastName,
      );
      const sentList = await this.broadcastSentProvider.getSentList(
        broadcastName,
      );

      return {
        success: true,
        broadcast: {
          name: broadcast.name,
          isActive: broadcast.isActive,
          content: broadcast.content,
          createdAt: (broadcast as any).createdAt,
          updatedAt: (broadcast as any).updatedAt,
        },
        stats: {
          sentCount,
          sentList: sentList.slice(0, 100), // Ограничиваем последние 100 записей
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get broadcast stats for "${broadcastName}": ${error?.message || error}`,
      );
      throw error;
    }
  }
}

