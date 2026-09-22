import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { CreateAnswerDto } from "./dto/answer.dto";
import { AnswerService } from "./service/answer.service";

@Controller("answer")
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("audio", { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  submit(
    @CurrentUser() user: User,
    @Body() dto: CreateAnswerDto,
    @UploadedFile()
    file?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    return this.answerService.submit(
      dto.practiceId,
      dto.questionId,
      user.id,
      file,
    );
  }
}
