import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixBrokenLinksBatch } from '../src/utils/auto-fixer.js';
import type { BrokenLink } from '../src/types/index.js';

describe('fixBrokenLinksBatch', () => {
  it('writes suggested replacements to the source note', async () => {
    const vaultPath = await mkdtemp(join(tmpdir(), 'dead-links-fix-'));
    await writeFile(join(vaultPath, 'Source.md'), 'See [[Old Note]].');

    const broken: BrokenLink[] = [{
      source: 'Source.md',
      link: {
        raw: '[[Old Note]]',
        target: 'Old Note',
        type: 'wiki',
        line: 1,
      },
      reason: 'missing',
    }];

    const result = await fixBrokenLinksBatch(
      broken,
      new Map([['Old Note', 'New Note']]),
      vaultPath,
    );

    expect(result.get('Source.md')?.[0]?.success).toBe(true);
    expect(await readFile(join(vaultPath, 'Source.md'), 'utf8')).toBe('See [[New Note]].');
  });
});
