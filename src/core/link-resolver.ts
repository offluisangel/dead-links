import { dirname, isAbsolute, normalize, resolve } from 'node:path';
import type { Link, Note } from '../types/index.js';
import { AliasResolver } from './alias-resolver.js';

const REMOTE_TARGET = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function isExternalTarget(target: string): boolean {
  return REMOTE_TARGET.test(target) || target.startsWith('#');
}

export function resolveNoteLink(
  link: Link,
  source: Note,
  notes: Note[],
  aliases: AliasResolver,
  vaultPath: string,
): string | null {
  if (isExternalTarget(link.target)) return null;

  if (link.type === 'markdown') {
    const target = decodeTarget(link.target).replace(/\\/g, '/');
    const sourceRelativePath = normalize(resolve(dirname(source.path), target));
    const exact = notes.find((note) => normalize(note.path) === sourceRelativePath);
    if (exact) return exact.path;

    // A vault-relative Markdown destination is also valid in common Obsidian vaults.
    const vaultRelativePath = normalize(resolve(vaultPath, target.replace(/^\/+/, '')));
    const vaultRelative = notes.find((note) => normalize(note.path) === vaultRelativePath);
    if (vaultRelative) return vaultRelative.path;
  }

  return aliases.resolve(decodeTarget(link.target));
}

export function resolveAttachmentPath(
  target: string,
  source: Note,
  vaultPath: string,
): string {
  const decoded = decodeTarget(target).replace(/\\/g, '/');
  if (isAbsolute(decoded)) return normalize(decoded);

  const relativeToSource = normalize(resolve(dirname(source.path), decoded));
  if (relativeToSource.startsWith(normalize(vaultPath))) return relativeToSource;

  return normalize(resolve(vaultPath, decoded.replace(/^\/+/, '')));
}

function decodeTarget(target: string): string {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}
