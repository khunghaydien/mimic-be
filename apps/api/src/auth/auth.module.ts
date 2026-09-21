import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@app/database";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./guards/auth.guard";
import { AuthStrategy } from "./guards/auth.strategy";
import {
  getAccessTokenExpiresIn,
  getAccessTokenSecret,
  getRefreshTokenSecret,
} from "./guards/auth.config";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        getRefreshTokenSecret();
        return {
          secret: getAccessTokenSecret(),
          signOptions: {
            expiresIn: getAccessTokenExpiresIn(),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthStrategy,
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthGuard],
})
export class AuthModule {}
