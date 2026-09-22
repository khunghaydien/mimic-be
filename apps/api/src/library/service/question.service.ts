import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question } from "@app/database";
import { EntityManager, Repository } from "typeorm";
import { AiService } from "../../ai";
import { StorageService } from "../../storage";
import { QuestionDto, SavedQuestionDto } from "../dto/question.dto";

const TTS_BATCH = 5;

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly question: Repository<Question>,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  generate(title: string) {
    return this.aiService.generateLibraryQuestions(title);
  }

  async list(libraryId: string) {
    const questions = await this.question.find({
      where: { libraryId },
      order: { createdAt: "ASC" },
    });
    return questions.map((question) => this.toQuestion(question));
  }

  async createMany(
    libraryId: string,
    items: QuestionDto[],
    manager: EntityManager,
  ) {
    if (items.length === 0) {
      return [];
    }
    return manager.save(
      items.map((item) =>
        manager.create(Question, {
          content: item.content,
          hint: item.hint ?? null,
          libraryId,
        }),
      ),
    );
  }

  async replaceAll(
    libraryId: string,
    items: SavedQuestionDto[],
    manager: EntityManager,
  ) {
    const existing = await manager.find(Question, { where: { libraryId } });
    const keep = new Set(
      items
        .map((item) => item.id)
        .filter((questionId): questionId is string => Boolean(questionId)),
    );
    const removed = existing.filter((item) => !keep.has(item.id));
    if (removed.length > 0) {
      await manager.remove(removed);
    }

    const toSave: Question[] = [];
    const toSync: Question[] = [];

    for (const item of items) {
      const hint = item.hint ?? null;
      if (item.id) {
        const question = existing.find((row) => row.id === item.id);
        if (!question) {
          throw new NotFoundException("Question not found");
        }
        const changed = question.content !== item.content || question.hint !== hint;
        question.content = item.content;
        question.hint = hint;
        toSave.push(question);
        if (changed) {
          toSync.push(question);
        }
      } else {
        const question = manager.create(Question, {
          content: item.content,
          hint,
          libraryId,
        });
        toSave.push(question);
        toSync.push(question);
      }
    }

    if (toSave.length > 0) {
      await manager.save(toSave);
    }
    return toSync;
  }

  async update(id: string, dto: QuestionDto) {
    const question = await this.question.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const hint = dto.hint === undefined ? question.hint : dto.hint;
    const changed = question.content !== dto.content || question.hint !== hint;
    question.content = dto.content;
    question.hint = hint;
    await this.question.save(question);
    if (changed) {
      await this.sync([question]);
    }
    return this.toQuestion(question);
  }

  async remove(id: string) {
    const result = await this.question.delete({ id });
    if (!result.affected) {
      throw new NotFoundException("Question not found");
    }
    return { id };
  }

  async sync(questions: Question[]) {
    for (let i = 0; i < questions.length; i += TTS_BATCH) {
      await Promise.all(
        questions.slice(i, i + TTS_BATCH).map((question) => this.syncOne(question)),
      );
    }
  }

  toQuestion(question: Question) {
    return {
      id: question.id,
      content: question.content,
      hint: question.hint,
      audioUrl: question.audioUrl,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  private async syncOne(question: Question) {
    const parts = [`Question. ${question.content}`];
    if (question.hint) {
      parts.push(`Hint. ${question.hint}`);
    }
    const audio = await this.aiService.textToSpeech(parts.join("\n\n"));
    question.audioUrl = await this.storageService.upload({
      key: `libraries/${question.libraryId}/questions/${question.id}.mp3`,
      body: audio,
      contentType: "audio/mpeg",
    });
    await this.question.save(question);
  }
}
