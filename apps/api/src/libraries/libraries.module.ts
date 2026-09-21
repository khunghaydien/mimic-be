import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { AiModule } from "../ai";
import { StorageModule } from "../storage";
import { LibrariesGuard } from "./guards/libraries.guard";
import { LibrariesController } from "./libraries.controller";
import { LibrariesService } from "./services/libraries.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, Question]),
    AiModule,
    StorageModule,
  ],
  controllers: [LibrariesController],
  providers: [LibrariesService, LibrariesGuard],
})
export class LibrariesModule {}
