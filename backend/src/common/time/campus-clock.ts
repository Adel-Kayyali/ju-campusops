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
}
