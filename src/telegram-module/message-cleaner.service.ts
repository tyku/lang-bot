import { Injectable } from '@nestjs/common';
import { Context, Scenes } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';

@Injectable()
export class MessageCleanerService {
  async saveAndDeletePrev(ctx: Scenes.SceneContext, message: any) {
    if ((ctx.session as any).lastInputMessageId) {
      try {
        await ctx.deleteMessage((ctx.session as any).lastInputMessageId);
      } catch (e) {}
    }

    // сохранить новый input
    (ctx.session as any).lastInputMessageId = message.message_id;
  }

  async deleteUserReply(ctx: Scenes.SceneContext) {
    if (ctx.message && 'message_id' in ctx.message) {
      try {
        await ctx.deleteMessage(ctx.message.message_id);
      } catch (e) {}
    }
  }

  async deleteAll(ctx: Scenes.SceneContext) {
    if ((ctx.session as any).lastInputMessageId) {
      try {
        await ctx.deleteMessage((ctx.session as any).lastInputMessageId);
      } catch {}
      (ctx.session as any).lastInputMessageId = null;
    }
  }
}
