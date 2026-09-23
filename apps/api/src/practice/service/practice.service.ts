import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Answer, Library, Practice } from "@app/database";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ListPracticeQueryDto } from "../dto/practice.dto";
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

  async list(userId: string, query: ListPracticeQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.findPage(userId, query, page, limit),
      this.countAll(userId, query),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async create(libraryId: string, userId: string) {
    const libraryExists = await this.library.existsBy({ id: libraryId });
    if (!libraryExists) {
      throw new NotFoundException("Library not found");
    }

    const practice = await this.practice.save(
      this.practice.create({ userId, libraryId }),
    );
    return { ...practice, answers: [] };
  }

  async getById(id: string, userId: string) {
    const [practice, answers] = await Promise.all([
      this.findOwned(id, userId),
      this.answerService.listDetail(id),
    ]);
    return this.toDetail(practice, answers);
  }

  async grade(id: string, userId: string) {
    const practice = await this.findOwned(id, userId);
    const answers = await this.answerService.grade(id);
    return this.toDetail(practice, answers);
  }

  private async findOwned(id: string, userId: string) {
    const practice = await this.practice.findOne({
      where: { id, userId },
      relations: { library: true },
    });
    if (!practice) {
      throw new NotFoundException("Practice not found");
    }
    return practice;
  }

  private toDetail(
    practice: Practice,
    answers: Awaited<ReturnType<AnswerService["listDetail"]>>,
  ) {
    return {
      id: practice.id,
      libraryId: practice.libraryId,
      library: practice.library.title,
      userId: practice.userId,
      answers,
      createdAt: practice.createdAt,
      updatedAt: practice.updatedAt,
    };
  }

  private async findPage(
    userId: string,
    query: ListPracticeQueryDto,
    page: number,
    limit: number,
  ) {
    const rows = await this.filter(
      this.practice
        .createQueryBuilder("practice")
        .innerJoin("practice.library", "library")
        .innerJoin(Answer, "answer", "answer.practiceId = practice.id"),
      userId,
      query,
    )
      .select("practice.id", "id")
      .addSelect("practice.libraryId", "libraryId")
      .addSelect("practice.userId", "userId")
      .addSelect("library.title", "library")
      .addSelect("practice.createdAt", "createdAt")
      .addSelect("practice.updatedAt", "updatedAt")
      .addSelect("COUNT(answer.id)", "answerCount")
      .addSelect(
        `ROUND(AVG(CASE
          WHEN answer.grade IS NULL THEN NULL
          WHEN answer.grade->>'score' IS NOT NULL THEN (answer.grade->>'score')::float
          ELSE (
            COALESCE((answer.grade->'relevance'->>'score')::float, 0) +
            COALESCE((answer.grade->'vocabulary'->>'score')::float, 0) +
            COALESCE((answer.grade->'grammar'->>'score')::float, 0) +
            COALESCE((answer.grade->'completeness'->>'score')::float, 0)
          ) / 4.0
        END))`,
        "score",
      )
      .groupBy("practice.id")
      .addGroupBy("library.title")
      .orderBy("practice.createdAt", "DESC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      libraryId: row.libraryId,
      library: row.library,
      userId: row.userId,
      answerCount: Number(row.answerCount),
      score: row.score === null ? null : Number(row.score),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  private async countAll(userId: string, query: ListPracticeQueryDto) {
    const row = await this.filter(
      this.practice
        .createQueryBuilder("practice")
        .innerJoin("practice.library", "library")
        .innerJoin(Answer, "answer", "answer.practiceId = practice.id"),
      userId,
      query,
    )
      .select("COUNT(DISTINCT practice.id)", "total")
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private filter(
    qb: SelectQueryBuilder<Practice>,
    userId: string,
    query: ListPracticeQueryDto,
  ) {
    qb.andWhere("practice.userId = :userId", { userId });
    if (query.title) {
      qb.andWhere("library.title ILIKE :title", { title: `%${query.title}%` });
    }
    return qb;
  }
}
