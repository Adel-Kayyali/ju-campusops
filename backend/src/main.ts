import { Logger } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import { createApp } from './bootstrap';

async function main(): Promise<void> {
  const app = await createApp();
  const config = app.get(AppConfigService);
  await app.listen(config.port);
  Logger.log(`CampusOps API running on http://localhost:${config.port}/api (docs: /api/docs)`, 'Bootstrap');
}

void main();
