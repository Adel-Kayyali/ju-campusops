import { Injectable } from '@nestjs/common';
import { DateOnly } from '../utils/date-only';
import { AppConfigService } from '../../config/app-config.service';

/** "Today" in the campus time zone. Injected so tests can control the date. */
@Injectable()
export class CampusClock {
  constructor(private readonly config: AppConfigService) {}

  today(): Date {
    return DateOnly.today(this.config.timezone);
  }

  now(): Date {
    return new Date();
  }

  /** Day of week (0 = Sunday) and minutes since midnight, in the campus time zone. */
  localTime(now: Date = new Date()): { weekdayIndex: number; minutesOfDay: number } {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: this.config.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
    const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { weekdayIndex, minutesOfDay: Number(get('hour')) * 60 + Number(get('minute')) };
  }
}
