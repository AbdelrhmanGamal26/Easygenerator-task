import { ApiProperty } from '@nestjs/swagger';
import type { UserDocument } from '../schemas/user.schema.js';

export class UserResponseDto {
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  static from(user: UserDocument): UserResponseDto {
    return { email: user.email, name: user.name };
  }
}
