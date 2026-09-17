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
  UseGuards,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { AiService } from "../ai";
import { CreateLibraryDto } from "./dto/create-library.dto";
import { GenerateQuestionsDto } from "./dto/generate-questions.dto";
import { ListLibrariesQueryDto } from "./dto/list-libraries.query.dto";
import { LibraryOwnerGuard } from "./guards/library-owner.guard";
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
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.librariesQueryService.getById(id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLibraryDto) {
    return this.librariesCommandService.create(user.id, dto);
  }

  @Patch(":id")
  @UseGuards(LibraryOwnerGuard)
  updateTopic(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.librariesCommandService.updateTopic(id, dto);
  }

  @Put(":id")
  @UseGuards(LibraryOwnerGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.librariesCommandService.update(id, dto);
  }

  @Patch(":id/questions/:questionId")
  @UseGuards(LibraryOwnerGuard)
  updateQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.librariesCommandService.updateQuestion(id, questionId, dto);
  }

  @Delete(":id/questions/:questionId")
  @UseGuards(LibraryOwnerGuard)
  removeQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
  ) {
    return this.librariesCommandService.removeQuestion(id, questionId);
  }

  @Delete(":id")
  @UseGuards(LibraryOwnerGuard)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.librariesCommandService.remove(id);
  }
}
