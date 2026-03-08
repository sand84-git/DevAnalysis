import type { ColumnType, DetectedColumn } from '@/types';

export function detectColumnType(values: (string | number | null)[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) return 'meta';

  const numericCount = nonNull.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / nonNull.length > 0.8) return 'score';

  let totalLength = 0;
  for (const v of nonNull) totalLength += String(v).length;
  const avgLength = totalLength / nonNull.length;
  if (avgLength > 50) return 'open_text';

  const hasCommas = nonNull.filter((v) => String(v).includes(',')).length;
  if (hasCommas / nonNull.length > 0.3) return 'choice';

  const uniqueRatio = new Set(nonNull.map(String)).size / nonNull.length;
  if (uniqueRatio < 0.3) return 'choice';

  if (avgLength > 20) return 'open_text';

  return 'meta';
}

export function detectColumns(
  headers: string[],
  rows: (string | number | null)[][]
): DetectedColumn[] {
  return headers.map((name, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const type = detectColumnType(values);
    const sampleValues = values
      .filter((v) => v !== null && v !== undefined && v !== '')
      .slice(0, 5)
      .map(String);

    return { name, type, sampleValues };
  });
}
