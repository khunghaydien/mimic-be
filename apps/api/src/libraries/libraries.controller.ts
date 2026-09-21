import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import {
  CreateLibraryDto,
  GenerateQuestionsDto,
  LibraryQuestionDto,
  ListLibrariesQueryDto,
  UpdateLibraryDto,
  UpdateLibraryTitleDto,
} from "./dto/libraries.dto";
import { LibrariesGuard } from "./guards/libraries.guard";
import { LibrariesService } from "./services/libraries.service";

@Controller("libraries")
export class LibrariesController {
  constructor(private readonly librariesService: LibrariesService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListLibrariesQueryDto) {
    return this.librariesService.list(user.id, query);
  }

  @Post("generate")
  generate(@Body() dto: GenerateQuestionsDto) {
    return this.librariesService.generate(dto.title);
  }

  @Get(":id")
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.librariesService.getById(id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLibraryDto) {
    return this.librariesService.create(user.id, dto);
  }

  @Patch(":id")
  @UseGuards(LibrariesGuard)
  updateTitle(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryTitleDto,
  ) {
    return this.librariesService.updateTitle(id, dto);
  }

  @Put(":id")
  @UseGuards(LibrariesGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.librariesService.update(id, dto);
  }

  @Patch(":id/questions/:questionId")
  @UseGuards(LibrariesGuard)
  updateQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Body() dto: LibraryQuestionDto,
  ) {
    return this.librariesService.updateQuestion(id, questionId, dto);
  }

  @Delete(":id/questions/:questionId")
  @UseGuards(LibrariesGuard)
  removeQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
  ) {
    return this.librariesService.removeQuestion(id, questionId);
  }

  @Delete(":id")
  @UseGuards(LibrariesGuard)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.librariesService.remove(id);
  }
}
