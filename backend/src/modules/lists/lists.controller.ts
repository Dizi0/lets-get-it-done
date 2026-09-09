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
import { ListsService } from './lists.service.js';
import { CreateListDto, UpdateListDto } from './dto/create-list.dto.js';
import {
  CurrentUser,
} from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Task Lists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all task lists for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of task lists' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.listsService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task list with its tasks' })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'Task list details with tasks' })
  @ApiResponse({ status: 404, description: 'Task list not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.listsService.findOneByUser(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task list with unique title' })
  @ApiResponse({ status: 201, description: 'Task list created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'List title already exists' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateListDto,
  ) {
    return this.listsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task list title' })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'Task list updated successfully' })
  @ApiResponse({ status: 404, description: 'Task list not found' })
  @ApiResponse({ status: 409, description: 'List title already exists' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.listsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task list and all its tasks (cascade)' })
  @ApiParam({ name: 'id', description: 'List ID' })
  @ApiResponse({ status: 200, description: 'Task list and tasks deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task list not found' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.listsService.delete(user.id, id);
  }
}
