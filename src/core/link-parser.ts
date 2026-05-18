import type { Link } from '../types/index.js';

const wikiLinkRegex = /!?\[\[([^\]]+)\]\]/g;
const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

export function parseLinks(content: string): Link[] {
  const links: Link[] = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum]!;

    for (const match of line.matchAll(wikiLinkRegex)) {
      const raw = match[0]!;
      const inner = match[1]!;
      const isEmbed = raw.startsWith('!');

      const link = parseWikiLink(inner, raw, isEmbed, lineNum + 1);
      links.push(link);
    }

    for (const match of line.matchAll(markdownLinkRegex)) {
      const raw = match[0]!;
      const target = match[2]!;

      if (target.startsWith('#')) continue;

      const link: Link = {
        raw,
        target: target.split('#')[0]!.split('|')[0]!,
        heading: target.includes('#') ? target.split('#')[1] : undefined,
        type: 'markdown',
        line: lineNum + 1,
      };
      links.push(link);
    }
  }

  return links;
}

function parseWikiLink(inner: string, raw: string, isEmbed: boolean, line: number): Link {
  const [targetPart, aliasPart] = inner.split('|');
  const [target, ...rest] = targetPart!.split('#');

  let heading: string | undefined;
  let blockId: string | undefined;

  if (rest.length > 0) {
    const remainder = rest.join('#');
    if (remainder.startsWith('^')) {
      blockId = remainder.slice(1);
    } else {
      heading = remainder;
    }
  }

  return {
    raw,
    target: target!.trim(),
    alias: aliasPart?.trim(),
    heading,
    blockId,
    type: isEmbed ? 'embed' : 'wiki',
    line,
  };
}
