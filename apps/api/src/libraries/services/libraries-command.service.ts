import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Question, Topic } from "@app/database";
import { Repository } from "typeorm";
import { CreateLibraryDto } from "../dto/create-library.dto";
import { UpdateLibraryDto } from "../dto/update-library.dto";
import { LibrariesQueryService } from "./libraries-query.service";

@Injectable()
export class LibrariesCommandService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    private readonly librariesQueryService: LibrariesQueryService,
  ) {}

  async create(creatorId: string, dto: CreateLibraryDto) {
    const topicId = await this.topicsRepository.manager.transaction(
      async (manager) => {
        const topic = manager.create(Topic, {
          title: dto.title,
          creatorId,
        });
        const saved = await manager.save(topic);

        const questions = (dto.questions ?? []).map((item) =>
          manager.create(Question, {
            content: item.content,
            topicId: saved.id,
          }),
        );
        if (questions.length > 0) {
          await manager.save(questions);
        }

        return saved.id;
      },
    );

    return this.librariesQueryService.getById(topicId, creatorId);
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

      await manager.delete(Question, { topicId: id });

      const questions = dto.questions.map((item) =>
        manager.create(Question, {
          content: item.content,
          topicId: id,
        }),
      );
      if (questions.length > 0) {
        await manager.save(questions);
      }
    });

    return this.librariesQueryService.getById(id, creatorId);
  }

  async remove(id: string, creatorId: string) {
    await this.topicsRepository.manager.transaction(async (manager) => {
      const topic = await manager.findOne(Topic, {
        where: { id, creatorId },
      });
      if (!topic) {
        throw new NotFoundException("Library not found");
      }

      await manager.delete(Question, { topicId: id });
      await manager.delete(Topic, { id });
    });

    return { id };
  }
}
