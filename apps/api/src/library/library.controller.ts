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
  ListLibraryQueryDto,
  UpdateLibraryDto,
  UpdateLibraryTitleDto,
} from "./dto/library.dto";
import { LibraryGuard } from "./guard/library.guard";
import { LibraryService } from "./service/library.service";

@Controller("library")
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListLibraryQueryDto) {
    return this.libraryService.list(user.id, query);
  }

  @Get(":id")
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.libraryService.getById(id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLibraryDto) {
    return this.libraryService.create(user.id, user.name, dto);
  }

  @Patch(":id")
  @UseGuards(LibraryGuard)
  updateTitle(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryTitleDto,
  ) {
    return this.libraryService.updateTitle(id, dto);
  }

  @Put(":id")
  @UseGuards(LibraryGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.libraryService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(LibraryGuard)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.libraryService.remove(id);
  }
}
