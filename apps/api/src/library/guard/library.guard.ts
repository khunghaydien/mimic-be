import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Library, User } from "@app/database";
import { Repository } from "typeorm";

@Injectable()
export class LibraryGuard implements CanActivate {
  constructor(
    @InjectRepository(Library)
    private readonly library: Repository<Library>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: User;
      params: { id: string };
    }>();

    const library = await this.library.findOne({
      where: { id: request.params.id },
      select: { id: true, creatorId: true },
    });
    if (!library) {
      throw new NotFoundException("Library not found");
    }
    if (library.creatorId !== request.user.id) {
      throw new ForbiddenException("Only the creator can modify this library");
    }
    return true;
  }
}
