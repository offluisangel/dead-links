import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigLoader } from '../src/utils/config-loader.js';

describe('ConfigLoader', () => {
  it('loads vault config and lets CLI values override it', async () => {
    const vaultPath = await mkdtemp(join(tmpdir(), 'dead-links-config-'));
    await writeFile(
      join(vaultPath, '.deadlinksrc.json'),
      JSON.stringify({ ignore: ['**/Templates/**'], suggestions: false }),
    );

    const loader = new ConfigLoader();
    const fileConfig = await loader.loadConfig(vaultPath);
    const config = loader.mergeConfig(fileConfig, {
      suggestions: true,
      attachments: true,
    });

    expect(config.ignore).toEqual(['**/Templates/**']);
    expect(config.suggestions).toBe(true);
    expect(config.checkAttachments).toBe(true);
  });
});
