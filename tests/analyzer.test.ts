import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/analyzer.js';
import type { Note } from '../src/types/index.js';

function note(vaultPath: string, relativePath: string, content: string): Note {
  return {
    path: resolve(vaultPath, relativePath),
    relativePath,
    content,
    aliases: [],
    links: [],
  };
}

describe('analyze', () => {
  it('resolves relative Markdown links from the source note', () => {
    const vaultPath = resolve('tests/fixtures/relative-vault');
    const source = note(vaultPath, 'Folder/Source.md', '[Target](../Target.md)');
    const target = note(vaultPath, 'Target.md', 'Target');
    source.links = [{
      raw: '[Target](../Target.md)',
      target: '../Target.md',
      type: 'markdown',
      line: 1,
    }];

    const report = analyze([source, target], vaultPath);

    expect(report.brokenLinks).toHaveLength(0);
    expect(report.graph[0]?.outgoing).toEqual([target.path]);
  });

  it('checks attachments by filesystem path when requested', async () => {
    const vaultPath = await mkdtemp(join(tmpdir(), 'dead-links-'));
    await mkdir(join(vaultPath, 'images'));
    await writeFile(join(vaultPath, 'images', 'photo.png'), 'image');

    const source = note(vaultPath, 'Note.md', '![[images/photo.png]]');
    source.links = [{
      raw: '![[images/photo.png]]',
      target: 'images/photo.png',
      type: 'embed',
      line: 1,
    }];

    const report = analyze([source], vaultPath, true);
    expect(report.brokenLinks).toHaveLength(0);
  });

  it('does not produce NaN inputs for an empty vault', () => {
    const report = analyze([], resolve('tests/fixtures/empty-vault'));
    expect(report.stats.totalLinks).toBe(0);
    expect(report.stats.orphanCount).toBe(0);
  });
});
