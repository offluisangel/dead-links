import type { AnalysisReport } from '../types/index.js';

export class JsonReporter {
  report(result: AnalysisReport): string {
    return JSON.stringify(
      {
        stats: result.stats,
        brokenLinks: result.brokenLinks,
        orphanNotes: result.orphanNotes.map((n) => ({
          path: n.relativePath,
        })),
        graph: result.graph.map((n) => ({
          note: n.note.relativePath,
          incoming: n.incoming.length,
          outgoing: n.outgoing.length,
        })),
        duration: result.duration,
      },
      null,
      2,
    );
  }
}
