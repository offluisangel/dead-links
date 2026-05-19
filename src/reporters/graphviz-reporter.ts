import type { AnalysisReport } from '../types/index.js';

export class GraphVizReporter {
  report(result: AnalysisReport, maxNodes = 100): string {
    let output = 'digraph VaultGraph {\n';
    output += '  rankdir=LR;\n';
    output += '  node [shape=box, style=rounded];\n';
    output += '  edge [arrowsize=0.5];\n\n';

    const nodesToShow = result.graph.slice(0, maxNodes);
    const nodeMap = new Map(nodesToShow.map((n) => [n.note.path, n.note.relativePath]));

    // Add nodes with styling
    for (const node of nodesToShow) {
      const id = this.sanitizeId(node.note.relativePath);
      const label = node.note.relativePath;
      let style = 'filled';
      let color = '#ffffff';
      let fontColor = '#000000';
      let shape = 'box';

      if (result.orphanNotes.some((o) => o.path === node.note.path)) {
        color = '#ff6b6b';
        fontColor = '#ffffff';
        shape = 'box';
      } else if (node.incoming.length === 0) {
        color = '#4dabf7';
        fontColor = '#ffffff';
      } else if (node.outgoing.length === 0) {
        color = '#51cf66';
        fontColor = '#ffffff';
      }

      output += `  "${id}" [label="${label}", fillcolor="${color}", fontcolor="${fontColor}", shape=${shape}];\n`;
    }

    output += '\n';

    // Add edges
    const addedEdges = new Set<string>();
    for (const node of nodesToShow) {
      const sourceId = this.sanitizeId(node.note.relativePath);

      for (const targetPath of node.outgoing) {
        const targetName = nodeMap.get(targetPath);
        if (!targetName) continue;

        const targetId = this.sanitizeId(targetName);
        const edgeKey = `${sourceId}->${targetId}`;

        if (!addedEdges.has(edgeKey)) {
          output += `  "${sourceId}" -> "${targetId}";\n`;
          addedEdges.add(edgeKey);
        }
      }
    }

    output += '\n  // Legend\n';
    output += '  subgraph legend {\n';
    output += '    rank=sink;\n';
    output += '    orphan [label="🔴 Orphan", fillcolor="#ff6b6b", fontcolor="white"];\n';
    output += '    source [label="📄 Source (no incoming)", fillcolor="#4dabf7", fontcolor="white"];\n';
    output += '    sink [label="📌 Sink (no outgoing)", fillcolor="#51cf66", fontcolor="white"];\n';
    output += '  }\n';

    output += '}\n';

    return output;
  }

  private sanitizeId(name: string): string {
    return name.replace(/\.(md|canvas)$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
