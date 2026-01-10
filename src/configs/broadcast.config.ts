import * as process from 'node:process';

export default () => ({
  broadcast: {
    adminLogin: process.env.BROADCAST_ADMIN_LOGIN,
    adminPassword: process.env.BROADCAST_ADMIN_PASSWORD,
  },
});

