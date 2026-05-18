import type { AnalysisReport } from '../types/index.js';

function pill(target: string, isMultiple: boolean): string {
  return isMultiple ? `[${target}]` : `[${target}]`;
}

function bar(count: number, max: number, width: number): string {
  const filled = Math.round((count / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function generateMarkdownReport(report: AnalysisReport): string {
  const lines: string[] = [];

  lines.push('# Dead Links Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Completed in ${report.duration}ms`);
  lines.push('');

  lines.push('## Stats');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Notes | ${report.stats.totalNotes} |`);
  lines.push(`| Links | ${report.stats.totalLinks} |`);
  lines.push(`| Broken | ${report.stats.brokenCount} |`);
  lines.push(`| Orphans | ${report.stats.orphanCount} |`);
  lines.push(`| Components | ${report.stats.connectedComponents} |`);
  lines.push('');

  lines.push('## Broken Links');
  lines.push('');

  if (report.brokenLinks.length === 0) {
    lines.push('No broken links found.');
  } else {
    const grouped = new Map<string, typeof report.brokenLinks>();
    for (const b of report.brokenLinks) {
      const existing = grouped.get(b.source) || [];
      existing.push(b);
      grouped.set(b.source, existing);
    }

    const sorted = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [source, links] of sorted) {
      const count = links.length;
      lines.push(`### ${count > 1 ? '✖' : '✖'} ${count}  ${source}`);
      lines.push('');
      for (const link of links) {
        lines.push(`- ${pill(link.link.target, count > 1)}`);
      }
      lines.push('');
    }
  }

  lines.push('## Orphan Notes');
  lines.push('');

  if (report.orphanNotes.length === 0) {
    lines.push('No orphan notes found.');
  } else {
    const byFolder = new Map<string, number>();
    for (const note of report.orphanNotes) {
      const folder = note.relativePath.includes('/')
        ? note.relativePath.split('/').slice(0, -1).join('/') + '/'
        : './';
      byFolder.set(folder, (byFolder.get(folder) || 0) + 1);
    }

    const sorted = [...byFolder.entries()].sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] ?? 1;

    for (const [folder, count] of sorted) {
      lines.push(`- ${folder.padEnd(40)}  ${bar(count, maxCount, 10)}  ${count}`);
    }
  }

  lines.push('');

  return lines.join('\n');
}
