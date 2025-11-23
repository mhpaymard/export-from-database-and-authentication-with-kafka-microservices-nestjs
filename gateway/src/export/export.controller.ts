import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  Res,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { KafkaService } from '../kafka/kafka.service';
import { ExportQueryDto } from './dto/export-query.dto';

@ApiTags('Export')
@Controller('api/export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly kafkaService: KafkaService) {}

  @Post('query')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Export database table data',
    description: `
Export data from any database table with filtering and pagination support.
**Only admin users can perform export operations.**

### Available Formats:
- **JSON** - Parsed JavaScript object array (inline)
- **CSV** - Comma-separated values (download or inline)
- **Excel** - Microsoft Excel XLSX format (download or inline)
- **PDF** - Adobe PDF with formatted table (download or inline)

### Download Modes:
- **download: false** (default) - Returns JSON response with data/base64
- **download: true** - Returns file attachment for direct download (CSV, Excel, PDF)

### Date Filtering:
- **fromDate** - Filter records from this date (ISO 8601)
- **toDate** - Filter records until this date (ISO 8601)
- **dateColumn** - Column to filter on (default: 'created_at')

### Available Tables:
- **users** - User accounts (columns: id, username, email, role, created_at, updated_at)

**Note:** For other tables, use Schema API (POST /api/export/schema) to see available columns.

### Examples:

**Export all users as JSON:**
\`\`\`json
{
  "table": "users",
  "format": "json"
}
\`\`\`

**Download PDF with specific columns:**
\`\`\`json
{
  "table": "users",
  "format": "pdf",
  "download": true,
  "columns": ["id", "username", "email", "role"]
}
\`\`\`

**Export with date filter:**
\`\`\`json
{
  "table": "users",
  "format": "pdf",
  "download": true,
  "fromDate": "2025-11-22T00:00:00.000Z",
  "toDate": "2025-11-22T23:59:59.999Z"
}
\`\`\`

**Export with custom WHERE clause:**
\`\`\`json
{
  "table": "users",
  "where": "role = 'admin'",
  "format": "excel",
  "download": true
}
\`\`\`

### Response Format:
- **If download=true**: File attachment (PDF/CSV/Excel)
- **If download=false**: JSON object with:
  - **success**: boolean
  - **table**: table name
  - **format**: export format
  - **recordCount**: number of records
  - **data**: parsed array (JSON) or base64 string (CSV/Excel/PDF)
    `,
  })
  @ApiBody({
    type: ExportQueryDto,
    examples: {
      allUsers: {
        summary: 'Export all users',
        value: {
          table: 'users',
          format: 'json',
        },
      },
      specificColumns: {
        summary: 'Export specific columns',
        value: {
          table: 'users',
          columns: ['id', 'username', 'email', 'role'],
          format: 'json',
        },
      },
      withFilter: {
        summary: 'Export with filter',
        value: {
          table: 'users',
          where: "role = 'user'",
          format: 'json',
        },
      },
      withPagination: {
        summary: 'Export with pagination',
        value: {
          table: 'users',
          format: 'json',
          limit: 50,
          offset: 0,
        },
      },
      csvFormat: {
        summary: 'Export as CSV (returns base64)',
        value: {
          table: 'users',
          format: 'csv',
        },
      },
      excelFormat: {
        summary: 'Export as Excel (returns base64)',
        value: {
          table: 'users',
          format: 'excel',
        },
      },
      pdfFormat: {
        summary: 'Export as PDF (returns base64)',
        value: {
          table: 'users',
          format: 'pdf',
          limit: 50,
        },
      },
      pdfDownload: {
        summary: 'Download PDF file directly',
        value: {
          table: 'users',
          format: 'pdf',
          download: true,
          columns: ['id', 'username', 'email', 'role', 'created_at'],
          limit: 100,
        },
      },
      dateFilteredPDF: {
        summary: 'PDF with date filter',
        value: {
          table: 'users',
          format: 'pdf',
          download: true,
          fromDate: '2025-11-22T00:00:00.000Z',
          toDate: '2025-11-22T23:59:59.999Z',
          dateColumn: 'created_at',
        },
      },
      csvDownload: {
        summary: 'Download CSV file directly',
        value: {
          table: 'users',
          format: 'csv',
          download: true,
        },
      },
      excelDownload: {
        summary: 'Download Excel file directly',
        value: {
          table: 'users',
          format: 'excel',
          download: true,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Export successful - JSON response with data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        table: { type: 'string', example: 'users' },
        format: { type: 'string', example: 'json' },
        recordCount: { type: 'number', example: 5 },
        data: {
          oneOf: [
            {
              type: 'array',
              description: 'For JSON format - array of objects',
              items: {
                type: 'object',
                example: {
                  id: 1,
                  username: 'admin',
                  email: 'admin@example.com',
                  role: 'admin',
                },
              },
            },
            {
              type: 'string',
              description: 'For CSV/Excel format - base64 encoded string',
              example: 'aWQsdXNlcm5hbWUsZW1haWwscm9sZQ0KMSxhZG1pbixhZG1pbkBleGFtcGxlLmNvbSxhZG1pbg==',
            },
          ],
        },
        contentType: { type: 'string', example: 'application/json' },
        filename: { type: 'string', example: 'users_export.json' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid table/columns' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async exportData(
    @Body() exportQueryDto: ExportQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Get JWT token from request
      const token = req.headers.authorization;
      
      if (!token) {
        throw new HttpException('Authorization token is required', HttpStatus.UNAUTHORIZED);
      }

      // Send request to Export Service via Kafka
      const result = await this.kafkaService.sendRequest<{
        success: boolean;
        data?: string;
        isBase64?: boolean;
        contentType?: string;
        filename?: string;
        format?: string;
        error?: string;
      }>(
        'export.request',
        'export.response',
        {
          ...exportQueryDto,
          token, // Pass JWT token to Export Service for verification
        },
        'ExportQueryRequest',
        60000, // 60 seconds timeout (exports can take time)
      );

      // Response is already decoded from Protobuf by KafkaService
      // Check if export was successful
      if (!result.success || result.error) {
        throw new HttpException(
          result.error || 'Export failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const actualFormat = result.format || exportQueryDto.format;
      
      // Protobuf bytes field is decoded as base64 string
      // We need to convert it back to the original format
      let parsedData: any;
      let buffer: Buffer;

      if (result.data) {
        // Decode base64 to Buffer
        buffer = Buffer.from(result.data, 'base64');
        
        // For JSON format: Buffer → string → JSON parse
        if (actualFormat === 'json') {
          const jsonString = buffer.toString('utf-8');
          try {
            parsedData = JSON.parse(jsonString);
          } catch (e) {
            this.logger.error('Failed to parse JSON from buffer:', e);
            parsedData = jsonString;
          }
        } else {
          // For CSV: also convert to string
          if (actualFormat === 'csv') {
            parsedData = buffer.toString('utf-8');
          } else {
            // For PDF/Excel: keep as buffer
            parsedData = buffer;
          }
        }
      }

      // Handle download mode
      if (exportQueryDto.download && actualFormat !== 'json') {
        // For CSV, Excel, and PDF: send as downloadable file
        res.set({
          'Content-Type': result.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${result.filename || 'export.' + actualFormat}"`,
        });
        
        res.send(buffer);
      } else {
        // For JSON or download=false: return inline JSON response
        // Don't include filename and contentType for inline JSON
        const responseData: any = {
          success: true,
          table: exportQueryDto.table,
          format: actualFormat,
          recordCount: Array.isArray(parsedData) ? parsedData.length : 0,
          data: parsedData,
        };

        // Only include these for non-JSON formats or when download mode is requested
        if (actualFormat !== 'json' || exportQueryDto.download) {
          responseData.contentType = result.contentType;
          responseData.filename = result.filename;
        }

        res.status(HttpStatus.OK).json(responseData);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Export operation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('schema')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get database schema metadata',
    description: `
Get complete database schema including all tables, their columns, data types, and row counts.
**Only admin users can access schema information.**

Returns a list of tables with:
- Table name
- Row count
- Column information (name, type, nullable)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Database schema retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string', example: 'users' },
              rowCount: { type: 'number', example: 150 },
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'id' },
                    type: { type: 'string', example: 'integer' },
                    nullable: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admin users can access schema',
  })
  async getSchema(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException(
          'Missing or invalid authorization header',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      const token = authHeader.substring(7);

      // Send schema request to Export Service via Kafka
      const result = await this.kafkaService.sendRequest<{
        success: boolean;
        schema?: any[];
        error?: string;
      }>(
        'export.request',
        'export.response',
        {
          token,
        },
        'SchemaRequest',
        30000, // 30 seconds timeout
      );

      // Response is already decoded from Protobuf by KafkaService
      // Check if schema retrieval was successful
      if (!result.success || result.error) {
        throw new HttpException(
          result.error || 'Failed to retrieve schema',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Return schema information (schema array is already decoded)
      res.status(HttpStatus.OK).json({
        success: true,
        tables: result.schema,  // schema از proto را به tables تبدیل می‌کنیم برای API response
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Schema retrieval failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
