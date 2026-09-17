import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { AiModule } from "../ai";
import { StorageModule } from "../storage";
import { LibraryOwnerGuard } from "./guards/library-owner.guard";
import { LibrariesController } from "./libraries.controller";
import { LibrariesCommandService } from "./services/libraries-command.service";
import { LibrariesQueryService } from "./services/libraries-query.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, Question]),
    AiModule,
    StorageModule,
  ],
  controllers: [LibrariesController],
  providers: [LibrariesQueryService, LibrariesCommandService, LibraryOwnerGuard],
})
export class LibrariesModule {}
