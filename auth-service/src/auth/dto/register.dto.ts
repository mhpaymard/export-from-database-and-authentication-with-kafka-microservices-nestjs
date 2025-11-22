import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'StrongP@ss123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'admin'], default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}
