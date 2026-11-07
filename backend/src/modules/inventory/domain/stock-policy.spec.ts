import { MaterialStatus } from '@prisma/client';
import { StockPolicy } from './stock-policy';

describe('StockPolicy', () => {
  it('subtracts reserved units from the units on hand', () => {
    expect(StockPolicy.available(10, 4)).toBe(6);
    expect(StockPolicy.available(3, 5)).toBe(0);
  });

  it('reserves when enough stock is available, otherwise flags a shortage', () => {
    expect(StockPolicy.allocate(5, 5)).toBe(MaterialStatus.RESERVED);
    expect(StockPolicy.allocate(6, 5)).toBe(MaterialStatus.SHORTAGE);
  });

  it('flags low stock at or below the reorder level', () => {
    expect(StockPolicy.isLowStock(5, 5)).toBe(true);
    expect(StockPolicy.isLowStock(6, 5)).toBe(false);
  });

  it('orders enough to cover the shortage and refill to the reorder level', () => {
    expect(StockPolicy.suggestedOrderQuantity(3, 5)).toBe(8);
  });
});
