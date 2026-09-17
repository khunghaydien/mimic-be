import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { Repository } from "typeorm";
import { AiService } from "../../ai";
import { StorageService } from "../../storage";
import { CreateLibraryDto } from "../dto/create-library.dto";
import { UpdateLibraryDto } from "../dto/update-library.dto";
import { UpdateQuestionDto } from "../dto/update-question.dto";
import { UpdateTopicDto } from "../dto/update-topic.dto";
import { LibrariesQueryService } from "./libraries-query.service";

@Injectable()
export class LibrariesCommandService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly librariesQueryService: LibrariesQueryService,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  async create(creatorId: string, dto: CreateLibraryDto) {
    const { topicId, questions } =
      await this.topicsRepository.manager.transaction(async (manager) => {
        const topic = manager.create(Topic, {
          title: dto.title,
          creatorId,
        });
        const saved = await manager.save(topic);

        const questions = (dto.questions ?? []).map((item) =>
          manager.create(Question, {
            content: item.content,
            hint: item.hint?.trim() || null,
            topicId: saved.id,
          }),
        );
        if (questions.length > 0) {
          await manager.save(questions);
        }

        return { topicId: saved.id, questions };
      });

    await this.syncQuestionsAudio(topicId, questions);

    return this.librariesQueryService.getById(topicId, creatorId);
  }

  async updateTopic(id: string, creatorId: string, dto: UpdateTopicDto) {
    const topic = await this.getOwnedTopic(id, creatorId);
    topic.title = dto.title;
    await this.topicsRepository.save(topic);
    return this.librariesQueryService.getById(id, creatorId);
  }

  async update(id: string, creatorId: string, dto: UpdateLibraryDto) {
    await this.topicsRepository.manager.transaction(async (manager) => {
      const topic = await manager.findOne(Topic, {
        where: { id, creatorId },
      });
      if (!topic) {
        throw new NotFoundException("Library not found");
      }

      topic.title = dto.title;
      await manager.save(topic);

      const existing = await manager.find(Question, { where: { topicId: id } });
      const incomingIds = dto.questions
        .map((item) => item.id)
        .filter((questionId): questionId is string => Boolean(questionId));
      const keep = new Set(incomingIds);

      const toDelete = existing.filter((item) => !keep.has(item.id));
      if (toDelete.length > 0) {
        await manager.remove(toDelete);
      }

      for (const item of dto.questions) {
        const hint = item.hint?.trim() || null;
        if (item.id) {
          const question = existing.find((row) => row.id === item.id);
          if (!question) {
            throw new NotFoundException("Question not found");
          }
          question.content = item.content;
          question.hint = hint;
          await manager.save(question);
        } else {
          const question = manager.create(Question, {
            content: item.content,
            hint,
            topicId: id,
          });
          await manager.save(question);
        }
      }
    });

    const questions = await this.questionsRepository.find({
      where: { topicId: id },
    });
    await this.syncQuestionsAudio(id, questions);

    return this.librariesQueryService.getById(id, creatorId);
  }

  async updateQuestion(
    libraryId: string,
    questionId: string,
    creatorId: string,
    dto: UpdateQuestionDto,
  ) {
    await this.getOwnedTopic(libraryId, creatorId);
    const question = await this.questionsRepository.findOne({
      where: { id: questionId, topicId: libraryId },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    question.content = dto.content;
    if (dto.hint !== undefined) {
      question.hint = dto.hint.trim() === "" ? null : dto.hint.trim();
    }
    await this.questionsRepository.save(question);
    await this.syncQuestionAudio(libraryId, question);
    return this.librariesQueryService.toQuestion(question);
  }

  async removeQuestion(
    libraryId: string,
    questionId: string,
    creatorId: string,
  ) {
    await this.getOwnedTopic(libraryId, creatorId);
    const result = await this.questionsRepository.delete({
      id: questionId,
      topicId: libraryId,
    });
    if (!result.affected) {
      throw new NotFoundException("Question not found");
    }
    return { id: questionId };
  }

  async remove(id: string, creatorId: string) {
    await this.topicsRepository.manager.transaction(async (manager) => {
      await this.getOwnedTopic(id, creatorId);
      await manager.delete(Question, { topicId: id });
      await manager.delete(Topic, { id });
    });

    return { id };
  }

  private async syncQuestionsAudio(libraryId: string, questions: Question[]) {
    for (const question of questions) {
      await this.syncQuestionAudio(libraryId, question);
    }
  }

  private async syncQuestionAudio(libraryId: string, question: Question) {
    const spoken = this.buildSpokenText(question.content, question.hint);
    const audio = await this.aiService.textToSpeech(spoken);
    question.audioUrl = await this.storageService.upload({
      key: `libraries/${libraryId}/questions/${question.id}.mp3`,
      body: audio,
      contentType: "audio/mpeg",
    });
    await this.questionsRepository.save(question);
  }

  private buildSpokenText(content: string, hint: string | null): string {
    const parts = [`Question. ${content.trim()}`];
    if (hint?.trim()) {
      parts.push(`Hint. ${hint.trim()}`);
    }
    return parts.join("\n\n");
  }

  private async getOwnedTopic(id: string, creatorId: string) {
    const topic = await this.topicsRepository.findOne({
      where: { id, creatorId },
    });
    if (!topic) {
      throw new NotFoundException("Library not found");
    }
    return topic;
  }
}
