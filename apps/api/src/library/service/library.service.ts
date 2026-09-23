import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Library, Question } from "@app/database";
import { Repository, SelectQueryBuilder } from "typeorm";
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
    const [items, total] = await Promise.all([
      this.findPage(creatorId, query, page, limit),
      this.countAll(creatorId, query),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const [library, questions] = await Promise.all([
      this.library.findOne({
        where: { id },
        relations: { creator: true },
      }),
      this.questionService.list(id),
    ]);
    if (!library) {
      throw new NotFoundException("Library not found");
    }
    return this.toLibrary(library, library.creator.name, questions);
  }

  async create(creatorId: string, creatorName: string, dto: CreateLibraryDto) {
    const library = await this.library.save(
      this.library.create({ title: dto.title, creatorId }),
    );
    const questions = await this.questionService.createMany(
      library.id,
      dto.questions ?? [],
    );
    await this.questionService.sync(questions);
    return this.toLibrary(library, creatorName, questions);
  }

  async updateTitle(id: string, dto: UpdateLibraryTitleDto) {
    await this.library.update(id, { title: dto.title });
    const library = await this.library.findOneByOrFail({ id });
    return {
      id: library.id,
      title: library.title,
      createdAt: library.createdAt,
      updatedAt: library.updatedAt,
    };
  }

  async update(id: string, dto: UpdateLibraryDto) {
    await this.library.update(id, { title: dto.title });
    const changed = await this.questionService.replaceAll(id, dto.questions);
    await this.questionService.sync(changed);
    return this.getById(id);
  }

  async remove(id: string) {
    await this.library.delete({ id });
    return { id };
  }

  private async findPage(
    creatorId: string,
    query: ListLibraryQueryDto,
    page: number,
    limit: number,
  ) {
    const rows = await this.filter(this.library.createQueryBuilder("library"), creatorId, query)
      .innerJoin("library.creator", "creator")
      .select("library.id", "id")
      .addSelect("library.title", "title")
      .addSelect("creator.name", "creator")
      .addSelect("library.createdAt", "createdAt")
      .addSelect("library.updatedAt", "updatedAt")
      .addSelect(
        (sub) =>
          sub
            .select("COUNT(question.id)")
            .from(Question, "question")
            .where("question.libraryId = library.id"),
        "questionCount",
      )
      .orderBy("library.createdAt", "DESC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      creator: row.creator,
      questionCount: Number(row.questionCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  private countAll(creatorId: string, query: ListLibraryQueryDto) {
    return this.filter(
      this.library.createQueryBuilder("library"),
      creatorId,
      query,
    ).getCount();
  }

  private filter(
    qb: SelectQueryBuilder<Library>,
    creatorId: string,
    query: ListLibraryQueryDto,
  ) {
    if (query.mine) {
      qb.andWhere("library.creatorId = :creatorId", { creatorId });
    }
    if (query.title) {
      qb.andWhere("library.title ILIKE :title", { title: `%${query.title}%` });
    }
    return qb;
  }

  private toLibrary(library: Library, creator: string, questions: Question[]) {
    return {
      id: library.id,
      title: library.title,
      creator,
      questions,
      createdAt: library.createdAt,
      updatedAt: library.updatedAt,
    };
  }
}
