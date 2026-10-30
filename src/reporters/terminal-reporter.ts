import { Chalk, type ChalkInstance } from 'chalk';
import type { AnalysisReport, BrokenLink, Note } from '../types/index.js';

const BAR_WIDTH = 20;
const FOLDER_BAR_WIDTH = 12;
const RULE_WIDTH = 56;

export class TerminalReporter {
  private ignoreFolders: string[];
  private quiet: boolean;
  private chalk: ChalkInstance;

  constructor(ignoreFolders: string[] = [], quiet = false, noColor = false) {
    this.ignoreFolders = ignoreFolders;
    this.quiet = quiet;
    this.chalk = new Chalk({ level: noColor ? 0 : undefined });
  }

  report(result: AnalysisReport): string {
    if (this.quiet) {
      return this.reportQuiet(result);
    }

    const visibleOrphans = this.visibleOrphans(result.orphanNotes);

    return [
      this.printHeader(),
      this.printStats(result),
      this.printBrokenLinks(result.brokenLinks),
      this.printOrphanNotes(visibleOrphans, result.orphanNotes.length),
      this.printSummary(result, visibleOrphans.length),
    ].join('');
  }

  private reportQuiet(result: AnalysisReport): string {
    const lines: string[] = [];

    for (const broken of result.brokenLinks) {
      lines.push(`${broken.source} -> ${broken.link.target}`);
    }

    for (const note of this.visibleOrphans(result.orphanNotes)) {
      lines.push(`orphan: ${note.relativePath}`);
    }

    return lines.join('\n');
  }

  private folderOf(note: Note): string {
    return note.relativePath.includes('/')
      ? note.relativePath.split('/').slice(0, -1).join('/') + '/'
      : './';
  }

  private visibleOrphans(orphanNotes: Note[]): Note[] {
    return orphanNotes.filter((note) => {
      const folder = this.folderOf(note);
      return !this.ignoreFolders.some((f) => folder.startsWith(f + '/') || folder === f + '/');
    });
  }

  private rule(): string {
    return this.chalk.dim('─'.repeat(RULE_WIDTH));
  }

  private sectionTitle(icon: string, title: string, count: string, paint: (text: string) => string): string {
    return `${paint(`${icon}  ${title}`)} ${this.chalk.dim(count)}\n${this.rule()}\n`;
  }

  private bar(ratio: number, width: number, paint: (text: string) => string): string {
    const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
    return paint('█'.repeat(filled)) + this.chalk.dim('░'.repeat(width - filled));
  }

  private plural(count: number, singular: string): string {
    return `${count} ${singular}${count === 1 ? '' : 's'}`;
  }

  private healthScore(report: AnalysisReport): number {
    return report.stats.totalLinks === 0
      ? 100
      : 100 - (report.stats.brokenCount / report.stats.totalLinks) * 100;
  }

  private printHeader(): string {
    return `\n${this.chalk.bold.magenta('◆ dead-links')} ${this.chalk.dim('· vault report')}\n${this.rule()}\n\n`;
  }

  private printStats(report: AnalysisReport): string {
    const { stats } = report;
    const pad = 14;
    const health = this.healthScore(report);
    const healthPaint = health >= 95 ? this.chalk.green : health >= 80 ? this.chalk.yellow : this.chalk.red;

    const line = (label: string, value: string): string =>
      `  ${this.chalk.gray(label.padEnd(pad))}${value}\n`;

    let out = '';
    out += line('Notes', this.chalk.white.bold(String(stats.totalNotes)));
    out += line('Links', this.chalk.white.bold(String(stats.totalLinks)));
    out += line(
      'Broken links',
      stats.brokenCount > 0 ? this.chalk.red.bold(String(stats.brokenCount)) : this.chalk.green.bold('0'),
    );
    out += line(
      'Orphan notes',
      stats.orphanCount > 0 ? this.chalk.yellow.bold(String(stats.orphanCount)) : this.chalk.green.bold('0'),
    );
    out += line('Components', this.chalk.white.bold(String(stats.connectedComponents)));
    out += line(
      'Health',
      `${this.bar(health / 100, BAR_WIDTH, healthPaint)}  ${healthPaint.bold(`${health.toFixed(1)}%`)}`,
    );
    return out + '\n';
  }

  private printBrokenLinks(brokenLinks: BrokenLink[]): string {
    if (brokenLinks.length === 0) {
      return this.chalk.green('✓  No broken links\n\n');
    }

    const grouped = new Map<string, BrokenLink[]>();
    for (const broken of brokenLinks) {
      const existing = grouped.get(broken.source) || [];
      existing.push(broken);
      grouped.set(broken.source, existing);
    }

    const sorted = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

    let out = this.sectionTitle('✖', 'Broken links', `(${brokenLinks.length})`, this.chalk.bold.red);

    for (const [source, links] of sorted) {
      out += `\n${this.chalk.white.bold(source)} ${this.chalk.dim(`(${links.length})`)}\n`;

      const ordered = [...links].sort((a, b) => a.link.line - b.link.line);
      const lineWidth = Math.max(...ordered.map((l) => String(l.link.line).length)) + 1;
      const targetWidth = Math.min(40, Math.max(...ordered.map((l) => l.link.target.length)));

      for (const link of ordered) {
        const lineLabel = this.chalk.gray(`L${link.link.line}`.padEnd(lineWidth));
        const target = this.chalk.redBright(link.link.target.padEnd(targetWidth));
        out += `  ${this.chalk.red('›')} ${lineLabel}  ${target}  ${this.chalk.dim(link.link.type)}\n`;
      }
    }

    return out + '\n';
  }

  private printOrphanNotes(visible: Note[], total: number): string {
    if (total === 0) {
      return this.chalk.green('✓  No orphan notes\n\n');
    }

    if (visible.length === 0) {
      return this.chalk.green('✓  No orphan notes (all in ignored folders)\n\n');
    }

    const byFolder = new Map<string, number>();
    for (const note of visible) {
      const folder = this.folderOf(note);
      byFolder.set(folder, (byFolder.get(folder) || 0) + 1);
    }

    const sorted = [...byFolder.entries()].sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]![1];
    const folderWidth = Math.min(36, Math.max(...sorted.map(([folder]) => folder.length)));
    const countWidth = String(maxCount).length;

    let out = this.sectionTitle('⚠', 'Orphan notes', `(${visible.length})`, this.chalk.bold.yellow);
    out += '\n';

    for (const [folder, count] of sorted) {
      const bar = this.bar(count / maxCount, FOLDER_BAR_WIDTH, this.chalk.yellow);
      out += `  ${this.chalk.gray(folder.padEnd(folderWidth))}  ${bar}  ${this.chalk.white.bold(String(count).padStart(countWidth))}\n`;
    }

    return out + '\n';
  }

  private printSummary(report: AnalysisReport, visibleOrphanCount: number): string {
    const broken = report.stats.brokenCount;
    const duration = this.chalk.dim(`${report.duration}ms`);

    if (broken === 0 && visibleOrphanCount === 0) {
      return `${this.rule()}\n${this.chalk.green.bold('✓ All clear')} ${this.chalk.dim('·')} ${duration}\n`;
    }

    const brokenText = this.plural(broken, 'broken link');
    const orphanText = this.plural(visibleOrphanCount, 'orphan note');
    return `${this.rule()}\n${this.chalk.bold(`${brokenText} · ${orphanText}`)} ${this.chalk.dim('·')} ${duration}\n`;
  }
}
