import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  const storagePath = configService.get<string>('STORAGE_LOCAL_PATH', './uploads');
  const publicUrl = configService.get<string>('STORAGE_PUBLIC_URL', '/storage');

  app.useStaticAssets(join(process.cwd(), storagePath), {
    prefix: publicUrl,
  });

  const port = Number(configService.get<string>('PORT', '3001'));
  await app.listen(port);
}

void bootstrap();
