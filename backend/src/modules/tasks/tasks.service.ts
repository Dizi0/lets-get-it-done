import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByList(userId: string, listId: string) {
    // Verify list belongs to user
    const list = await this.prisma.taskList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException(`Task list not found`);
    }

    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        list: { userId },
      },
      include: {
        list: {
          select: { id: true, title: true, userId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    return task;
  }

  async create(userId: string, listId: string, dto: CreateTaskDto) {
    // Verify list belongs to user
    const list = await this.prisma.taskList.findFirst({
      where: { id: listId, userId },
    });

    if (!list) {
      throw new NotFoundException(`Task list not found`);
    }

    return this.prisma.task.create({
      data: {
        shortDesc: dto.shortDesc.trim(),
        longDesc: dto.longDesc ? dto.longDesc.trim() : null,
        dueDate: new Date(dto.dueDate),
        listId,
      },
    });
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    // Ensure task belongs to a list owned by user
    await this.findOne(userId, taskId);

    const updateData: Record<string, any> = {};
    if (dto.shortDesc !== undefined) updateData.shortDesc = dto.shortDesc.trim();
    if (dto.longDesc !== undefined) updateData.longDesc = dto.longDesc ? dto.longDesc.trim() : null;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.isCompleted !== undefined) updateData.isCompleted = dto.isCompleted;

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  async delete(userId: string, taskId: string) {
    const task = await this.findOne(userId, taskId);

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return {
      message: 'Task deleted successfully',
      taskId: task.id,
      listId: task.listId,
    };
  }
}
