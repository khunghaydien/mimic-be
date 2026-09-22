import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Library, Practice } from "@app/database";
import { Repository } from "typeorm";
import { AnswerService } from "./answer.service";

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(Practice)
    private readonly practice: Repository<Practice>,
    @InjectRepository(Library)
    private readonly library: Repository<Library>,
    private readonly answerService: AnswerService,
  ) {}

  async create(libraryId: string, userId: string) {
    const exists = await this.library.exists({ where: { id: libraryId } });
    if (!exists) {
      throw new NotFoundException("Library not found");
    }

    const saved = await this.practice.save(
      this.practice.create({ userId, libraryId }),
    );

    return {
      id: saved.id,
      libraryId: saved.libraryId,
      userId: saved.userId,
      answers: [],
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async getById(id: string, userId: string) {
    const [practice, answers] = await Promise.all([
      this.practice.findOne({
        where: { id, userId },
        select: {
          id: true,
          libraryId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.answerService.list(id),
    ]);
    if (!practice) {
      throw new NotFoundException("Practice not found");
    }

    return {
      id: practice.id,
      libraryId: practice.libraryId,
      userId: practice.userId,
      answers,
      createdAt: practice.createdAt.toISOString(),
      updatedAt: practice.updatedAt.toISOString(),
    };
  }
}
