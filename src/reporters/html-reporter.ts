import type { AnalysisReport } from '../types/index.js';

export class HtmlReporter {
  report(result: AnalysisReport): string {
    const brokenLinksHtml = this.renderBrokenLinks(result.brokenLinks);
    const orphanNotesHtml = this.renderOrphanNotes(result.orphanNotes);
    const graphHtml = this.renderGraph(result.graph);
    const statsHtml = this.renderStats(result.stats, result.duration);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dead Links Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        header h1 { font-size: 2.5em; margin-bottom: 10px; }
        header p { font-size: 1.1em; opacity: 0.9; }
        .content { padding: 40px; }
        .section {
            margin-bottom: 40px;
            border-left: 4px solid #667eea;
            padding-left: 20px;
        }
        .section h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card .value { font-size: 2.5em; font-weight: bold; }
        .stat-card .label { font-size: 0.9em; opacity: 0.9; margin-top: 10px; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #667eea;
            font-weight: 600;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        tr:hover { background: #f9f9f9; }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 500;
        }
        .badge-wiki { background: #dbeafe; color: #1e40af; }
        .badge-embed { background: #fed7aa; color: #92400e; }
        .badge-markdown { background: #d1fae5; color: #065f46; }
        .error { color: #dc2626; }
        .success { color: #16a34a; }
        .tabs {
            display: flex;
            gap: 0;
            border-bottom: 2px solid #eee;
            margin-bottom: 20px;
        }
        .tab-button {
            padding: 12px 20px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 1em;
            border-bottom: 3px solid transparent;
            color: #666;
            transition: all 0.3s;
        }
        .tab-button.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .filter-box {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .filter-box input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1em;
        }
        footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 Dead Links Report</h1>
            <p>Obsidian Vault Analysis</p>
        </header>

        <div class="content">
            ${statsHtml}
            ${brokenLinksHtml}
            ${orphanNotesHtml}
            ${graphHtml}
        </div>

        <footer>
            Generated on ${new Date().toLocaleString()}
        </footer>
    </div>

    <script>
        function setupTabs() {
            const buttons = document.querySelectorAll('.tab-button');
            const contents = document.querySelectorAll('.tab-content');

            buttons.forEach((button, index) => {
                button.addEventListener('click', () => {
                    buttons.forEach(b => b.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    button.classList.add('active');
                    contents[index].classList.add('active');
                });
            });

            // Activate first tab
            if (buttons.length > 0) buttons[0].classList.add('active');
            if (contents.length > 0) contents[0].classList.add('active');
        }

        function setupFilter(tableId, inputId) {
            const input = document.getElementById(inputId);
            const table = document.getElementById(tableId);
            if (!input || !table) return;

            input.addEventListener('keyup', (e) => {
                const filter = e.target.value.toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(filter) ? '' : 'none';
                });
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            setupTabs();
            setupFilter('broken-table', 'broken-filter');
            setupFilter('orphan-table', 'orphan-filter');
        });
    </script>
</body>
</html>`;
  }

  private renderStats(
    stats: {
      totalNotes: number;
      totalLinks: number;
      brokenCount: number;
      orphanCount: number;
      connectedComponents: number;
    },
    duration: number,
  ): string {
    const healthColor =
      stats.brokenCount === 0 && stats.orphanCount === 0 ? '#16a34a' : '#dc2626';

    return `
        <div class="section">
            <h2>📊 Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="value">${stats.totalNotes}</div>
                    <div class="label">Total Notes</div>
                </div>
                <div class="stat-card">
                    <div class="value">${stats.totalLinks}</div>
                    <div class="label">Total Links</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
                    <div class="value">${stats.brokenCount}</div>
                    <div class="label">Broken Links</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <div class="value">${stats.orphanCount}</div>
                    <div class="label">Orphan Notes</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, ${healthColor} 0%, ${healthColor === '#16a34a' ? '#15803d' : '#991b1b'} 100%);">
                    <div class="value">${stats.connectedComponents}</div>
                    <div class="label">Connected Components</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
                    <div class="value">${duration}ms</div>
                    <div class="label">Scan Duration</div>
                </div>
            </div>
        </div>
    `;
  }

  private renderBrokenLinks(brokenLinks: any[]): string {
    if (brokenLinks.length === 0) {
      return `
        <div class="section">
            <h2>✅ Broken Links</h2>
            <p class="success">No broken links found!</p>
        </div>
      `;
    }

    const rows = brokenLinks
      .map(
        (link) => `
        <tr>
            <td>${this.escapeHtml(link.source)}</td>
            <td>${this.escapeHtml(link.link.target)}</td>
            <td><span class="badge badge-${link.link.type}">${link.link.type}</span></td>
            <td>${link.link.line}</td>
            <td>${this.escapeHtml(link.reason)}</td>
        </tr>
      `,
      )
      .join('');

    return `
        <div class="section">
            <h2>🔴 Broken Links (${brokenLinks.length})</h2>
            <div class="filter-box">
                <input type="text" id="broken-filter" placeholder="Filter by source or target..." />
            </div>
            <table id="broken-table">
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Target</th>
                        <th>Type</th>
                        <th>Line</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
  }

  private renderOrphanNotes(orphanNotes: any[]): string {
    if (orphanNotes.length === 0) {
      return `
        <div class="section">
            <h2>✅ Orphan Notes</h2>
            <p class="success">No orphan notes found!</p>
        </div>
      `;
    }

    const rows = orphanNotes
      .map(
        (note) => `
        <tr>
            <td>${this.escapeHtml(note.relativePath)}</td>
        </tr>
      `,
      )
      .join('');

    return `
        <div class="section">
            <h2>🟡 Orphan Notes (${orphanNotes.length})</h2>
            <div class="filter-box">
                <input type="text" id="orphan-filter" placeholder="Filter by path..." />
            </div>
            <table id="orphan-table">
                <thead>
                    <tr>
                        <th>Path</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
  }

  private renderGraph(graph: any[]): string {
    const mostConnected = [...graph]
      .sort((a, b) => (b.incoming.length + b.outgoing.length) - (a.incoming.length + a.outgoing.length))
      .slice(0, 5);

    const rows = mostConnected
      .map(
        (node) => `
        <tr>
            <td>${this.escapeHtml(node.note.relativePath)}</td>
            <td>${node.incoming.length}</td>
            <td>${node.outgoing.length}</td>
            <td>${node.incoming.length + node.outgoing.length}</td>
        </tr>
      `,
      )
      .join('');

    return `
        <div class="section">
            <h2>🌐 Most Connected Notes</h2>
            <table>
                <thead>
                    <tr>
                        <th>Note</th>
                        <th>Incoming</th>
                        <th>Outgoing</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
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
