import { Module } from "@nestjs/common";
import { CoreModule } from "@app/core";
import { DatabaseModule } from "@app/database";
import { ApiController } from "./api.controller";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { LibrariesModule } from "./libraries/libraries.module";

@Module({
  imports: [
    CoreModule,
    DatabaseModule.forRoot(),
    HealthModule,
    AuthModule,
    LibrariesModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
