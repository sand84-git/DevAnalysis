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

// ExcelJS 셀 값을 안전하게 변환 (리치 텍스트, 하이퍼링크 등 객체 처리)
function flattenCellValue(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    // 리치 텍스트: { richText: [{ text: '...' }, ...] }
    if (Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((r) => r.text).join('');
    }
    // 하이퍼링크: { text: '...', hyperlink: '...' }
    if ('text' in obj) return String(obj.text);
    // 에러 객체: { error: '...' }
    if ('error' in obj) return null;
    return String(v);
  }
  return String(v);
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheets: ParsedSheet[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: (string | number | null)[][] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as unknown[];
      const cleaned = values.slice(1).map(flattenCellValue); // ExcelJS 1-indexed

      if (rowNumber === 1) {
        headers = cleaned.map((v) => String(v ?? ''));
      } else {
        rows.push(cleaned);
      }
    });

    console.log(`[Parser] Sheet "${worksheet.name}": ${worksheet.rowCount} total rows (ExcelJS), ${rows.length} data rows parsed, ${headers.length} headers`);

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
