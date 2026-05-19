import type { AnalysisReport } from '../types/index.js';

export class CsvReporter {
  report(result: AnalysisReport): string {
    const lines: string[] = [];

    // Broken Links CSV
    lines.push('# BROKEN LINKS');
    lines.push('Source,Target,Type,Line,Reason');

    for (const broken of result.brokenLinks) {
      const source = this.escapeCsv(broken.source);
      const target = this.escapeCsv(broken.link.target);
      const type = broken.link.type;
      const line = broken.link.line;
      const reason = this.escapeCsv(broken.reason);

      lines.push(`${source},${target},${type},${line},"${reason}"`);
    }

    // Orphan Notes CSV
    lines.push('\n# ORPHAN NOTES');
    lines.push('Note,Path');

    for (const orphan of result.orphanNotes) {
      const name = this.escapeCsv(orphan.relativePath);
      lines.push(`${name},"${name}"`);
    }

    // Graph Stats CSV
    lines.push('\n# GRAPH STATISTICS');
    lines.push('Metric,Value');
    lines.push(`Total Notes,${result.stats.totalNotes}`);
    lines.push(`Total Links,${result.stats.totalLinks}`);
    lines.push(`Broken Links,${result.stats.brokenCount}`);
    lines.push(`Orphan Notes,${result.stats.orphanCount}`);
    lines.push(`Connected Components,${result.stats.connectedComponents}`);
    lines.push(`Duration (ms),${result.duration}`);

    return lines.join('\n');
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
