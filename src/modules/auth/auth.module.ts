import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { StringValue } from "ms";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    UsersModule,
    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: config.getOrThrow<string>(
            "JWT_ACCESS_EXPIRES_IN",
          ) as "15m",
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    // TenantService,
    RolesGuard,
  ],
})
export class AuthModule { }