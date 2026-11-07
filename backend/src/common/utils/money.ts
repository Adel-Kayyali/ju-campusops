import { Prisma } from '@prisma/client';

/** Converts Prisma Decimal values to a plain number rounded to 2 decimals for JSON responses. */
export function toMoney(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Math.round(Number(value) * 100) / 100;
}
