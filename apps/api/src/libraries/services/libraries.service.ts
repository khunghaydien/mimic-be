import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { Repository } from "typeorm";
import { AiService } from "../../ai";
import { StorageService } from "../../storage";
import {
  CreateLibraryDto,
  ListLibrariesQueryDto,
  UpdateLibraryDto,
  UpdateLibraryTitleDto,
  LibraryQuestionDto,
} from "../dto/libraries.dto";

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(Topic)
    private readonly topics: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  generate(title: string) {
    return this.aiService.generateLibraryQuestions(title);
  }

  async list(creatorId: string, query: ListLibrariesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.topics
      .createQueryBuilder("topic")
      .innerJoin("topic.creator", "creator")
      .addSelect(["creator.id", "creator.name"])
      .orderBy("topic.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.mine) {
      qb.andWhere("topic.creatorId = :creatorId", { creatorId });
    }
    if (query.title) {
      qb.andWhere("topic.title ILIKE :title", { title: `%${query.title}%` });
    }

    const [topics, total] = await qb.getManyAndCount();
    const questionCounts = await this.getQuestionCounts(
      topics.map((topic) => topic.id),
    );

    return {
      items: topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        creator: topic.creator.name,
        questionCount: questionCounts.get(topic.id) ?? 0,
        createdAt: topic.createdAt.toISOString(),
        updatedAt: topic.updatedAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getById(id: string) {
    const topic = await this.topics
      .createQueryBuilder("topic")
      .innerJoin("topic.creator", "creator")
      .addSelect(["creator.id", "creator.name"])
      .where("topic.id = :id", { id })
      .getOne();

    if (!topic) {
      throw new NotFoundException("Library not found");
    }

    const questions = await this.questions.find({
      where: { topicId: topic.id },
      order: { createdAt: "ASC" },
    });

    return {
      id: topic.id,
      title: topic.title,
      creator: topic.creator.name,
      questions: questions.map((question) => this.toQuestion(question)),
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
    };
  }

  async create(creatorId: string, dto: CreateLibraryDto) {
    const { topicId, questions } = await this.topics.manager.transaction(
      async (manager) => {
        const saved = await manager.save(
          manager.create(Topic, {
            title: dto.title,
            creatorId,
          }),
        );
        const questions = (dto.questions ?? []).map((item) =>
          manager.create(Question, {
            content: item.content,
            hint: item.hint ?? null,
            topicId: saved.id,
          }),
        );
        await manager.save(questions);
        return { topicId: saved.id, questions };
      },
    );

    await this.syncQuestionsAudio(topicId, questions);
    return this.getById(topicId);
  }

  async updateTitle(id: string, dto: UpdateLibraryTitleDto) {
    await this.topics.update(id, { title: dto.title });
    return this.getById(id);
  }

  async update(id: string, dto: UpdateLibraryDto) {
    await this.topics.manager.transaction(async (manager) => {
      await manager.update(Topic, { id }, { title: dto.title });

      const existing = await manager.find(Question, { where: { topicId: id } });
      const keep = new Set(
        dto.questions
          .map((item) => item.id)
          .filter((questionId): questionId is string => Boolean(questionId)),
      );
      await manager.remove(existing.filter((item) => !keep.has(item.id)));

      for (const item of dto.questions) {
        const hint = item.hint ?? null;
        if (item.id) {
          const question = existing.find((row) => row.id === item.id);
          if (!question) {
            throw new NotFoundException("Question not found");
          }
          question.content = item.content;
          question.hint = hint;
          await manager.save(question);
        } else {
          await manager.save(
            manager.create(Question, {
              content: item.content,
              hint,
              topicId: id,
            }),
          );
        }
      }
    });

    const questions = await this.questions.find({ where: { topicId: id } });
    await this.syncQuestionsAudio(id, questions);
    return this.getById(id);
  }

  async updateQuestion(
    libraryId: string,
    questionId: string,
    dto: LibraryQuestionDto,
  ) {
    const question = await this.questions.findOne({
      where: { id: questionId, topicId: libraryId },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    question.content = dto.content;
    if (dto.hint !== undefined) {
      question.hint = dto.hint;
    }
    await this.questions.save(question);
    await this.syncQuestionAudio(libraryId, question);
    return this.toQuestion(question);
  }

  async removeQuestion(libraryId: string, questionId: string) {
    const result = await this.questions.delete({
      id: questionId,
      topicId: libraryId,
    });
    if (!result.affected) {
      throw new NotFoundException("Question not found");
    }
    return { id: questionId };
  }

  async remove(id: string) {
    await this.topics.delete({ id });
    return { id };
  }

  private async getQuestionCounts(topicIds: string[]) {
    const counts = new Map<string, number>();
    if (topicIds.length === 0) {
      return counts;
    }

    const rows = await this.questions
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

  private toQuestion(question: Question) {
    return {
      id: question.id,
      content: question.content,
      hint: question.hint,
      audioUrl: question.audioUrl,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  private async syncQuestionsAudio(libraryId: string, questions: Question[]) {
    for (const question of questions) {
      await this.syncQuestionAudio(libraryId, question);
    }
  }

  private async syncQuestionAudio(libraryId: string, question: Question) {
    const parts = [`Question. ${question.content}`];
    if (question.hint) {
      parts.push(`Hint. ${question.hint}`);
    }
    const audio = await this.aiService.textToSpeech(parts.join("\n\n"));
    question.audioUrl = await this.storageService.upload({
      key: `libraries/${libraryId}/questions/${question.id}.mp3`,
      body: audio,
      contentType: "audio/mpeg",
    });
    await this.questions.save(question);
  }
}
