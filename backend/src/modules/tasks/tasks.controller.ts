import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto.js';
import {
  CurrentUser,
} from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('lists/:listId/tasks')
  @ApiOperation({ summary: 'Get all tasks for a specific list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  @ApiResponse({ status: 404, description: 'Task list not found' })
  async findAllByList(
    @CurrentUser() user: CurrentUserPayload,
    @Param('listId') listId: string,
  ) {
    return this.tasksService.findAllByList(user.id, listId);
  }

  @Post('lists/:listId/tasks')
  @ApiOperation({ summary: 'Create a new task in a list' })
  @ApiParam({ name: 'listId', description: 'List ID' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Task list not found' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, listId, dto);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get details of a specific task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(user.id, id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task (description, dueDate, completion status)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.delete(user.id, id);
  }
}
