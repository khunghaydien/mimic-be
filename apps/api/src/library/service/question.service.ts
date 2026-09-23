import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question } from "@app/database";
import { In, Repository } from "typeorm";
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

  list(libraryId: string) {
    return this.question.find({
      where: { libraryId },
      order: { createdAt: "ASC" },
    });
  }

  async createMany(libraryId: string, items: QuestionDto[]) {
    return this.question.save(
      items.map((item) =>
        this.question.create({
          content: item.content,
          hint: item.hint ?? null,
          libraryId,
        }),
      ),
    );
  }

  async replaceAll(libraryId: string, items: SavedQuestionDto[]) {
    const current = await this.question.find({ where: { libraryId } });
    await this.deleteRemoved(current, items);
    return this.saveIncoming(libraryId, current, items);
  }

  async update(id: string, dto: QuestionDto) {
    const question = await this.question.findOneByOrFail({ id });
    const hint = dto.hint === undefined ? question.hint : dto.hint;
    const contentChanged = question.content !== dto.content;
    const hintChanged = question.hint !== hint;
    question.content = dto.content;
    question.hint = hint;
    if (contentChanged || hintChanged) {
      await this.sync([question]);
    } else {
      await this.question.save(question);
    }
    return question;
  }

  async remove(id: string) {
    await this.question.delete({ id });
    return { id };
  }

  async sync(questions: Question[]) {
    for (let i = 0; i < questions.length; i += TTS_BATCH) {
      const batch = questions.slice(i, i + TTS_BATCH);
      await Promise.all(batch.map((question) => this.attachAudio(question)));
      await this.question.save(batch);
    }
  }

  private async deleteRemoved(
    current: Question[],
    items: SavedQuestionDto[],
  ) {
    const keepIds = new Set(items.map((item) => item.id).filter(Boolean));
    const removedIds = current
      .filter((question) => !keepIds.has(question.id))
      .map((question) => question.id);
    if (removedIds.length > 0) {
      await this.question.delete({ id: In(removedIds) });
    }
  }

  private async saveIncoming(
    libraryId: string,
    current: Question[],
    items: SavedQuestionDto[],
  ) {
    const currentById = new Map(
      current.map((question) => [question.id, question]),
    );
    const needAudio: Question[] = [];
    const toSave = items.map((item) => {
      const question = item.id
        ? currentById.get(item.id)
        : this.question.create({ libraryId });
      if (!question) {
        throw new NotFoundException("Question not found");
      }

      const hint = item.hint ?? null;
      const isNew = !item.id;
      const contentChanged = question.content !== item.content;
      const hintChanged = question.hint !== hint;
      if (isNew || contentChanged || hintChanged) {
        needAudio.push(question);
      }

      question.content = item.content;
      question.hint = hint;
      return question;
    });

    await this.question.save(toSave);
    return needAudio;
  }

  private async attachAudio(question: Question) {
    const text = question.hint
      ? `Question. ${question.content}\n\nHint. ${question.hint}`
      : `Question. ${question.content}`;
    const audio = await this.aiService.textToSpeech(text);
    question.audioUrl = await this.storageService.upload({
      key: `libraries/${question.libraryId}/questions/${question.id}.mp3`,
      body: audio,
      contentType: "audio/mpeg",
    });
  }
}
