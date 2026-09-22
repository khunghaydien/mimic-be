import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Answer, Library, Practice, Question } from "@app/database";
import { AiModule } from "../ai";
import { StorageModule } from "../storage";
import { AnswerController } from "./answer.controller";
import { PracticeController } from "./practice.controller";
import { AnswerService } from "./service/answer.service";
import { PracticeService } from "./service/practice.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Practice, Answer, Library, Question]),
    AiModule,
    StorageModule,
  ],
  controllers: [PracticeController, AnswerController],
  providers: [PracticeService, AnswerService],
})
export class PracticeModule {}
