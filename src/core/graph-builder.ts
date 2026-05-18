import type { Note, GraphNode, Link } from '../types/index.js';
import { AliasResolver } from './alias-resolver.js';

export function buildGraph(notes: Note[], resolver: AliasResolver): GraphNode[] {
  const notePathMap = new Map<string, GraphNode>();

  for (const note of notes) {
    notePathMap.set(note.path, {
      note,
      incoming: [],
      outgoing: [],
    });
  }

  for (const note of notes) {
    const node = notePathMap.get(note.path)!;

    for (const link of note.links) {
      if (link.type === 'markdown' && !link.target.endsWith('.md')) {
        continue;
      }

      const resolvedPath = resolver.resolve(link.target);

      if (resolvedPath && notePathMap.has(resolvedPath)) {
        if (!node.outgoing.includes(resolvedPath)) {
          node.outgoing.push(resolvedPath);
        }

        const targetNode = notePathMap.get(resolvedPath)!;
        if (!targetNode.incoming.includes(note.path)) {
          targetNode.incoming.push(note.path);
        }
      }
    }
  }

  return Array.from(notePathMap.values());
}
