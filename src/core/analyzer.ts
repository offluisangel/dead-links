import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Note, GraphNode, BrokenLink, AnalysisReport } from '../types/index.js';
import { AliasResolver } from './alias-resolver.js';
import { buildGraph } from './graph-builder.js';

const ATTACHMENT_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'webm',
  'zip', 'rar', '7z', 'tar', 'gz',
  'exe', 'dmg', 'apk',
  'css', 'js', 'ts', 'html',
  'txt', 'csv', 'log',
  'woff', 'woff2', 'ttf', 'eot',
]);

function isAttachment(target: string): boolean {
  const ext = target.split('.').pop()?.toLowerCase();
  return ext ? ATTACHMENT_EXTENSIONS.has(ext) : false;
}

export function analyze(
  notes: Note[],
  vaultPath: string,
  checkAttachments = false,
): AnalysisReport {
  const resolver = new AliasResolver(notes);
  const graph = buildGraph(notes, resolver);

  const brokenLinks: BrokenLink[] = [];
  const orphanNotes: Note[] = [];

  for (const node of graph) {
    if (node.incoming.length === 0 && node.outgoing.length === 0) {
      orphanNotes.push(node.note);
    }

    for (const link of node.note.links) {
      if (link.type === 'markdown' && !link.target.endsWith('.md')) {
        continue;
      }

      if (!checkAttachments && isAttachment(link.target)) {
        continue;
      }

      const resolvedPath = resolver.resolve(link.target);

      if (resolvedPath === node.note.path) {
        continue;
      }

      if (!resolvedPath) {
        brokenLinks.push({
          source: node.note.relativePath,
          link,
          reason: `Target "${link.target}" not found in vault`,
        });
      } else if (link.type === 'embed' || link.type === 'markdown') {
        if (!existsSync(resolvedPath)) {
          brokenLinks.push({
            source: node.note.relativePath,
            link,
            reason: `File "${link.target}" does not exist`,
          });
        }
      }
    }
  }

  const connectedComponents = countConnectedComponents(graph);
  const totalLinks = notes.reduce((sum, n) => sum + n.links.length, 0);

  return {
    brokenLinks,
    orphanNotes,
    graph,
    stats: {
      totalNotes: notes.length,
      totalLinks,
      brokenCount: brokenLinks.length,
      orphanCount: orphanNotes.length,
      connectedComponents,
    },
  };
}

function countConnectedComponents(graph: GraphNode[]): number {
  if (graph.length === 0) return 0;

  const visited = new Set<string>();
  let components = 0;

  const adjacency = new Map<string, string[]>();
  for (const node of graph) {
    adjacency.set(node.note.path, [...node.incoming, ...node.outgoing]);
  }

  for (const node of graph) {
    if (visited.has(node.note.path)) continue;

    components++;
    const stack = [node.note.path];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return components;
}
