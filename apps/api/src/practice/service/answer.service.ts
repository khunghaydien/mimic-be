import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Answer, Practice, Question } from "@app/database";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { AiService } from "../../ai";
import { StorageService } from "../../storage";

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private readonly answer: Repository<Answer>,
    @InjectRepository(Practice)
    private readonly practice: Repository<Practice>,
    @InjectRepository(Question)
    private readonly question: Repository<Question>,
    private readonly aiService: AiService,
    private readonly storageService: StorageService,
  ) {}

  async list(practiceId: string) {
    const answers = await this.answer.find({
      where: { practiceId },
      order: { createdAt: "ASC" },
      select: {
        id: true,
        practiceId: true,
        questionId: true,
        caption: true,
        audioUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return answers.map((answer) => this.toAnswer(answer));
  }

  async submit(
    practiceId: string,
    questionId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const [practice, question] = await Promise.all([
      this.practice.findOne({
        where: { id: practiceId, userId },
        select: { id: true, libraryId: true },
      }),
      this.question.findOne({
        where: { id: questionId },
        select: { id: true, libraryId: true },
      }),
    ]);
    if (!practice) {
      throw new NotFoundException("Practice not found");
    }
    if (!question || question.libraryId !== practice.libraryId) {
      throw new NotFoundException("Question not found");
    }

    const answerId = randomUUID();
    const [audioUrl, caption] = await Promise.all([
      this.storageService.upload({
        key: `libraries/${practice.libraryId}/practices/${practiceId}/answers/${answerId}/${file.originalname}`,
        body: file.buffer,
        contentType: file.mimetype,
      }),
      this.aiService.speechToText({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
      }),
    ]);

    const saved = await this.answer.save(
      this.answer.create({
        id: answerId,
        practiceId,
        questionId,
        caption,
        audioUrl,
      }),
    );

    return this.toAnswer(saved);
  }

  toAnswer(answer: Answer) {
    return {
      id: answer.id,
      practiceId: answer.practiceId,
      questionId: answer.questionId,
      caption: answer.caption,
      audioUrl: answer.audioUrl,
      createdAt: answer.createdAt.toISOString(),
      updatedAt: answer.updatedAt.toISOString(),
    };
  }
}
