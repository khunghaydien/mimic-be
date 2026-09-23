import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Answer, Practice, Question } from "@app/database";
import { randomUUID } from "crypto";
import { In, Repository } from "typeorm";
import { AiService } from "../../ai";
import { StorageService } from "../../storage";

type UploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

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

  list(practiceId: string) {
    return this.answer.find({
      where: { practiceId },
      order: { createdAt: "ASC" },
    });
  }

  async listDetail(practiceId: string) {
    const answers = await this.list(practiceId);
    if (answers.length === 0) {
      return [];
    }
    const questions = await this.question.find({
      where: { id: In(answers.map((answer) => answer.questionId)) },
      select: { id: true, content: true },
    });
    const content = new Map(
      questions.map((question) => [question.id, question.content]),
    );
    return answers.map((answer) => this.toDetail(answer, content));
  }

  async submit(
    practiceId: string,
    questionId: string,
    userId: string,
    file: UploadFile,
  ) {
    const [practice, question] = await Promise.all([
      this.practice.findOneBy({ id: practiceId, userId }),
      this.question.findOneBy({ id: questionId }),
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

    return this.answer.save(
      this.answer.create({
        id: answerId,
        practiceId,
        questionId,
        caption,
        audioUrl,
      }),
    );
  }

  async grade(practiceId: string) {
    const answers = await this.list(practiceId);
    if (answers.length === 0) {
      return [];
    }

    const questions = await this.question.find({
      where: { id: In(answers.map((answer) => answer.questionId)) },
      select: { id: true, content: true },
    });
    const questionText = new Map(
      questions.map((question) => [question.id, question.content]),
    );

    await Promise.all(
      answers.map(async (answer) => {
        answer.grade = await this.aiService.gradeAnswer(
          questionText.get(answer.questionId)!,
          answer.caption,
        );
      }),
    );

    const saved = await this.answer.save(answers);
    return saved.map((answer) => this.toDetail(answer, questionText));
  }

  private toDetail(
    answer: Answer,
    content: Map<string, string>,
  ) {
    return {
      id: answer.id,
      practiceId: answer.practiceId,
      questionId: answer.questionId,
      question: content.get(answer.questionId),
      caption: answer.caption,
      audioUrl: answer.audioUrl,
      grade: answer.grade,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    };
  }
}
