import type { GraphNode, Note } from '../types/index.js';

export interface AdvancedStats {
  density: number;
  centralityByNote: Map<string, number>;
  mostConnected: Array<{ note: string; connections: number }>;
  loneliest: Array<{ note: string; connections: number }>;
  avgConnectionsPerNote: number;
  maxConnections: number;
  minConnections: number;
}

export function calculateAdvancedStats(graph: GraphNode[]): AdvancedStats {
  if (graph.length === 0) {
    return {
      density: 0,
      centralityByNote: new Map(),
      mostConnected: [],
      loneliest: [],
      avgConnectionsPerNote: 0,
      maxConnections: 0,
      minConnections: 0,
    };
  }

  const centralityByNote = new Map<string, number>();
  let totalConnections = 0;
  let maxConnections = 0;
  let minConnections = Infinity;

  // Calculate degree centrality
  for (const node of graph) {
    const degree = node.incoming.length + node.outgoing.length;
    centralityByNote.set(node.note.relativePath, degree);
    totalConnections += degree;
    maxConnections = Math.max(maxConnections, degree);
    minConnections = Math.min(minConnections, degree);
  }

  minConnections = minConnections === Infinity ? 0 : minConnections;

  // Calculate density: actual edges / possible edges
  const possibleEdges = graph.length * (graph.length - 1);
  const actualEdges = graph.reduce((sum, node) => sum + node.outgoing.length, 0);
  const density = possibleEdges > 0 ? actualEdges / possibleEdges : 0;

  const avgConnectionsPerNote = totalConnections / (2 * graph.length);

  // Get top connected and loneliest
  const sorted = Array.from(centralityByNote.entries())
    .map(([note, connections]) => ({ note, connections }))
    .sort((a, b) => b.connections - a.connections);

  const mostConnected = sorted.slice(0, 5);
  const loneliest = sorted.slice(-5).reverse();

  return {
    density,
    centralityByNote,
    mostConnected,
    loneliest,
    avgConnectionsPerNote,
    maxConnections,
    minConnections,
  };
}
