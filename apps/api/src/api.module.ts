import { Module } from "@nestjs/common";
import { CoreModule } from "@app/core";
import { DatabaseModule } from "@app/database";
import { ApiController } from "./api.controller";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { LibraryModule } from "./library/library.module";
import { PracticeModule } from "./practice/practice.module";

@Module({
  imports: [
    CoreModule,
    DatabaseModule.forRoot(),
    HealthModule,
    AuthModule,
    LibraryModule,
    PracticeModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
