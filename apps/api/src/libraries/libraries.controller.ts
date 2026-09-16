import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { AiService } from "../ai";
import { CreateLibraryDto } from "./dto/create-library.dto";
import { GenerateQuestionsDto } from "./dto/generate-questions.dto";
import { ListLibrariesQueryDto } from "./dto/list-libraries.query.dto";
import { UpdateLibraryDto } from "./dto/update-library.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { LibrariesCommandService } from "./services/libraries-command.service";
import { LibrariesQueryService } from "./services/libraries-query.service";

@Controller("libraries")
export class LibrariesController {
  constructor(
    private readonly librariesQueryService: LibrariesQueryService,
    private readonly librariesCommandService: LibrariesCommandService,
    private readonly aiService: AiService,
  ) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListLibrariesQueryDto) {
    return this.librariesQueryService.list(user.id, query);
  }

  @Post("generate")
  generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.aiService.generateLibraryQuestions(dto.title);
  }

  @Get(":id")
  getById(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.librariesQueryService.getById(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLibraryDto) {
    return this.librariesCommandService.create(user.id, dto);
  }

  @Patch(":id")
  updateTopic(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.librariesCommandService.updateTopic(id, user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.librariesCommandService.update(id, user.id, dto);
  }

  @Patch(":id/questions/:questionId")
  updateQuestion(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.librariesCommandService.updateQuestion(
      id,
      questionId,
      user.id,
      dto,
    );
  }

  @Delete(":id/questions/:questionId")
  removeQuestion(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
  ) {
    return this.librariesCommandService.removeQuestion(id, questionId, user.id);
  }

  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.librariesCommandService.remove(id, user.id);
  }
}
