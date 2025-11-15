import { ESubscriptionType } from '../../subscription-module/constants/types';

export function getSubscriptionByCode(codeConfig: string, code: string) {
  if (code.includes(codeConfig)) {
    const now = new Date();

    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);

    return {
      type: ESubscriptionType.GIFT,
      dateFrom: new Date(),
      dateTo: nextMonth,
    };
  }
}
