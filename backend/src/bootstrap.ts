import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { LOCAL_UPLOAD_ROOT } from './modules/storage/providers/local-file.storage';

/**
 * Creates and configures the Nest application.
 * Shared by the local server (main.ts) and the Vercel serverless handler (api/index.js).
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  configureApp(app);
  await app.init();
  return app;
}

export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.corsOrigins, credentials: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (config.storageDriver === 'local') {
    app.useStaticAssets(LOCAL_UPLOAD_ROOT, { prefix: '/uploads' });
  }

  const openApi = new DocumentBuilder()
    .setTitle('CampusOps API')
    .setDescription('Smart Campus Facilities & Service Management Platform - REST API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));
}
