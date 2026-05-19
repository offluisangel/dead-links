import chalk from 'chalk';
import type {
  AnalysisReport,
  BrokenLink,
  Note,
} from '../types/index.js';

export class TerminalReporter {
  private ignoreFolders: string[];
  private quiet: boolean;

  constructor(ignoreFolders: string[] = [], quiet = false) {
    this.ignoreFolders = ignoreFolders;
    this.quiet = quiet;
  }

  report(result: AnalysisReport): string {
    if (this.quiet) {
      return this.reportQuiet(result);
    }

    let output = '';
    output += this.printStats(result);
    output += this.printBrokenLinks(result.brokenLinks);
    output += this.printOrphanNotes(result.orphanNotes);
    if (result.suggestions && result.suggestions.length > 0) {
      output += this.printSuggestions(result.suggestions);
    }
    output += this.printDuration(result.duration);
    return output;
  }

  private reportQuiet(result: AnalysisReport): string {
    const lines: string[] = [];

    for (const broken of result.brokenLinks) {
      lines.push(`${broken.source} -> ${broken.link.target}`);
    }

    for (const note of result.orphanNotes) {
      const folder = note.relativePath.includes('/')
        ? note.relativePath.split('/').slice(0, -1).join('/') + '/'
        : './';
      if (this.ignoreFolders.some((f) => folder.startsWith(f + '/') || folder === f + '/')) {
        continue;
      }
      lines.push(`orphan: ${note.relativePath}`);
    }

    return lines.join('\n');
  }

  private printStats(report: AnalysisReport): string {
    const pad = 14;
    let out = '\n';
    out += this.statLine('Notes'.padEnd(pad), String(report.stats.totalNotes));
    out += this.statLine('Links'.padEnd(pad), String(report.stats.totalLinks));
    out += this.statLine('Broken links'.padEnd(pad), String(report.stats.brokenCount), 'red');
    out += this.statLine('Orphan notes'.padEnd(pad), String(report.stats.orphanCount), 'yellow');
    out += this.statLine('Components'.padEnd(pad), String(report.stats.connectedComponents));
    out += '\n';
    return out;
  }

  private statLine(label: string, value: string, color: 'red' | 'yellow' | 'white' = 'white'): string {
    return `  ${chalk.gray(label)}  ${color === 'red' ? chalk.red.bold(value) : color === 'yellow' ? chalk.yellow.bold(value) : chalk.white.bold(value)}\n`;
  }

  private printBrokenLinks(brokenLinks: BrokenLink[]): string {
    if (brokenLinks.length === 0) {
      return chalk.green('  ✓  No broken links\n\n');
    }

    const grouped = new Map<string, BrokenLink[]>();
    for (const broken of brokenLinks) {
      const existing = grouped.get(broken.source) || [];
      existing.push(broken);
      grouped.set(broken.source, existing);
    }

    const sorted = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

    let out = chalk.bold.red(`\n✖  Broken links (${brokenLinks.length})\n\n`);

    for (const [source, links] of sorted) {
      const count = links.length;
      const isMultiple = count >= 2;

      const countStr = isMultiple ? chalk.red.bold(`✖  ${count}`) : chalk.yellow.bold(`✖  ${count}`);
      out += `  ${countStr}  ${chalk.white.bold(source)}\n`;

      for (const link of links) {
        const pill = isMultiple
          ? chalk.redBright(`[${link.link.target}]`)
          : chalk.yellowBright(`[${link.link.target}]`);
        out += `      ${pill}\n`;
      }
      out += '\n';
    }

    return out;
  }

  private printOrphanNotes(orphanNotes: Note[]): string {
    if (orphanNotes.length === 0) {
      return chalk.green('  ✓  No orphan notes\n\n');
    }

    const byFolder = new Map<string, number>();
    for (const note of orphanNotes) {
      const folder = note.relativePath.includes('/')
        ? note.relativePath.split('/').slice(0, -1).join('/') + '/'
        : './';

      if (this.ignoreFolders.some((f) => folder.startsWith(f + '/') || folder === f + '/')) {
        continue;
      }

      byFolder.set(folder, (byFolder.get(folder) || 0) + 1);
    }

    const sorted = [...byFolder.entries()].sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return chalk.green('  ✓  No orphan notes (all in ignored folders)\n\n');
    }

    const maxCount = sorted[0]![1];
    const barWidth = 10;

    let out = chalk.bold.yellow(`\n⚠  Orphan notes (${orphanNotes.length} total)\n\n`);

    for (const [folder, count] of sorted) {
      const filled = Math.round((count / maxCount) * barWidth);
      const empty = barWidth - filled;
      const bar = chalk.gray('█'.repeat(filled) + '░'.repeat(empty));
      out += `  ${chalk.gray(folder.padEnd(40))}  ${bar}  ${chalk.white.bold(String(count))}\n`;
    }

    out += '\n';
    return out;
  }

  private printDuration(ms: number): string {
    return chalk.dim(`  Completed in ${ms}ms\n`);
  }

  private printSuggestions(
    suggestions: Array<{ broken: string; suggested: string; similarity: number }>,
  ): string {
    let out = chalk.bold.cyan(`\n💡 Suggestions (${suggestions.length})\n\n`);

    for (const suggestion of suggestions.slice(0, 5)) {
      const confidence = Math.round(suggestion.similarity * 100);
      const bar =
        confidence >= 80
          ? chalk.green('█████')
          : confidence >= 60
            ? chalk.yellow('█████')
            : chalk.gray('█████');

      out += `  ${chalk.gray(suggestion.broken)} → ${chalk.cyan(suggestion.suggested)}\n`;
      out += `      ${bar} ${confidence}%\n\n`;
    }

    return out;
  }
}
