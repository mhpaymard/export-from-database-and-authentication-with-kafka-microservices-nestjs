import { Injectable, Logger } from '@nestjs/common';
import { JwtVerifyService } from '../auth/jwt-verify.service';
import { QueryBuilderService } from './query-builder.service';
import { FileGeneratorService } from './file-generator.service';
import { ExportQueryDto } from './dto/export-query.dto';

export interface ProgressCallback {
  (progress: number, message: string): void;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly jwtVerifyService: JwtVerifyService,
    private readonly queryBuilderService: QueryBuilderService,
    private readonly fileGeneratorService: FileGeneratorService,
  ) {}

  async processExportRequest(
    dto: ExportQueryDto, 
    progressCallback?: ProgressCallback,
  ): Promise<{
    success: boolean;
    data?: string;
    isBase64?: boolean;
    contentType?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      // Step 1: Verify JWT token and admin role
      if (!dto.token) {
        return {
          success: false,
          error: 'Authentication token is required',
        };
      }

      if (progressCallback) {
        progressCallback(5, 'Verifying authentication...');
      }

      this.jwtVerifyService.verifyAdminRole(dto.token);
      this.logger.log(`Admin verified for export request: table=${dto.table}, format=${dto.format}`);

      if (progressCallback) {
        progressCallback(10, 'Building query...');
      }

      // Step 2: Build WHERE clause with date filters
      let finalWhereClause = dto.where;
      
      if (dto.fromDate || dto.toDate) {
        const dateColumn = dto.dateColumn || 'created_at';
        const dateClauses: string[] = [];
        
        if (dto.fromDate) {
          dateClauses.push(`${dateColumn} >= '${dto.fromDate}'`);
        }
        if (dto.toDate) {
          dateClauses.push(`${dateColumn} <= '${dto.toDate}'`);
        }
        
        const dateFilter = dateClauses.join(' AND ');
        finalWhereClause = finalWhereClause 
          ? `(${finalWhereClause}) AND (${dateFilter})`
          : dateFilter;
      }

      if (progressCallback) {
        progressCallback(20, 'Executing database query...');
      }

      // Step 3: Execute database query
      const data = await this.queryBuilderService.executeQuery(
        dto.table,
        dto.columns,
        finalWhereClause,
        dto.limit,
        dto.offset,
      );

      this.logger.log(`Query executed: ${data.length} records retrieved from ${dto.table}`);

      if (progressCallback) {
        progressCallback(60, `Retrieved ${data.length} records. Generating ${dto.format} file...`);
      }

      // Step 3: Generate file in requested format
      const fileData = await this.fileGeneratorService.generate(data, dto.format, dto.table);
      const contentType = this.fileGeneratorService.getContentType(dto.format);
      const extension = this.fileGeneratorService.getFileExtension(dto.format);
      const filename = `${dto.table}_export.${extension}`;

      if (progressCallback) {
        progressCallback(90, 'Finalizing export...');
      }

      // Step 4: Convert to base64 for Kafka transmission
      let dataToSend: string;
      if (Buffer.isBuffer(fileData)) {
        dataToSend = fileData.toString('base64');
      } else {
        dataToSend = fileData as string;
      }

      if (progressCallback) {
        progressCallback(100, 'Export completed successfully!');
      }

      // Step 5: Return result
      return {
        success: true,
        data: dataToSend,
        isBase64: Buffer.isBuffer(fileData),
        contentType,
        filename,
      };
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Export operation failed',
      };
    }
  }

  /**
   * Get list of all available tables
   */
  async getAvailableTables(): Promise<string[]> {
    return this.queryBuilderService.getAllTables();
  }

  /**
   * Get table metadata
   */
  async getTableMetadata(tableName: string): Promise<any[]> {
    return this.queryBuilderService.getTableMetadata(tableName);
  }

  /**
   * Get complete database schema with all tables, columns, and row counts
   */
  async getDatabaseSchema(): Promise<any[]> {
    return this.queryBuilderService.getDatabaseSchema();
  }
}
