import { IsString, IsOptional, IsArray, IsIn, IsNumber, Min, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExportQueryDto {
  @ApiProperty({
    description: 'Name of the database table to export',
    example: 'users',
    examples: {
      users: { value: 'users' },
      posts: { value: 'posts' },
      products: { value: 'products' },
      orders: { value: 'orders' },
    },
  })
  @IsString()
  table: string;

  @ApiPropertyOptional({
    description: 'List of columns to export (if not specified, all columns will be exported)',
    example: ['id', 'username', 'email'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiPropertyOptional({
    description: 'SQL WHERE clause for filtering (without "WHERE" keyword)',
    example: "role = 'user'",
    examples: {
      byRole: { value: "role = 'user'", description: 'Filter users by role' },
      byDate: { value: "created_at > '2024-01-01'", description: 'Filter by creation date' },
      byStatus: { value: "status = 'active'", description: 'Filter active records' },
    },
  })
  @IsOptional()
  @IsString()
  where?: string;

  @ApiPropertyOptional({
    description: 'Filter records from this date (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter records until this date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Date column to use for date filtering (defaults to created_at)',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  dateColumn?: string;

  @ApiProperty({
    description: 'Export file format',
    enum: ['csv', 'json', 'excel'],
    example: 'csv',
  })
  @IsIn(['csv', 'json', 'excel', 'pdf'])
  format: 'csv' | 'json' | 'excel' | 'pdf';

  @ApiPropertyOptional({
    description: 'If true, returns file for download. If false, returns JSON inline (only for json format)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  download?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of records to export (no hard limit, but recommended <= 10000 for performance)',
    example: 100,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip (for pagination)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
