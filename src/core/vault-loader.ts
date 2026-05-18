import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type { Note } from '../types/index.js';

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.obsidian/**',
];

export async function loadVault(
  vaultPath: string,
  customIgnore: string[] = [],
): Promise<Note[]> {
  const absolutePath = resolve(vaultPath);

  const files = await fg(['**/*.md', '**/*.canvas'], {
    cwd: absolutePath,
    ignore: [...DEFAULT_IGNORE, ...customIgnore],
  });

  const notes: Note[] = [];

  for (const file of files) {
    const fullPath = resolve(absolutePath, file);
    const content = await readFile(fullPath, 'utf-8');
    const parsed = matter(content);

    const aliases: string[] = [];
    if (parsed.data.aliases) {
      if (Array.isArray(parsed.data.aliases)) {
        aliases.push(...parsed.data.aliases.map(String));
      } else if (typeof parsed.data.aliases === 'string') {
        aliases.push(parsed.data.aliases);
      }
    }

    notes.push({
      path: fullPath,
      relativePath: file,
      content: parsed.content,
      aliases,
      links: [],
    });
  }

  return notes;
}

export function resolveFileName(notePath: string): string {
  const base = notePath.replace(/\.(md|canvas)$/, '');
  const parts = base.split('/');
  return parts[parts.length - 1]!;
}
