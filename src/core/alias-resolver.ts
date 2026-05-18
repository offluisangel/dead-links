import type { Note } from '../types/index.js';

export class AliasResolver {
  private aliasToNote: Map<string, string> = new Map();
  private fileNameToNote: Map<string, string> = new Map();
  private basenameToNote: Map<string, string> = new Map();

  constructor(notes: Note[]) {
    for (const note of notes) {
      const fileName = note.relativePath.replace(/\.(md|canvas)$/, '');
      const basename = fileName.split('/').pop()!;

      this.fileNameToNote.set(fileName.toLowerCase(), note.path);
      this.basenameToNote.set(basename.toLowerCase(), note.path);

      try {
        this.fileNameToNote.set(decodeURIComponent(fileName).toLowerCase(), note.path);
        this.basenameToNote.set(decodeURIComponent(basename).toLowerCase(), note.path);
      } catch {
        // skip malformed URIs
      }

      for (const alias of note.aliases) {
        this.aliasToNote.set(alias.toLowerCase(), note.path);
      }
    }
  }

  resolve(target: string): string | null {
    const normalized = target.toLowerCase().trim();

    if (this.aliasToNote.has(normalized)) {
      return this.aliasToNote.get(normalized)!;
    }

    if (this.fileNameToNote.has(normalized)) {
      return this.fileNameToNote.get(normalized)!;
    }

    if (this.basenameToNote.has(normalized)) {
      return this.basenameToNote.get(normalized)!;
    }

    const decoded = (() => {
      try {
        return decodeURIComponent(normalized);
      } catch {
        return normalized;
      }
    })();

    if (this.aliasToNote.has(decoded)) {
      return this.aliasToNote.get(decoded)!;
    }
    if (this.fileNameToNote.has(decoded)) {
      return this.fileNameToNote.get(decoded)!;
    }
    if (this.basenameToNote.has(decoded)) {
      return this.basenameToNote.get(decoded)!;
    }

    return null;
  }
}
