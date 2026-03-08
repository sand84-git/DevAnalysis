import { readFile } from 'fs/promises';
import { join } from 'path';

const promptCache = new Map<string, string>();

export async function loadPrompt(filename: string): Promise<string> {
  const cached = promptCache.get(filename);
  if (cached) return cached;

  const filePath = join(process.cwd(), 'prompts', filename);
  const content = await readFile(filePath, 'utf-8');
  promptCache.set(filename, content);
  return content;
}
