import { describe, it, expect } from 'vitest';
import { parseLinks } from '../src/core/link-parser.js';

describe('parseLinks', () => {
  it('parses simple wiki links', () => {
    const content = 'Check out [[My Note]] for more info.';
    const links = parseLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: 'My Note',
      type: 'wiki',
      line: 1,
    });
  });

  it('parses wiki links with alias', () => {
    const content = 'See [[Real Note|Display Text]]';
    const links = parseLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: 'Real Note',
      alias: 'Display Text',
    });
  });

  it('parses wiki links with heading', () => {
    const content = 'Go to [[Note#Section]]';
    const links = parseLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: 'Note',
      heading: 'Section',
    });
  });

  it('parses wiki links with block id', () => {
    const content = 'Reference [[Note#^abc123]]';
    const links = parseLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: 'Note',
      blockId: 'abc123',
    });
  });

  it('parses embed links', () => {
    const content = '![image]]';
    const embed = '![[image.png]]';
    const links = parseLinks(embed);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: 'image.png',
      type: 'embed',
    });
  });

  it('parses markdown links', () => {
    const content = '[Click here](./path/to/file.md)';
    const links = parseLinks(content);

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: './path/to/file.md',
      type: 'markdown',
    });
  });

  it('parses multiple links on different lines', () => {
    const content = '[[Note One]]\nSome text\n[[Note Two]]';
    const links = parseLinks(content);

    expect(links).toHaveLength(2);
    expect(links[0]!.line).toBe(1);
    expect(links[1]!.line).toBe(3);
  });

  it('parses multiple links on same line', () => {
    const content = '[[Note A]] and [[Note B]]';
    const links = parseLinks(content);

    expect(links).toHaveLength(2);
    expect(links[0]!.target).toBe('Note A');
    expect(links[1]!.target).toBe('Note B');
  });
});
