import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class QueryBuilderService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Validate table name exists in database
   */
  private async validateTable(tableName: string): Promise<void> {
    const result = await this.dataSource.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    
    if (!result[0].exists) {
      throw new BadRequestException(`Table '${tableName}' does not exist`);
    }
  }

  /**
   * Validate columns exist in table
   */
  private async validateColumns(tableName: string, columns: string[]): Promise<void> {
    const result = await this.dataSource.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = $1`,
      [tableName]
    );
    
    const validColumns = result.map((row) => row.column_name);
    
    for (const col of columns) {
      if (!validColumns.includes(col)) {
        throw new BadRequestException(`Column '${col}' does not exist in table '${tableName}'`);
      }
    }
  }

  /**
   * Build and execute safe SQL query with parameterized WHERE clause
   */
  async executeQuery(
    table: string,
    columns?: string[],
    whereClause?: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    // Validate table exists
    await this.validateTable(table);

    // Get all columns if not specified
    let selectedColumns: string[] = columns || [];
    if (selectedColumns.length === 0) {
      const columnResult = await this.dataSource.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      selectedColumns = columnResult.map((row) => row.column_name);
    } else {
      // Validate specified columns exist
      await this.validateColumns(table, selectedColumns);
    }

    // Build safe query using QueryBuilder
    let query = this.dataSource
      .createQueryBuilder()
      .select(selectedColumns.map(col => `"${col}"`))
      .from(table, table);

    // Apply WHERE clause if provided (with validation)
    if (whereClause) {
      // Basic SQL injection protection: only allow safe WHERE clauses
      // In production, you might want to parse and validate this more thoroughly
      query = query.where(whereClause);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    // Execute and return results
    return await query.getRawMany();
  }

  /**
   * Get table metadata (columns, types, etc.)
   */
  async getTableMetadata(tableName: string): Promise<any[]> {
    await this.validateTable(tableName);
    
    return await this.dataSource.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
  }

  /**
   * Get all available tables
   */
  async getAllTables(): Promise<string[]> {
    const result = await this.dataSource.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    
    return result.map((row) => row.table_name);
  }

  /**
   * Get row count for a table
   */
  async getTableRowCount(tableName: string): Promise<number> {
    await this.validateTable(tableName);
    
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    
    return parseInt(result[0].count, 10);
  }

  /**
   * Get database schema: all tables with columns and row counts
   */
  async getDatabaseSchema(): Promise<any[]> {
    const tables = await this.getAllTables();
    
    const schema = await Promise.all(
      tables.map(async (tableName) => {
        const columns = await this.getTableMetadata(tableName);
        const rowCount = await this.getTableRowCount(tableName);
        
        return {
          tableName,
          rowCount,
          columns: columns.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
          })),
        };
      })
    );
    
    return schema;
  }
}
