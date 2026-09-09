import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'e3b0c442-98fc-1c14-9afb-4c7ecbc22f25' })
  id: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: 'Jean' })
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  lastName: string;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
