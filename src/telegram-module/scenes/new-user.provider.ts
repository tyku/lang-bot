import { Scenes } from 'telegraf';
import { InlineKeyboardButton } from '@telegraf/types';
import { Ctx, Message, Scene, SceneEnter } from 'nestjs-telegraf';

import { UserProvider } from '../../user-module/user.provider';
import { ContextProvider } from '../../context-module/context.provider';

import type { TMessageType } from '../types/message';
import { SubscriptionProvider } from '../../subscription-module/subscription.provider';
import { ESubscriptionType } from '../../subscription-module/constants/types';
import { ActivatedPromoProvider } from '../../promo-module/activated-promo.provider';

@Scene('NEWUSER_SCENE_ID')
export class NewUserProvider {
  constructor(
    private userProvider: UserProvider,
    private contextProvider: ContextProvider,
    private activatedPromoProvider: ActivatedPromoProvider,
    private subscriptionProvider: SubscriptionProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(
    @Ctx() ctx: Scenes.SceneContext,
    @Message('chat') chat: TMessageType['chat'],
  ) {
    const { id: chatId, first_name: firstName, username } = chat;

    await this.userProvider.createUserIfNotExists(chatId, {
      firstName,
      username,
    });

    const user = firstName || username;

    await this.renderMenu(ctx, user);
    await this.renderSubscription(ctx);
  }

  private async renderSubscription(ctx: Scenes.SceneContext) {
    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const hasActiveSubscription =
      await this.subscriptionProvider.hasActiveSubscription(chatId);

    if (hasActiveSubscription) {
      return;
    }

    const promo = await this.activatedPromoProvider.tryActivate(chatId, 'welcome');

    if (promo) {
      await ctx.replyWithMarkdownV2(
        '🤖 В честь нашего знакомства *неделя* бесплатного доступа ко всем темам \n' +
          'Но даже без подписки тебе *доступны* тренажеры *по двум темам* ✨',
      );
    }
  }

  private async renderMenu(ctx: Scenes.SceneContext, user: string) {
    const activeContexts = await this.contextProvider.getAllActive([
      'name',
      'alias',
      'order',
      'isFree'
    ]);

    const sortedContext = activeContexts.sort(
      (contextA, contextB) => contextA.order - contextB.order,
    );

    const menuButtons = sortedContext.reduce((acc, item) => {
      const { name, alias, isFree } = item;

      const button = {
        text: isFree ? `🆓 ${name}` : name,
        callback_data: `trainer:${alias}`,
      };
      acc.push([button]);

      return acc;
    }, [] as InlineKeyboardButton[][]);

    await ctx.replyWithMarkdownV2(
      `😏 Привет${user ? ', ' + user : ''}\\! Я \\- продвинутая нейронная сеть\\.\n` +
        '\n' +
        '🚀 Помогу тебе отработать различные темы английского языка\\. ✨\n' +
        '\n' +
        '📣 У меня в запасе, очень много примеров и безграничное терпение \n' +
        '\n' +
        '📷 Выбери тему, начни выполнять упражнения, а я подскажу, где ошибки и объясню их\\! 💫\n',
      {
        reply_markup: {
          inline_keyboard: [
            ...menuButtons,
            [
              {
                text: '🈹 Промокод',
                callback_data: 'promo_code',
              },
              // { text: '🤝 Реферальная система', callback_data: 'referral' },
            ],
            [
              {
                text: '📬 Поддержка',
                url: 'https://t.me/RabbitHole_support',
              },
              // { text: '🤝 Реферальная система', callback_data: 'referral' },
            ],
          ],
        },
      },
    );

    await ctx.scene.leave();
  }
}
