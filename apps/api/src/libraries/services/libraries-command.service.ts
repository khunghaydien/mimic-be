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
      });

    await this.syncQuestionsAudio(topicId, questions);

    return this.librariesQueryService.getById(topicId);
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    await this.topicsRepository.update(id, { title: dto.title });
    return this.librariesQueryService.getById(id);
  }

  async update(id: string, dto: UpdateLibraryDto) {
    await this.topicsRepository.manager.transaction(async (manager) => {
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

    const questions = await this.questionsRepository.find({
      where: { topicId: id },
    });
    await this.syncQuestionsAudio(id, questions);

    return this.librariesQueryService.getById(id);
  }

  async updateQuestion(
    libraryId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ) {
    const question = await this.questionsRepository.findOne({
      where: { id: questionId, topicId: libraryId },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    question.content = dto.content;
    if (dto.hint !== undefined) {
      question.hint = dto.hint;
    }
    await this.questionsRepository.save(question);
    await this.syncQuestionAudio(libraryId, question);
    return this.librariesQueryService.toQuestion(question);
  }

  async removeQuestion(libraryId: string, questionId: string) {
    const result = await this.questionsRepository.delete({
      id: questionId,
      topicId: libraryId,
    });
    if (!result.affected) {
      throw new NotFoundException("Question not found");
    }
    return { id: questionId };
  }

  async remove(id: string) {
    await this.topicsRepository.delete({ id });
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
    const parts = [`Question. ${content}`];
    if (hint) {
      parts.push(`Hint. ${hint}`);
    }
    return parts.join("\n\n");
  }
}
