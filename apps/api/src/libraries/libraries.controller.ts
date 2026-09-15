import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { CreateLibraryDto } from "./dto/create-library.dto";
import { ListLibrariesQueryDto } from "./dto/list-libraries.query.dto";
import { UpdateLibraryDto } from "./dto/update-library.dto";
import { LibrariesCommandService } from "./services/libraries-command.service";
import { LibrariesQueryService } from "./services/libraries-query.service";

@Controller("libraries")
export class LibrariesController {
  constructor(
    private readonly librariesQueryService: LibrariesQueryService,
    private readonly librariesCommandService: LibrariesCommandService,
  ) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListLibrariesQueryDto) {
    return this.librariesQueryService.list(user.id, query);
  }

  @Get(":id")
  getById(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.librariesQueryService.getById(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateLibraryDto) {
    return this.librariesCommandService.create(user.id, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.librariesCommandService.update(id, user.id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.librariesCommandService.remove(id, user.id);
  }
}
