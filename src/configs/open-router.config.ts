import { OPEN_ROUTER_PROVIDER_TOKEN } from '../services/constants';

export default () => ({
  providers: {
    [OPEN_ROUTER_PROVIDER_TOKEN]: {
      endpoint: process.env.OPEN_ROUTER_ENDPOINT,
      token: process.env.OPEN_ROUTER_TOKEN,
      title: process.env.OPEN_ROUTER_TITLE,
      referrer: process.env.OPEN_ROUTER_REFERRER,
    },
  },
});
