import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../common/validators/match.decorator.js';

export class RegisterDto {
  @ApiProperty({ example: 'Jean', description: 'User first name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'User last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@example.com', description: 'User email' })
  @IsEmail({}, { message: 'A valid email is required' })
  email: string;

  @ApiProperty({ example: 'jean.dupont@example.com', description: 'Email confirmation' })
  @IsEmail({}, { message: 'A valid confirmation email is required' })
  @Match('email', { message: 'Confirmation email must match email' })
  emailConfirmation: string;

  @ApiProperty({ example: 'Password123!', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Password123!', description: 'Password confirmation' })
  @IsString()
  @Match('password', { message: 'Confirmation password must match password' })
  passwordConfirmation: string;
}
