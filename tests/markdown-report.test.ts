import { describe, expect, it } from 'vitest';
import { generateMarkdownReport } from '../src/utils/markdown-report.js';
import type { AnalysisReport, GraphNode } from '../src/types/index.js';

function createReport(graph: GraphNode[]): AnalysisReport {
  return {
    brokenLinks: [],
    orphanNotes: [],
    graph,
    stats: {
      totalNotes: graph.length,
      totalLinks: 3,
      brokenCount: 0,
      orphanCount: 0,
      connectedComponents: 1,
    },
    duration: 10,
  };
}

describe('generateMarkdownReport', () => {
  it('includes the most-connected notes in a Connections section', () => {
    const note = (relativePath: string) => ({
      path: relativePath,
      relativePath,
      content: '',
      aliases: [],
      links: [],
    });
    const report = createReport([
      { note: note('Hub.md'), incoming: ['A.md', 'B.md'], outgoing: ['A.md'] },
      ...Array.from({ length: 10 }, (_, index) => ({
        note: note(`Leaf${index}.md`),
        incoming: [],
        outgoing: [],
      })),
    ]);

    const markdown = generateMarkdownReport(report);

    expect(markdown).toContain('| Avg links per note | 0.27 |');
    expect(markdown).toContain('| Health score | 100.0% |');
    expect(markdown).toContain('## Connections');
    expect(markdown).toContain('| Hub.md | 2 | 1 | 3 |');
    expect(markdown).not.toContain('| Leaf9.md |');
  });
});
