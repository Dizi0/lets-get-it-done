import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Finaliser le rapport technique', description: 'Short description (required)' })
  @IsString()
  @IsNotEmpty({ message: 'Short description is required' })
  @MinLength(1, { message: 'Short description cannot be empty' })
  @MaxLength(255, { message: 'Short description cannot exceed 255 characters' })
  shortDesc: string;

  @ApiPropertyOptional({
    example: 'Détail des arbitrages architecturaux et de sécurité',
    description: 'Long description (optional)',
  })
  @IsOptional()
  @IsString()
  longDesc?: string;

  @ApiProperty({ example: '2026-09-15T18:00:00.000Z', description: 'Due date (required, ISO 8601)' })
  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string' })
  dueDate: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Finaliser le rapport technique v2' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  shortDesc?: string;

  @ApiPropertyOptional({ example: 'Mise à jour suite aux retours de l équipe' })
  @IsOptional()
  @IsString()
  longDesc?: string;

  @ApiPropertyOptional({ example: '2026-09-20T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Task completion status' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
