import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { CreatePracticeDto, ListPracticeQueryDto } from "./dto/practice.dto";
import { PracticeService } from "./service/practice.service";

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListPracticeQueryDto) {
    return this.practiceService.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePracticeDto) {
    return this.practiceService.create(dto.libraryId, user.id);
  }

  @Get(":id")
  getById(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.practiceService.getById(id, user.id);
  }

  @Post(":id/grade")
  grade(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.practiceService.grade(id, user.id);
  }
}
