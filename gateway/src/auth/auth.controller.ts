import { Controller, Post, Get, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KafkaService } from '../kafka/kafka.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'user' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const response = await this.kafkaService.sendRequest(
        process.env.KAFKA_AUTH_REQUEST_TOPIC || 'auth.request',
        process.env.KAFKA_AUTH_RESPONSE_TOPIC || 'auth.response',
        {
          action: 'register',
          data: registerDto,
        },
        parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
      );

      return response.data || response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to register user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'user' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const response = await this.kafkaService.sendRequest(
        process.env.KAFKA_AUTH_REQUEST_TOPIC || 'auth.request',
        process.env.KAFKA_AUTH_RESPONSE_TOPIC || 'auth.response',
        {
          action: 'login',
          data: loginDto,
        },
        parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
      );

      return response.data || response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to login',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'john_doe' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'user' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getProfile(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new HttpException('Authorization header is required', HttpStatus.UNAUTHORIZED);
    }

    try {
      const token = authorization.replace('Bearer ', '');
      
      const response = await this.kafkaService.sendRequest(
        process.env.KAFKA_AUTH_REQUEST_TOPIC || 'auth.request',
        process.env.KAFKA_AUTH_RESPONSE_TOPIC || 'auth.response',
        {
          action: 'profile',
          token,
        },
        parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
      );

      return response.data || response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get profile',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
