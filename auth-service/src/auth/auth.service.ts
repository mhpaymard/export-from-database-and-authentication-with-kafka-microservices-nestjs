import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Create user
    const user = await this.usersService.create(username, email, password, role);

    // Generate JWT token
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { usernameOrEmail, password } = loginDto;

    // Find user by username or email
    let user = await this.usersService.findByUsername(usernameOrEmail);
    if (!user) {
      user = await this.usersService.findByEmail(usernameOrEmail);
    }
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      // Get user details
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
