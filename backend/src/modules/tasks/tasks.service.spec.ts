import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    taskList: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    task: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  const mockUserId = 'user-1';
  const mockListId = 'list-1';
  const mockTaskId = 'task-1';

  const mockList = {
    id: mockListId,
    title: 'Work Tasks',
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask = {
    id: mockTaskId,
    shortDesc: 'Complete architecture review',
    longDesc: 'Deep dive into NestJS WebSocket gateway and rooms',
    dueDate: new Date('2026-09-15T18:00:00.000Z'),
    isCompleted: false,
    listId: mockListId,
    createdAt: new Date(),
    updatedAt: new Date(),
    list: mockList,
  };

  beforeEach(async () => {
    prisma = {
      taskList: {
        findFirst: vi.fn(),
      },
      task: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('findAllByList', () => {
    it('should return tasks when user owns the list', async () => {
      prisma.taskList.findFirst.mockResolvedValue(mockList);
      prisma.task.findMany.mockResolvedValue([mockTask]);

      const result = await service.findAllByList(mockUserId, mockListId);

      expect(prisma.taskList.findFirst).toHaveBeenCalledWith({
        where: { id: mockListId, userId: mockUserId },
      });
      expect(result).toEqual([mockTask]);
    });

    it('should throw NotFoundException when list is not owned by user', async () => {
      prisma.taskList.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllByList(mockUserId, 'unowned-list'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      shortDesc: 'New Task',
      longDesc: 'Optional details',
      dueDate: '2026-09-20T10:00:00.000Z',
    };

    it('should successfully create a task for an owned list', async () => {
      prisma.taskList.findFirst.mockResolvedValue(mockList);
      prisma.task.create.mockResolvedValue({
        ...mockTask,
        shortDesc: 'New Task',
      });

      const result = await service.create(mockUserId, mockListId, createDto);

      expect(prisma.task.create).toHaveBeenCalled();
      expect(result.shortDesc).toBe('New Task');
    });

    it('should throw NotFoundException if list not found for user', async () => {
      prisma.taskList.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockUserId, 'invalid-list', createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      isCompleted: true,
      shortDesc: 'Updated Task Name',
    };

    it('should update task if owned by user', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({
        ...mockTask,
        ...updateDto,
      });

      const result = await service.update(mockUserId, mockTaskId, updateDto);

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: expect.objectContaining({ isCompleted: true, shortDesc: 'Updated Task Name' }),
      });
      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException if task does not exist or belongs to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, 'other-task', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete task and return confirmation', async () => {
      prisma.task.findFirst.mockResolvedValue(mockTask);
      prisma.task.delete.mockResolvedValue(mockTask);

      const result = await service.delete(mockUserId, mockTaskId);

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
      expect(result).toEqual({
        message: 'Task deleted successfully',
        taskId: mockTaskId,
        listId: mockListId,
      });
    });
  });
});
