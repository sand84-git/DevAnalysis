import ExcelJS from 'exceljs';
import { detectColumns } from './column-detector';
import type { DetectedColumn } from '@/types';

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: (string | number | null)[][];
  columns: DetectedColumn[];
  rowCount: number;
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheets: ParsedSheet[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: (string | number | null)[][] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as (string | number | null)[];
      const cleaned = values.slice(1); // ExcelJS 1-indexed

      if (rowNumber === 1) {
        headers = cleaned.map((v) => String(v ?? ''));
      } else {
        rows.push(cleaned);
      }
    });

    if (headers.length > 0) {
      sheets.push({
        sheetName: worksheet.name,
        headers,
        rows,
        columns: detectColumns(headers, rows),
        rowCount: rows.length,
      });
    }
  });

  return sheets;
}
