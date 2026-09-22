import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Library, Question } from "@app/database";
import { AiModule } from "../ai";
import { StorageModule } from "../storage";
import { LibraryGuard } from "./guard/library.guard";
import { QuestionGuard } from "./guard/question.guard";
import { LibraryController } from "./library.controller";
import { QuestionController } from "./question.controller";
import { LibraryService } from "./service/library.service";
import { QuestionService } from "./service/question.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Library, Question]),
    AiModule,
    StorageModule,
  ],
  controllers: [LibraryController, QuestionController],
  providers: [LibraryService, QuestionService, LibraryGuard, QuestionGuard],
})
export class LibraryModule {}
