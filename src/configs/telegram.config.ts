export default () => ({
  telegram: {
    botAccessToken: process.env.BOT_ACCESS_TOKEN,
    botName: process.env.BOT_NAME || 'proj-eng',
  },
});
