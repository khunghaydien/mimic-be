import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Library, Question, User } from "@app/database";
import { Repository } from "typeorm";

@Injectable()
export class QuestionGuard implements CanActivate {
  constructor(
    @InjectRepository(Question)
    private readonly question: Repository<Question>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: User;
      params: { id: string };
    }>();

    const row = await this.question
      .createQueryBuilder("question")
      .innerJoin(Library, "library", "library.id = question.libraryId")
      .select("library.creatorId", "creatorId")
      .where("question.id = :id", { id: request.params.id })
      .getRawOne<{ creatorId: string }>();

    if (!row) {
      throw new NotFoundException("Question not found");
    }
    if (row.creatorId !== request.user.id) {
      throw new ForbiddenException("Only the creator can modify this library");
    }

    return true;
  }
}
