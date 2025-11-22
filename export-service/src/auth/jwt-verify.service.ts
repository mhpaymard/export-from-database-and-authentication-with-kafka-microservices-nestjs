import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface CustomJwtPayload {
  sub: number;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtVerifyService {
  private readonly JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2025'; // Same as Auth Service

  verifyToken(token: string): CustomJwtPayload {
    try {
      // Remove 'Bearer ' prefix if exists
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      const decoded = jwt.verify(cleanToken, this.JWT_SECRET);
      
      // Type assertion through unknown
      return decoded as unknown as CustomJwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  verifyAdminRole(token: string): CustomJwtPayload {
    const payload = this.verifyToken(token);
    
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Admin role required for export operations');
    }
    
    return payload;
  }
}
