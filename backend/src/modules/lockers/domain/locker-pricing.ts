import { SubscriptionPeriod } from './subscription-period';

export interface PriceQuote {
  billableMonths: number;
  monthlyFee: number;
  amount: number;
}

/** Price = monthly fee x billable months (rounded to 2 decimals). */
export function quotePrice(monthlyFee: number, period: SubscriptionPeriod): PriceQuote {
  const billableMonths = period.billableMonths;
  return { billableMonths, monthlyFee, amount: Math.round(monthlyFee * billableMonths * 100) / 100 };
}
