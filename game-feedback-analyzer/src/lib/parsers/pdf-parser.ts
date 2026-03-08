export interface ParsedPdf {
  text: string;
  pageCount: number;
  sections: string[];
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  // Dynamic import to avoid DOMMatrix error during build
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
  const result = await pdfParse(buffer);

  const sections = (result.text as string)
    .split(/\n{2,}/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 10);

  return {
    text: result.text,
    pageCount: result.numpages,
    sections,
  };
}
