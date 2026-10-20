import { describe, expect, it } from 'vitest';
import { HtmlReporter } from '../src/reporters/html-reporter.js';
import type { AnalysisReport } from '../src/types/index.js';

const report: AnalysisReport = {
  brokenLinks: [
    {
      source: 'Notes/Home.md',
      link: {
        raw: '[[Missing Note]]',
        target: 'Missing Note',
        type: 'wiki',
        line: 12,
      },
      reason: 'Target note not found',
    },
  ],
  orphanNotes: [
    { path: '/vault/Loose.md', relativePath: 'Loose.md', content: '', aliases: [], links: [] },
  ],
  graph: [
    {
      note: { path: '/vault/Home.md', relativePath: 'Home.md', content: '', aliases: [], links: [] },
      incoming: ['Ideas.md'],
      outgoing: ['Ideas.md'],
    },
  ],
  stats: {
    totalNotes: 2,
    totalLinks: 2,
    brokenCount: 1,
    orphanCount: 1,
    connectedComponents: 1,
  },
  duration: 25,
};

describe('HtmlReporter', () => {
  it('renders the vault report in the supplied design system while preserving report data and filtering', () => {
    const html = new HtmlReporter().report(report);

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('--accent: #7C5CFF');
    expect(html).toContain('#F4F0FF');
    expect(html).toContain('#ECEBE8');
    expect(html).toContain('max-height: min(55vh, 520px)');
    expect(html).toContain('aria-label="Scrollable broken links"');
    expect(html).toContain('aria-label="Scrollable orphan notes"');
    expect(html).toContain('class="table-scroll bounded-table-scroll"');
    expect(html).not.toContain('class="report-mark"');
    expect(html).toContain('Total Notes');
    expect(html).toContain('At a glance');
    expect(html).toContain('Vault health');
    expect(html).toContain('max-width: 420px');
    expect(html).toContain('Missing Note');
    expect(html).toContain('Loose.md');
    expect(html).toContain('Home.md');
    expect(html).toContain('aria-label="Filter broken links"');
    expect(html).toContain('aria-label="Filter orphan notes"');
    expect(html).not.toContain('linear-gradient(135deg, #667eea');
  });

  it('renders helpful empty states when the vault has no findings or connections', () => {
    const cleanReport: AnalysisReport = {
      ...report,
      brokenLinks: [],
      orphanNotes: [],
      graph: [],
      stats: {
        totalNotes: 0,
        totalLinks: 0,
        brokenCount: 0,
        orphanCount: 0,
        connectedComponents: 0,
      },
    };

    const html = new HtmlReporter().report(cleanReport);

    expect(html).toContain('No broken links found.');
    expect(html).toContain('No orphan notes found!');
    expect(html).toContain('No connections to show.');
    expect(html).toContain('100.0%');
    expect(html).not.toContain('id="broken-filter"');
    expect(html).not.toContain('id="orphan-filter"');
  });
});
