import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { User } from "@app/database";
import { CurrentUser } from "../auth";
import { CreatePracticeDto } from "./dto/practice.dto";
import { PracticeService } from "./service/practice.service";

@Controller("practice")
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

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
}
