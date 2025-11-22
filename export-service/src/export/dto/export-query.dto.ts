import { IsString, IsOptional, IsArray, IsIn, IsNumber, Min, IsDateString, IsBoolean } from 'class-validator';

export class ExportQueryDto {
  @IsString()
  table: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @IsOptional()
  @IsString()
  where?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  dateColumn?: string;

  @IsIn(['csv', 'json', 'excel', 'pdf'])
  format: 'csv' | 'json' | 'excel' | 'pdf';

  @IsOptional()
  @IsBoolean()
  download?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  token?: string; // JWT token from Gateway
}
