import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Note, GraphNode, BrokenLink, AnalysisReport } from '../types/index.js';
import { AliasResolver } from './alias-resolver.js';
import { buildGraph } from './graph-builder.js';
import { isExternalTarget, resolveAttachmentPath, resolveNoteLink } from './link-resolver.js';

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
  ignoreFolders: string[] = [],
): AnalysisReport {
  const resolver = new AliasResolver(notes);
  const graph = buildGraph(notes, resolver, vaultPath);

  const brokenLinks: BrokenLink[] = [];
  const orphanNotes: Note[] = [];

  for (const node of graph) {
    if (node.incoming.length === 0 && node.outgoing.length === 0) {
      if (!isIgnoredFolder(node.note.relativePath, ignoreFolders)) {
        orphanNotes.push(node.note);
      }
    }

    for (const link of node.note.links) {
      if (isExternalTarget(link.target)) {
        continue;
      }

      if (isAttachment(link.target)) {
        if (!checkAttachments) continue;
        const attachmentPath = resolveAttachmentPath(link.target, node.note, vaultPath);
        if (!existsSync(attachmentPath)) {
          brokenLinks.push({
            source: node.note.relativePath,
            link,
            reason: `File "${link.target}" does not exist`,
          });
        }
        continue;
      }

      const resolvedPath = resolveNoteLink(link, node.note, notes, resolver, vaultPath);

      if (resolvedPath === node.note.path) {
        continue;
      }

      if (!resolvedPath) {
        brokenLinks.push({
          source: node.note.relativePath,
          link,
          reason: `Target "${link.target}" not found in vault`,
        });
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

function isIgnoredFolder(relativePath: string, ignoreFolders: string[]): boolean {
  const folder = relativePath.includes('/')
    ? relativePath.split('/').slice(0, -1).join('/')
    : '';
  return ignoreFolders.some((ignored) => {
    const normalized = ignored.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    return folder === normalized || folder.startsWith(`${normalized}/`);
  });
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
