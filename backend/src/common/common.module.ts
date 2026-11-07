import { Global, Module } from '@nestjs/common';
import { CampusClock } from './time/campus-clock';

/** Cross-cutting helpers available to every module. */
@Global()
@Module({
  providers: [CampusClock],
  exports: [CampusClock],
})
export class CommonModule {}
