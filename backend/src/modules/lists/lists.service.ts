import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateListDto, UpdateListDto } from './dto/create-list.dto.js';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.taskList.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async findOneByUser(userId: string, listId: string) {
    const list = await this.prisma.taskList.findFirst({
      where: { id: listId, userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`Task list not found`);
    }

    return list;
  }

  async create(userId: string, dto: CreateListDto) {
    const trimmedTitle = dto.title.trim();

    const existingList = await this.prisma.taskList.findUnique({
      where: {
        userId_title: {
          userId,
          title: trimmedTitle,
        },
      },
    });

    if (existingList) {
      throw new ConflictException(
        `A list with the title "${trimmedTitle}" already exists`,
      );
    }

    return this.prisma.taskList.create({
      data: {
        title: trimmedTitle,
        userId,
      },
    });
  }

  async update(userId: string, listId: string, dto: UpdateListDto) {
    await this.findOneByUser(userId, listId);

    const trimmedTitle = dto.title.trim();
    const existingWithSameTitle = await this.prisma.taskList.findUnique({
      where: {
        userId_title: {
          userId,
          title: trimmedTitle,
        },
      },
    });

    if (existingWithSameTitle && existingWithSameTitle.id !== listId) {
      throw new ConflictException(
        `A list with the title "${trimmedTitle}" already exists`,
      );
    }

    return this.prisma.taskList.update({
      where: { id: listId },
      data: { title: trimmedTitle },
    });
  }

  async delete(userId: string, listId: string) {
    await this.findOneByUser(userId, listId);

    await this.prisma.taskList.delete({
      where: { id: listId },
    });

    return { message: 'List and associated tasks deleted successfully', listId };
  }
}
