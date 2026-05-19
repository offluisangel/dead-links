import type { AnalysisReport } from '../types/index.js';

export class MermaidReporter {
  report(result: AnalysisReport, maxNodes = 50): string {
    let output = 'graph LR\n';

    // Limit nodes for readability
    const nodesToShow = result.graph.slice(0, maxNodes);
    const nodeMap = new Map(nodesToShow.map((n) => [n.note.path, n.note.relativePath]));

    // Add nodes
    for (const node of nodesToShow) {
      const id = this.sanitizeId(node.note.relativePath);
      const label = this.escapeLabel(node.note.relativePath);

      if (result.orphanNotes.some((o) => o.path === node.note.path)) {
        output += `  ${id}["<b>🔴 ${label}</b>"]:::orphan\n`;
      } else if (node.incoming.length === 0) {
        output += `  ${id}["📄 ${label}"]:::source\n`;
      } else if (node.outgoing.length === 0) {
        output += `  ${id}["📌 ${label}"]:::sink\n`;
      } else {
        output += `  ${id}["${label}"]\n`;
      }
    }

    // Add edges
    const addedEdges = new Set<string>();
    for (const node of nodesToShow) {
      const sourceId = this.sanitizeId(node.note.relativePath);

      for (const targetPath of node.outgoing) {
        const targetName = nodeMap.get(targetPath);
        if (!targetName) continue;

        const targetId = this.sanitizeId(targetName);
        const edgeKey = `${sourceId}-${targetId}`;

        if (!addedEdges.has(edgeKey)) {
          output += `  ${sourceId} --> ${targetId}\n`;
          addedEdges.add(edgeKey);
        }
      }
    }

    // Add styling
    output += '\n  classDef orphan fill:#ff6b6b,stroke:#c92a2a,color:#fff\n';
    output += '  classDef source fill:#4dabf7,stroke:#1971c2,color:#fff\n';
    output += '  classDef sink fill:#51cf66,stroke:#2f9e44,color:#fff\n';

    if (result.graph.length > maxNodes) {
      output += `\n  note["Graph limited to ${maxNodes} of ${result.graph.length} nodes for readability"]\n`;
    }

    return output;
  }

  private sanitizeId(name: string): string {
    return name
      .replace(/\.(md|canvas)$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .substring(0, 30);
  }

  private escapeLabel(name: string): string {
    return name.replace(/"/g, '\\"').substring(0, 50);
  }
}
