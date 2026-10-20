import type { AnalysisReport, BrokenLink, GraphNode, Note } from '../types/index.js';

export class HtmlReporter {
  report(result: AnalysisReport): string {
    const summaryHtml = this.renderSummary(result);
    const statsHtml = this.renderStats(result);
    const brokenLinksHtml = this.renderBrokenLinks(result.brokenLinks);
    const orphanNotesHtml = this.renderOrphanNotes(result.orphanNotes);
    const graphHtml = this.renderGraph(result.graph);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ECEBE8">
    <title>Vault report | Dead Links</title>
    <style>
        :root {
            color-scheme: light;
            --canvas: #ECEBE8;
            --surface: #FFFFFF;
            --surface-raised: #F7F5FC;
            --ink: #0A0A0A;
            --body: #2A2620;
            --muted: #5F5D57;
            --accent: #7C5CFF;
            --accent-ink: #4C3897;
            --accent-wash: #F4F0FF;
            --accent-border: #DCD3FF;
            --border: #D9D6CD;
            --border-soft: #EBE9E3;
            --space-1: 4px;
            --space-2: 8px;
            --space-3: 12px;
            --space-4: 16px;
            --space-5: 20px;
            --space-6: 24px;
            --space-7: 32px;
            --space-section: 40px;
            --font-ui: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            --font-display: 'Instrument Serif', Georgia, serif;
            --font-mono: 'JetBrains Mono', 'Courier New', monospace;
        }

        *, *::before, *::after { box-sizing: border-box; }
        html { background: var(--canvas); scroll-behavior: smooth; }
        body {
            margin: 0;
            color: var(--body);
            background: var(--canvas);
            font-family: var(--font-ui);
            font-size: 15px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
        ::selection { color: var(--surface); background: var(--accent); }
        :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
        .page { width: min(100% - 48px, 1200px); margin: 0 auto; }
        .masthead {
            position: relative;
            padding: 48px 0 32px;
            border-bottom: 1px solid var(--border);
            background-image:
                radial-gradient(rgba(124, 92, 255, .13) 1px, transparent 1.5px),
                radial-gradient(rgba(124, 92, 255, .06) 1px, transparent 1.5px);
            background-position: 0 0, 8px 8px;
            background-size: 16px 16px;
        }
        .masthead-inner { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
        .masthead h1 {
            margin: 0;
            color: var(--ink);
            font-family: var(--font-display);
            font-size: 44px;
            font-weight: 400;
            line-height: 1.04;
            letter-spacing: -.03em;
        }
        .masthead p { max-width: 62ch; margin: 12px 0 0; color: var(--muted); }
        main { padding: 32px 0 48px; }
        .overview { margin-bottom: var(--space-section); }
        .overview-intro { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
        .overview-intro h2, .section-heading h2 {
            margin: 0;
            color: var(--ink);
            font-size: 18.4px;
            font-weight: 600;
            line-height: 1.2;
            letter-spacing: -.02em;
        }
        .overview-intro p { margin: 0; color: var(--muted); font-size: 12px; }
        .summary {
            margin: 0 0 20px;
            padding: 16px 20px;
            border: 1px solid var(--accent-border);
            background: var(--accent-wash);
            color: var(--ink);
            font-weight: 500;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1px;
            border: 1px solid var(--border);
            background: var(--border);
        }
        .metric { min-height: 110px; padding: 18px 20px; background: var(--surface); }
        .metric-value { display: block; color: var(--ink); font-size: 28px; font-weight: 600; line-height: 1.15; font-variant-numeric: tabular-nums; letter-spacing: -.03em; }
        .metric-label { display: block; margin-top: 8px; color: var(--muted); font-size: 12px; }
        .metric:nth-child(3) .metric-value, .metric:nth-child(4) .metric-value { color: var(--accent-ink); }
        .section { margin-top: var(--space-section); }
        .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .section-count { color: var(--accent-ink); background: var(--accent-wash); padding: 3px 8px; font-family: var(--font-mono); font-size: 11px; font-variant-numeric: tabular-nums; }
        .data-surface { border: 1px solid var(--border); background: var(--surface); }
        .filter-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border-soft); }
        .filter-row label { flex: 0 0 auto; color: var(--muted); font-size: 12px; }
        .filter-row input {
            width: 100%;
            min-width: 0;
            min-height: 42px;
            padding: 9px 12px;
            border: 1px solid var(--border);
            border-radius: 0;
            color: var(--ink);
            background: var(--surface);
            font: inherit;
        }
        .filter-row input::placeholder { color: var(--muted); opacity: 1; }
        .filter-row input:focus-visible { border-color: var(--accent); outline-offset: 2px; }
        .table-scroll { overflow-x: auto; }
        .bounded-table-scroll {
            max-height: min(55vh, 520px);
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-color: var(--accent) var(--surface-raised);
            scrollbar-width: thin;
        }
        .bounded-table-scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .bounded-table-scroll thead th { position: sticky; top: 0; z-index: 1; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th {
            padding: 11px 16px;
            color: var(--muted);
            background: var(--surface-raised);
            border-bottom: 1px solid var(--border);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: .04em;
            text-transform: uppercase;
            white-space: nowrap;
        }
        td { padding: 13px 16px; border-bottom: 1px solid var(--border-soft); color: var(--body); vertical-align: top; }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:hover { background: var(--surface-raised); }
        td:first-child { color: var(--ink); font-weight: 500; }
        .type-label { color: var(--muted); font-family: var(--font-mono); font-size: 11px; }
        .numeric { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .empty-state { margin: 0; padding: 22px 16px; color: var(--muted); }
        .empty-state strong { color: var(--ink); font-weight: 500; }
        .connections-table td:not(:first-child), .connections-table th:not(:first-child) { text-align: right; }
        footer { padding: 18px 0 28px; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }
        footer time { font-variant-numeric: tabular-nums; }

        @media (max-width: 768px) {
            .page { width: min(100% - 32px, 600px); }
            .masthead { padding-top: 32px; }
            .masthead-inner { align-items: flex-start; }
            .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .section-heading { align-items: flex-start; }
            th, td { padding-right: 12px; padding-left: 12px; }
        }
        @media (max-width: 420px) {
            .page { width: min(100% - 24px, 600px); }
            .masthead { padding: 28px 0 24px; }
            .masthead h1 { font-size: 40px; }
            main { padding-top: 24px; }
            .overview-intro { display: block; }
            .overview-intro p { margin-top: 5px; }
            .metric { min-height: 96px; padding: 14px 12px; }
            .metric-value { font-size: 18.4px; }
            .filter-row { align-items: stretch; flex-direction: column; gap: 6px; }
        }
        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
        }
    </style>
</head>
<body>
    <header class="masthead">
        <div class="page masthead-inner">
            <div>
                <h1>Dead Links Report</h1>
                <p>Obsidian Vault Analysis</p>
            </div>
        </div>
    </header>
    <main class="page">
        ${summaryHtml}
        ${statsHtml}
        ${brokenLinksHtml}
        ${orphanNotesHtml}
        ${graphHtml}
    </main>
    <footer>
        <div class="page">Generated <time>${this.escapeHtml(new Date().toLocaleString())}</time> · Completed in ${result.duration}ms</div>
    </footer>
    <script>
        function setupFilter(tableId, inputId) {
            const input = document.getElementById(inputId);
            const table = document.getElementById(tableId);
            if (!input || !table) return;

            input.addEventListener('input', (event) => {
                const filter = event.currentTarget.value.toLocaleLowerCase();
                table.querySelectorAll('tbody tr').forEach((row) => {
                    row.hidden = !row.textContent.toLocaleLowerCase().includes(filter);
                });
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            setupFilter('broken-table', 'broken-filter');
            setupFilter('orphan-table', 'orphan-filter');
        });
    </script>
</body>
</html>`;
  }

  private renderSummary(result: AnalysisReport): string {
    const brokenCount = result.stats.brokenCount;
    const orphanCount = result.stats.orphanCount;
    const message = brokenCount === 0 && orphanCount === 0
      ? 'No broken links or orphan notes found.'
      : `${brokenCount} broken link${brokenCount === 1 ? '' : 's'} · ${orphanCount} orphan note${orphanCount === 1 ? '' : 's'}`;

    return `
        <section class="overview" aria-labelledby="overview-title">
            <div class="overview-intro">
                <h2 id="overview-title">At a glance</h2>
                <p>Scan completed in ${result.duration}ms</p>
            </div>
            <p class="summary">${this.escapeHtml(message)}</p>
        </section>
    `;
  }

  private renderStats(result: AnalysisReport): string {
    const { stats } = result;
    const averageLinks = stats.totalNotes === 0 ? 0 : stats.totalLinks / stats.totalNotes;
    const healthScore = stats.totalLinks === 0
      ? 100
      : 100 - (stats.brokenCount / stats.totalLinks) * 100;
    const metrics = [
      ['Total Notes', String(stats.totalNotes)],
      ['Links', String(stats.totalLinks)],
      ['Broken links', String(stats.brokenCount)],
      ['Orphan notes', String(stats.orphanCount)],
      ['Avg. links per note', averageLinks.toFixed(2)],
      ['Vault health', `${healthScore.toFixed(1)}%`],
      ['Connected components', String(stats.connectedComponents)],
    ];

    return `
        <section class="overview" aria-label="Vault statistics">
            <div class="metrics">
                ${metrics.map(([label, value]) => `
                <div class="metric">
                    <span class="metric-value">${this.escapeHtml(value)}</span>
                    <span class="metric-label">${this.escapeHtml(label)}</span>
                </div>`).join('')}
            </div>
        </section>
    `;
  }

  private renderBrokenLinks(brokenLinks: BrokenLink[]): string {
    const rows = brokenLinks.map((link) => `
        <tr>
            <td>${this.escapeHtml(link.source)}</td>
            <td>${this.escapeHtml(link.link.target)}</td>
            <td><span class="type-label">${this.escapeHtml(link.link.type)}</span></td>
            <td class="numeric">${link.link.line}</td>
            <td>${this.escapeHtml(link.reason)}</td>
        </tr>
    `).join('');

    return `
        <section class="section" aria-labelledby="broken-title">
            <div class="section-heading">
                <h2 id="broken-title">Broken links</h2>
                <span class="section-count">${brokenLinks.length} found</span>
            </div>
            <div class="data-surface">
                ${brokenLinks.length === 0
                  ? '<p class="empty-state">No broken links found.</p>'
                  : `<div class="filter-row">
                        <label for="broken-filter">Filter broken links</label>
                        <input type="search" id="broken-filter" aria-label="Filter broken links" placeholder="Search source, target, type, or reason">
                    </div>
                    <div class="table-scroll bounded-table-scroll" tabindex="0" role="region" aria-label="Scrollable broken links">
                        <table id="broken-table">
                            <thead><tr><th>Source</th><th>Target</th><th>Type</th><th>Line</th><th>Reason</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`}
            </div>
        </section>
    `;
  }

  private renderOrphanNotes(orphanNotes: Note[]): string {
    const rows = orphanNotes.map((note) => `
        <tr><td>${this.escapeHtml(note.relativePath)}</td></tr>
    `).join('');

    return `
        <section class="section" aria-labelledby="orphans-title">
            <div class="section-heading">
                <h2 id="orphans-title">Orphan notes</h2>
                <span class="section-count">${orphanNotes.length} found</span>
            </div>
            <div class="data-surface">
                ${orphanNotes.length === 0
                  ? '<p class="empty-state">No orphan notes found!</p>'
                  : `<div class="filter-row">
                        <label for="orphan-filter">Filter orphan notes</label>
                        <input type="search" id="orphan-filter" aria-label="Filter orphan notes" placeholder="Search note paths">
                    </div>
                    <div class="table-scroll bounded-table-scroll" tabindex="0" role="region" aria-label="Scrollable orphan notes">
                        <table id="orphan-table">
                            <thead><tr><th>Note path</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>`}
            </div>
        </section>
    `;
  }

  private renderGraph(graph: GraphNode[]): string {
    const mostConnected = [...graph]
      .sort((a, b) => (b.incoming.length + b.outgoing.length) - (a.incoming.length + a.outgoing.length))
      .slice(0, 5);
    const rows = mostConnected.map((node) => `
        <tr>
            <td>${this.escapeHtml(node.note.relativePath)}</td>
            <td class="numeric">${node.incoming.length}</td>
            <td class="numeric">${node.outgoing.length}</td>
            <td class="numeric">${node.incoming.length + node.outgoing.length}</td>
        </tr>
    `).join('');

    return `
        <section class="section" aria-labelledby="connections-title">
            <div class="section-heading">
                <h2 id="connections-title">Most connected notes</h2>
                <span class="section-count">Top ${mostConnected.length}</span>
            </div>
            <div class="data-surface table-scroll">
                ${mostConnected.length === 0
                  ? '<p class="empty-state">No connections to show.</p>'
                  : `<table class="connections-table">
                        <thead><tr><th>Note</th><th>Incoming</th><th>Outgoing</th><th>Total</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`}
            </div>
        </section>
    `;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
