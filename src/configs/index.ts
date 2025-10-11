import telegramConfig from './telegram.config';
import mongoConfig from './mongo.config';
import redisConfig from './redis.config';
import openRouterConfig from './open-router.config';

export default () => ({
  port: process.env.PORT,
  isTest: process.env.IS_TEST,
  ...redisConfig(),
  ...mongoConfig(),
  ...telegramConfig(),
  ...openRouterConfig(),
});
