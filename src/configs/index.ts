import telegramConfig from './telegram.config';
import mongoConfig from './mongo.config';
import redisConfig from './redis.config';
import openRouterConfig from './open-router.config';
import * as process from 'node:process';

export default () => ({
  port: process.env.PORT,
  isTest: process.env.IS_TEST,
  monthPromo: process.env.MONTH_PROMO,
  ...redisConfig(),
  ...mongoConfig(),
  ...telegramConfig(),
  ...openRouterConfig(),
});
