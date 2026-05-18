import { describe, it, expect } from 'vitest';
import { AliasResolver } from '../src/core/alias-resolver.js';
import type { Note } from '../src/types/index.js';

describe('AliasResolver', () => {
  const notes: Note[] = [
    {
      path: '/vault/My Note.md',
      relativePath: 'My Note.md',
      content: '',
      aliases: ['MN', 'My Alias'],
      links: [],
    },
    {
      path: '/vault/Another.md',
      relativePath: 'Another.md',
      content: '',
      aliases: [],
      links: [],
    },
  ];

  it('resolves by filename', () => {
    const resolver = new AliasResolver(notes);
    expect(resolver.resolve('My Note')).toBe('/vault/My Note.md');
  });

  it('resolves by alias', () => {
    const resolver = new AliasResolver(notes);
    expect(resolver.resolve('MN')).toBe('/vault/My Note.md');
    expect(resolver.resolve('My Alias')).toBe('/vault/My Note.md');
  });

  it('is case insensitive', () => {
    const resolver = new AliasResolver(notes);
    expect(resolver.resolve('my note')).toBe('/vault/My Note.md');
    expect(resolver.resolve('mn')).toBe('/vault/My Note.md');
  });

  it('returns null for non-existent notes', () => {
    const resolver = new AliasResolver(notes);
    expect(resolver.resolve('Does Not Exist')).toBeNull();
  });

  it('handles URL encoded filenames', () => {
    const resolver = new AliasResolver(notes);
    expect(resolver.resolve(decodeURIComponent('My%20Note'))).toBe('/vault/My Note.md');
  });

  it('resolves by basename when note is in subfolder', () => {
    const subfolderNotes: Note[] = [
      {
        path: '/vault/Folder/Sub Note.md',
        relativePath: 'Folder/Sub Note.md',
        content: '',
        aliases: [],
        links: [],
      },
      {
        path: '/vault/Other/Deep/Nested/Note.md',
        relativePath: 'Other/Deep/Nested/Note.md',
        content: '',
        aliases: [],
        links: [],
      },
    ];
    const resolver = new AliasResolver(subfolderNotes);
    expect(resolver.resolve('Sub Note')).toBe('/vault/Folder/Sub Note.md');
    expect(resolver.resolve('Note')).toBe('/vault/Other/Deep/Nested/Note.md');
    expect(resolver.resolve('Folder/Sub Note')).toBe('/vault/Folder/Sub Note.md');
  });
});
