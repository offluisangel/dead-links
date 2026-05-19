import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { DeadLinksConfig } from '../types/index.js';

const CONFIG_FILES = ['.deadlinksrc.json', '.deadlinksrc', 'dead-links.config.json'];

export class ConfigLoader {
  async loadConfig(vaultPath: string): Promise<DeadLinksConfig> {
    const absolutePath = resolve(vaultPath);

    for (const configFile of CONFIG_FILES) {
      const configPath = join(absolutePath, configFile);

      try {
        await access(configPath);
        const content = await readFile(configPath, 'utf-8');
        const parsed = JSON.parse(content) as DeadLinksConfig;

        if (parsed.ignore && !Array.isArray(parsed.ignore)) {
          continue;
        }
        if (parsed.ignoreFolders && !Array.isArray(parsed.ignoreFolders)) {
          continue;
        }

        return parsed;
      } catch {
        continue;
      }
    }

    return {};
  }

  mergeConfig(
    fileConfig: DeadLinksConfig,
    cliOptions: Record<string, unknown>,
  ): DeadLinksConfig {
    return {
      ignore: (cliOptions.ignore as string[] | undefined) || fileConfig.ignore,
      checkAttachments:
        (cliOptions.attachments as boolean | undefined) ??
        fileConfig.checkAttachments ??
        false,
      ignoreFolders:
        (cliOptions.ignoreFolders as string[] | undefined) ||
        fileConfig.ignoreFolders,
      suggestions:
        (cliOptions.suggestions as boolean | undefined) ??
        fileConfig.suggestions ??
        false,
      debug:
        (cliOptions.debug as boolean | undefined) ??
        fileConfig.debug ??
        false,
      fix:
        (cliOptions.fix as boolean | undefined) ??
        fileConfig.fix ??
        false,
    };
  }
}
