import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.enableCors({
    origin: ['http://localhost:9999', `http://${process.env.HOST_IP}:9999`, 'http://chat_proxy:80', 'http://chat_proxy'], 
    credentials: true,             
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
