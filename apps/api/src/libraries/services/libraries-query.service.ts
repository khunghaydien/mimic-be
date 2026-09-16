import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { Repository } from "typeorm";
import { ListLibrariesQueryDto } from "../dto/list-libraries.query.dto";

@Injectable()
export class LibrariesQueryService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  async list(creatorId: string, query: ListLibrariesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.topicsRepository
      .createQueryBuilder("topic")
      .leftJoin("topic.creator", "creator")
      .addSelect(["creator.id", "creator.name"])
      .where("topic.creatorId = :creatorId", { creatorId })
      .orderBy("topic.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.title) {
      qb.andWhere("topic.title ILIKE :title", { title: `%${query.title}%` });
    }

    const [topics, total] = await qb.getManyAndCount();
    const questionCounts = await this.getQuestionCountsByTopicIds(
      topics.map((topic) => topic.id),
    );

    return {
      items: topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        creator: topic.creator?.name ?? "",
        questionCount: questionCounts.get(topic.id) ?? 0,
        createdAt: this.toUtcIso(topic.createdAt),
        updatedAt: this.toUtcIso(topic.updatedAt),
      })),
      meta: { page, limit, total },
    };
  }

  async getById(id: string, creatorId: string) {
    const topic = await this.topicsRepository
      .createQueryBuilder("topic")
      .leftJoin("topic.creator", "creator")
      .addSelect(["creator.id", "creator.name"])
      .where("topic.id = :id", { id })
      .andWhere("topic.creatorId = :creatorId", { creatorId })
      .getOne();

    if (!topic) {
      throw new NotFoundException("Library not found");
    }

    const questions = await this.getQuestionsByTopicId(topic.id);

    return {
      id: topic.id,
      title: topic.title,
      creator: topic.creator?.name ?? "",
      questions: questions.map((question) => this.toQuestion(question)),
      createdAt: this.toUtcIso(topic.createdAt),
      updatedAt: this.toUtcIso(topic.updatedAt),
    };
  }

  async getQuestionsByTopicId(topicId: string): Promise<Question[]> {
    return this.questionsRepository.find({
      where: { topicId },
      order: { createdAt: "ASC" },
    });
  }

  private async getQuestionCountsByTopicIds(topicIds: string[]) {
    const counts = new Map<string, number>();
    if (topicIds.length === 0) {
      return counts;
    }

    const rows = await this.questionsRepository
      .createQueryBuilder("question")
      .select("question.topicId", "topicId")
      .addSelect("COUNT(question.id)", "count")
      .where("question.topicId IN (:...topicIds)", { topicIds })
      .groupBy("question.topicId")
      .getRawMany<{ topicId: string; count: string }>();

    for (const row of rows) {
      counts.set(row.topicId, Number(row.count));
    }

    return counts;
  }

  toQuestion(question: Question) {
    return {
      id: question.id,
      content: question.content,
      hint: question.hint,
      createdAt: this.toUtcIso(question.createdAt),
      updatedAt: this.toUtcIso(question.updatedAt),
    };
  }

  private toUtcIso(date: Date): string {
    return new Date(date).toISOString();
  }
}
