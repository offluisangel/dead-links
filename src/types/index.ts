export interface Note {
  path: string;
  relativePath: string;
  content: string;
  aliases: string[];
  links: Link[];
}

export interface Link {
  raw: string;
  target: string;
  alias?: string;
  heading?: string;
  blockId?: string;
  type: 'wiki' | 'embed' | 'markdown';
  line: number;
}

export interface GraphNode {
  note: Note;
  incoming: string[];
  outgoing: string[];
}

export interface BrokenLink {
  source: string;
  link: Link;
  reason: string;
}

export interface AnalysisReport {
  brokenLinks: BrokenLink[];
  orphanNotes: Note[];
  graph: GraphNode[];
  stats: {
    totalNotes: number;
    totalLinks: number;
    brokenCount: number;
    orphanCount: number;
    connectedComponents: number;
  };
  duration: number;
}

export interface DeadLinksConfig {
  ignore?: string[];
  checkAttachments?: boolean;
  ignoreFolders?: string[];
}
