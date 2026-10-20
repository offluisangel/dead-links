import { loadVault } from '../core/vault-loader.js';
import { parseLinks } from '../core/link-parser.js';
import { analyze } from '../core/analyzer.js';
import type { AnalysisReport, DeadLinksConfig } from '../types/index.js';

export class DeadLinksEngine {
  async analyze(
    vaultPath: string,
    config: DeadLinksConfig = {},
  ): Promise<AnalysisReport> {
    const startTime = Date.now();

    const notes = await loadVault(vaultPath, config.ignore);

    // Parallelize link parsing
    await Promise.all(
      notes.map((note) => {
        note.links = parseLinks(note.content);
        return Promise.resolve();
      }),
    );

    const report = analyze(notes, vaultPath, config.checkAttachments, config.ignoreFolders);

    report.duration = Date.now() - startTime;

    return report;
  }
}
