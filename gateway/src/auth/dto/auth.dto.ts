import { IsString, IsEmail, MinLength, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'user', description: 'User role', enum: ['admin', 'user'], default: 'user' })
  @IsString()
  @IsNotEmpty()
  role: 'admin' | 'user';

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'Username or email' })
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
