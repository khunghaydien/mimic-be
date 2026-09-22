import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GenerateQuestionsDto, QuestionDto } from "./dto/question.dto";
import { QuestionGuard } from "./guard/question.guard";
import { QuestionService } from "./service/question.service";

@Controller("question")
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post("generate")
  generate(@Body() dto: GenerateQuestionsDto) {
    return this.questionService.generate(dto.title);
  }

  @Patch(":id")
  @UseGuards(QuestionGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: QuestionDto,
  ) {
    return this.questionService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(QuestionGuard)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.questionService.remove(id);
  }
}
