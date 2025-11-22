import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'Username or email' })
  @IsString()
  usernameOrEmail: string;

  @ApiProperty({ example: 'StrongP@ss123' })
  @IsString()
  @MinLength(6)
  password: string;
}
