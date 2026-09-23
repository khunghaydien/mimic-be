import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question, User } from "@app/database";
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

    const question = await this.question.findOne({
      where: { id: request.params.id },
      relations: { library: true },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }
    if (question.library.creatorId !== request.user.id) {
      throw new ForbiddenException("Only the creator can modify this library");
    }
    return true;
  }
}
