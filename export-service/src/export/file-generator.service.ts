import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { createObjectCsvStringifier } from 'csv-writer';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class FileGeneratorService {
  /**
   * Generate CSV content from data
   */
  generateCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
    
    const csvStringifier = createObjectCsvStringifier({
      header: headers
    });

    const headerString = headers.map(h => h.title).join(',') + '\n';
    const recordsString = csvStringifier.stringifyRecords(data);
    
    return headerString + recordsString;
  }

  /**
   * Generate JSON content from data
   */
  generateJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate Excel buffer from data
   */
  generateExcel(data: any[], tableName: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName.substring(0, 31)); // Excel sheet name max 31 chars
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate PDF buffer from data
   */
  generatePDF(data: any[], tableName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: 'landscape',
          margin: 50 
        });
        
        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text(`Export: ${tableName}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        if (!data || data.length === 0) {
          doc.fontSize(12).text('No data available', { align: 'center' });
          doc.end();
          return;
        }

        // Get headers
        const headers = Object.keys(data[0]);
        const columnWidth = (doc.page.width - 100) / headers.length;
        const startX = 50;
        let startY = doc.y;

        // Draw table header
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          const x = startX + (i * columnWidth);
          doc.rect(x, startY, columnWidth, 25).stroke();
          doc.text(header, x + 5, startY + 8, { 
            width: columnWidth - 10, 
            ellipsis: true,
            lineBreak: false
          });
        });

        startY += 25;
        doc.font('Helvetica').fontSize(9);

        // Draw table rows
        data.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (startY > doc.page.height - 100) {
            doc.addPage({ layout: 'landscape' });
            startY = 50;
            
            // Redraw headers on new page
            doc.fontSize(10).font('Helvetica-Bold');
            headers.forEach((header, i) => {
              const x = startX + (i * columnWidth);
              doc.rect(x, startY, columnWidth, 25).stroke();
              doc.text(header, x + 5, startY + 8, { 
                width: columnWidth - 10, 
                ellipsis: true,
                lineBreak: false
              });
            });
            startY += 25;
            doc.font('Helvetica').fontSize(9);
          }

          const rowHeight = 20;
          headers.forEach((header, i) => {
            const x = startX + (i * columnWidth);
            doc.rect(x, startY, columnWidth, rowHeight).stroke();
            
            let cellValue = row[header];
            if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else if (typeof cellValue === 'object') {
              cellValue = JSON.stringify(cellValue);
            } else {
              cellValue = String(cellValue);
            }
            
            doc.text(cellValue, x + 5, startY + 5, { 
              width: columnWidth - 10, 
              ellipsis: true,
              lineBreak: false
            });
          });
          
          startY += rowHeight;
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Page ${i + 1} of ${pageCount} | Total Records: ${data.length}`,
            50,
            doc.page.height - 30,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate file based on format
   */
  async generate(data: any[], format: 'csv' | 'json' | 'excel' | 'pdf', tableName: string): Promise<Buffer | string> {
    if (!data || data.length === 0) {
      if (format === 'json') {
        return '[]';
      }
      if (format === 'pdf') {
        return this.generatePDF([], tableName);
      }
      return '';
    }

    switch (format) {
      case 'csv':
        return this.generateCSV(data);
      case 'json':
        return this.generateJSON(data);
      case 'excel':
        return this.generateExcel(data, tableName);
      case 'pdf':
        return this.generatePDF(data, tableName);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Get content type for format
   */
  getContentType(format: 'csv' | 'json' | 'excel' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get file extension for format
   */
  getFileExtension(format: 'csv' | 'json' | 'excel' | 'pdf'): string {
    switch (format) {
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'excel':
        return 'xlsx';
      case 'pdf':
        return 'pdf';
      default:
        return 'txt';
    }
  }
}
