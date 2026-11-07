import type { PageParams } from '@/api/types';
import type { BuildingRef, UserRef } from '@/shared/types/common';
import type { LockerSize, LockerStatus, PaymentMethod, SubscriptionState, SubscriptionStatus } from '@/shared/types/enums';

export interface LockerOccupancy {
  subscriptionId: string;
  student: UserRef;
  startDate: string;
  endDate: string;
  state: SubscriptionState;
  daysRemaining: number;
}

export interface Locker {
  id: string;
  code: string;
  building: BuildingRef;
  floor: number;
  zone: string;
  size: LockerSize;
  monthlyFee: number;
  isOutOfService: boolean;
  outOfServiceNote: string | null;
  status: LockerStatus;
  occupancy: LockerOccupancy | null;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string;
  periodStart: string;
  periodEnd: string;
  receivedBy: string;
  receivedAt: string;
}

export interface Subscription {
  id: string;
  locker: { id: string; code: string; building: BuildingRef; floor: number; zone: string; size: LockerSize };
  student: UserRef;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  state: SubscriptionState;
  daysRemaining: number;
  totalPaid: number;
  payments: Payment[];
  notes: string | null;
  createdBy: string;
  endedAt: string | null;
  endedBy: string | null;
  endReason: string | null;
  createdAt: string;
}

export interface LockerDetail {
  locker: Locker;
  history: Subscription[];
}

export interface LockerSummary {
  totalLockers: number;
  byStatus: { status: LockerStatus; count: number }[];
  occupancyRate: number;
  expiringThisWeek: number;
  activeSubscriptions: number;
  cashCollectedThisMonth: number;
}

export interface LockerQuery extends PageParams {
  code?: string;
  student?: string;
  buildingId?: string;
  floor?: number;
  zone?: string;
  lockerSize?: LockerSize;
  status?: LockerStatus;
  endsFrom?: string;
  endsTo?: string;
}

/** Either a number of months (preset) or an explicit end date. */
export interface PeriodInput {
  startDate: string;
  durationMonths?: number;
  endDate?: string;
}

export interface Quote {
  startDate: string;
  endDate: string;
  days: number;
  billableMonths: number;
  monthlyFee: number;
  amount: number;
  conflict: { subscriptionId: string; startDate: string; endDate: string } | null;
}

export interface StartSubscriptionInput extends PeriodInput {
  lockerId: string;
  studentId: string;
  paymentMethod?: PaymentMethod;
  amountOverride?: number;
  receiptNumber?: string;
  notes?: string;
}

export interface ExtendSubscriptionInput {
  durationMonths?: number;
  newEndDate?: string;
  amountOverride?: number;
  receiptNumber?: string;
}

export interface LockerInput {
  code: string;
  buildingId: string;
  floor: number;
  zone: string;
  size: LockerSize;
  monthlyFee: number;
}

/** Durations offered as quick picks (same as the backend's LockerRules). */
export const PRESET_DURATIONS = [1, 2, 3, 4] as const;
