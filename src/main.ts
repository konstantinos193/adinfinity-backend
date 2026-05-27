import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : true; // allow all in dev

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Invitations API')
    .setDescription('Digital wedding/event invitation platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  const host = '::';
  console.log(`>>> About to bind to ${host}:${port}`);
  await app.listen(port, host);
  console.log(`>>> BOUND on ${host}:${port} (build: ${new Date().toISOString()})`);
  console.log(`🚀 Invitations API running on http://${host}:${port}`);
  console.log(`📖 Swagger docs at http://${host}:${port}/api/docs`);
}
bootstrap();
