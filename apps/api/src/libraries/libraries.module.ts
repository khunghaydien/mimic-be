import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { LibrariesController } from "./libraries.controller";
import { LibrariesCommandService } from "./services/libraries-command.service";
import { LibrariesQueryService } from "./services/libraries-query.service";

@Module({
  imports: [TypeOrmModule.forFeature([Topic, Question])],
  controllers: [LibrariesController],
  providers: [LibrariesQueryService, LibrariesCommandService],
})
export class LibrariesModule {}
