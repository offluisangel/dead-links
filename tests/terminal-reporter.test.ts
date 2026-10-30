import { describe, expect, it } from 'vitest';
import { TerminalReporter } from '../src/reporters/terminal-reporter.js';
import type { AnalysisReport, Note } from '../src/types/index.js';

const note = (relativePath: string): Note => ({
  path: `/vault/${relativePath}`,
  relativePath,
  content: '',
  aliases: [],
  links: [],
});

const report: AnalysisReport = {
  brokenLinks: [
    {
      source: 'Home.md',
      link: { raw: '[[Roadmap]]', target: 'Roadmap', type: 'wiki', line: 12 },
      reason: 'Target note not found',
    },
    {
      source: 'Home.md',
      link: { raw: '![[logo.png]]', target: 'logo.png', type: 'embed', line: 3 },
      reason: 'Target attachment not found',
    },
  ],
  orphanNotes: [note('Loose.md'), note('Films/Alien.md'), note('Films/Heat.md')],
  graph: [],
  stats: { totalNotes: 10, totalLinks: 20, brokenCount: 2, orphanCount: 3, connectedComponents: 4 },
  duration: 25,
};

const clean: AnalysisReport = {
  ...report,
  brokenLinks: [],
  orphanNotes: [],
  stats: { totalNotes: 10, totalLinks: 20, brokenCount: 0, orphanCount: 0, connectedComponents: 1 },
};

describe('TerminalReporter', () => {
  it('shows line number, target and link type for every broken link', () => {
    const output = new TerminalReporter([], false, true).report(report);

    expect(output).toContain('Broken links');
    expect(output).toMatch(/L12\s+Roadmap\s+wiki/);
    expect(output).toMatch(/L3\s+logo\.png\s+embed/);
  });

  it('renders a vault health bar with the percentage', () => {
    const output = new TerminalReporter([], false, true).report(report);

    expect(output).toMatch(/Health\s+[█░]+\s+90\.0%/);
  });

  it('counts only orphan notes outside ignored folders in the section title', () => {
    const output = new TerminalReporter(['Films'], false, true).report(report);

    expect(output).toContain('Orphan notes (1)');
    expect(output).not.toContain('Films/');
  });

  it('ends with a one-line summary of the findings', () => {
    const output = new TerminalReporter([], false, true).report(report);

    expect(output).toContain('2 broken links · 3 orphan notes');
  });

  it('reports an all-clear summary for a healthy vault', () => {
    const output = new TerminalReporter([], false, true).report(clean);

    expect(output).toContain('No broken links');
    expect(output).toContain('No orphan notes');
    expect(output).toContain('All clear');
    expect(output).toContain('100.0%');
  });

  it('keeps quiet mode output unchanged', () => {
    const output = new TerminalReporter([], true, true).report(report);

    expect(output).toBe(
      ['Home.md -> Roadmap', 'Home.md -> logo.png', 'orphan: Loose.md', 'orphan: Films/Alien.md', 'orphan: Films/Heat.md'].join('\n'),
    );
  });
});
