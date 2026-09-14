import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BrokenLink } from '../types/index.js';

export interface FixResult {
  file: string;
  originalLink: string;
  newLink: string;
  success: boolean;
  error?: string;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function autoFixBrokenLinks(
  fixMap: Map<string, string>,
  filePath: string,
): Promise<FixResult[]> {
  const results: FixResult[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;

    for (const [oldTarget, newTarget] of fixMap.entries()) {
      // For wiki links: [[oldTarget]] or ![[oldTarget]]
      const wikiRegex = new RegExp(
        `(!?\\[\\[${escapeRegExp(oldTarget)}(?:\\|[^\\]]*)?\\]\\])`,
        'g',
      );
      const wikiMatches = content.match(wikiRegex);
      if (wikiMatches) {
        for (const match of wikiMatches) {
          const isEmbed = match.startsWith('!');
          const hasAlias = match.includes('|');
          let replacement: string;

          if (hasAlias) {
            const parts = match.split('|');
            replacement = `${isEmbed ? '!' : ''}[[${newTarget}|${parts[1]}`;
          } else {
            replacement = `${isEmbed ? '!' : ''}[[${newTarget}]]`;
          }

          newContent = newContent.replace(match, replacement);
          results.push({
            file: filePath,
            originalLink: match,
            newLink: replacement,
            success: true,
          });
        }
      }

      // For markdown links: [text](oldTarget) or [text](oldTarget#heading)
      const markdownRegex = new RegExp(
        `(\\[[^\\]]*\\]\\(${escapeRegExp(oldTarget)}(?:#[^)]*)?\\))`,
        'g',
      );
      const markdownMatches = content.match(markdownRegex);
      if (markdownMatches) {
        for (const match of markdownMatches) {
          const linkPart = match.match(/\(([^)]+)\)/)?.[1] || '';
          const heading = linkPart.includes('#') ? linkPart.split('#')[1] : '';
          const newLink = heading ? `${newTarget}#${heading}` : newTarget;
          const textPart = match.match(/\[([^\]]*)\]/)?.[0] || '[]';
          const replacement = `${textPart}(${newLink})`;

          newContent = newContent.replace(match, replacement);
          results.push({
            file: filePath,
            originalLink: match,
            newLink: replacement,
            success: true,
          });
        }
      }
    }

    // Only write if content changed
    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf-8');
    }

    return results;
  } catch (error) {
    return [
      {
        file: filePath,
        originalLink: '',
        newLink: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    ];
  }
}

export async function fixBrokenLinksBatch(
  brokenLinks: BrokenLink[],
  suggestionMap: Map<string, string>,
  vaultPath: string,
): Promise<Map<string, FixResult[]>> {
  const fileFixMap = new Map<string, Map<string, string>>();

  // Group fixes by file
  for (const broken of brokenLinks) {
    const suggestion = suggestionMap.get(broken.link.target);
    if (!suggestion) continue;

    if (!fileFixMap.has(broken.source)) {
      fileFixMap.set(broken.source, new Map());
    }
    fileFixMap.get(broken.source)!.set(broken.link.target, suggestion);
  }

  const allResults = new Map<string, FixResult[]>();

  // Process files in parallel
  const promises = Array.from(fileFixMap.entries()).map(
    async ([source, fixMap]) => {
      const filePath = resolve(vaultPath, source);
      const results = await autoFixBrokenLinks(fixMap, filePath);
      allResults.set(source, results);
    },
  );

  await Promise.all(promises);

  return allResults;
}
