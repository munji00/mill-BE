import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import  compression from "compression";
import  cookieParser from "cookie-parser";
import  helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.use(compression());

  app.use(cookieParser());

  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    })
  );

  await app.listen(5000);

  console.log("Server running on port 5000");
}

bootstrap();