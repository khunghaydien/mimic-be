import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Library } from "@app/database";
import { Repository } from "typeorm";
import {
  CreateLibraryDto,
  ListLibraryQueryDto,
  UpdateLibraryDto,
  UpdateLibraryTitleDto,
} from "../dto/library.dto";
import { QuestionService } from "./question.service";

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Library)
    private readonly library: Repository<Library>,
    private readonly questionService: QuestionService,
  ) {}

  async list(creatorId: string, query: ListLibraryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.library
      .createQueryBuilder("library")
      .innerJoin("library.creator", "creator")
      .leftJoin("questions", "question", "question.library_id = library.id")
      .select("library.id", "id")
      .addSelect("library.title", "title")
      .addSelect("creator.name", "creator")
      .addSelect("library.createdAt", "createdAt")
      .addSelect("library.updatedAt", "updatedAt")
      .addSelect("COUNT(question.id)", "questionCount")
      .groupBy("library.id")
      .addGroupBy("library.title")
      .addGroupBy("library.createdAt")
      .addGroupBy("library.updatedAt")
      .addGroupBy("creator.name")
      .orderBy("library.createdAt", "DESC")
      .offset((page - 1) * limit)
      .limit(limit);

    const countQb = this.library.createQueryBuilder("library");

    if (query.mine) {
      qb.andWhere("library.creatorId = :creatorId", { creatorId });
      countQb.andWhere("library.creatorId = :creatorId", { creatorId });
    }
    if (query.title) {
      qb.andWhere("library.title ILIKE :title", { title: `%${query.title}%` });
      countQb.andWhere("library.title ILIKE :title", {
        title: `%${query.title}%`,
      });
    }

    const [rows, total] = await Promise.all([qb.getRawMany(), countQb.getCount()]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        creator: row.creator,
        questionCount: Number(row.questionCount),
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getById(id: string) {
    const library = await this.library
      .createQueryBuilder("library")
      .innerJoin("library.creator", "creator")
      .select([
        "library.id",
        "library.title",
        "library.createdAt",
        "library.updatedAt",
      ])
      .addSelect(["creator.id", "creator.name"])
      .where("library.id = :id", { id })
      .getOne();

    if (!library) {
      throw new NotFoundException("Library not found");
    }

    return {
      id: library.id,
      title: library.title,
      creator: library.creator.name,
      questions: await this.questionService.list(library.id),
      createdAt: library.createdAt.toISOString(),
      updatedAt: library.updatedAt.toISOString(),
    };
  }

  async create(creatorId: string, creatorName: string, dto: CreateLibraryDto) {
    const { library, questions } = await this.library.manager.transaction(
      async (manager) => {
        const library = await manager.save(
          manager.create(Library, {
            title: dto.title,
            creatorId,
          }),
        );
        const questions = await this.questionService.createMany(
          library.id,
          dto.questions ?? [],
          manager,
        );
        return { library, questions };
      },
    );

    await this.questionService.sync(questions);
    return {
      id: library.id,
      title: library.title,
      creator: creatorName,
      questions: questions.map((question) =>
        this.questionService.toQuestion(question),
      ),
      createdAt: library.createdAt.toISOString(),
      updatedAt: library.updatedAt.toISOString(),
    };
  }

  async updateTitle(id: string, dto: UpdateLibraryTitleDto) {
    await this.library.update(id, { title: dto.title });
    const library = await this.library.findOne({
      where: { id },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    if (!library) {
      throw new NotFoundException("Library not found");
    }
    return {
      id: library.id,
      title: library.title,
      createdAt: library.createdAt.toISOString(),
      updatedAt: library.updatedAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateLibraryDto) {
    const toSync = await this.library.manager.transaction(async (manager) => {
      await manager.update(Library, { id }, { title: dto.title });
      return this.questionService.replaceAll(id, dto.questions, manager);
    });

    await this.questionService.sync(toSync);
    return this.getById(id);
  }

  async remove(id: string) {
    await this.library.delete({ id });
    return { id };
  }
}
