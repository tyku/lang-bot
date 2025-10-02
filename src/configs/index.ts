import telegramConfig from './telegram.config';

export default () => ({
  port: process.env.PORT,
  isTest: process.env.IS_TEST,
  ...telegramConfig(),
});
