import telegramConfig from './telegram.config';
import mongoConfig from './mongo.config';
import openRouterConfig from './open-router.config';

export default () => ({
  port: process.env.PORT,
  isTest: process.env.IS_TEST,
  ...mongoConfig(),
  ...telegramConfig(),
  ...openRouterConfig(),
});
