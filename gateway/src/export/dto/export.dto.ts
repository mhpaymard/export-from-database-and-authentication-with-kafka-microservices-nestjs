import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportQueryDto {
  @ApiProperty({ example: 'users', description: 'Table name to export from' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiPropertyOptional({ 
    example: ['id', 'username', 'email', 'role'], 
    description: 'Columns to select (leave empty for all)',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  columns?: string[];

  @ApiPropertyOptional({ 
    example: { role: 'admin', is_active: true }, 
    description: 'WHERE conditions (key-value pairs)',
  })
  @IsObject()
  @IsOptional()
  where?: Record<string, any>;

  @ApiPropertyOptional({ example: 10, description: 'Number of records to return', default: 100 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Number of records to skip', default: 0 })
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({ 
    example: { created_at: 'DESC' }, 
    description: 'Order by (column: direction)',
  })
  @IsObject()
  @IsOptional()
  orderBy?: Record<string, 'ASC' | 'DESC'>;
}
