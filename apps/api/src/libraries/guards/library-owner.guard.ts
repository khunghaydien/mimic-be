import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Topic, User } from "@app/database";
import { Repository } from "typeorm";

@Injectable()
export class LibraryOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: User;
      params: { id: string };
    }>();

    const topic = await this.topicsRepository.findOne({
      where: { id: request.params.id },
      select: { id: true, creatorId: true },
    });
    if (!topic) {
      throw new NotFoundException("Library not found");
    }
    if (topic.creatorId !== request.user.id) {
      throw new ForbiddenException("Only the creator can modify this library");
    }

    return true;
  }
}
