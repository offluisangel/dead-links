# dead-links v1.0.0

A powerful CLI tool to analyze your Obsidian vault and find broken links, orphan notes, and connection graphs.

## What's New

### 🎯 Core Features
- **Broken link detection** - Finds `[[wiki links]]`, `![[embeds]]`, and `[markdown links](...)` pointing to non-existent notes
- **Orphan note detection** - Identifies notes with no incoming or outgoing links
- **Connection graph** - Shows how notes are connected with most-linked-to stats

### 🚀 Highlights
- **Compact, scannable output** - Color-coded results with bars and grouped displays
- **Config file support** - `.deadlinksrc.json` for persistent settings
- **CI/CD ready** - Exit codes for automated pipelines
- **Multiple output formats** - Terminal (colored), JSON, and Markdown reports

### 🛠️ Options
- `--vault` - Specify vault path
- `--format` - text, json, or markdown output
- `--ignore` - Glob patterns to skip
- `--attachments` - Check if images/PDFs exist
- `--ignore-folders` - Exclude folders from orphan report
- `--quiet` - Only show issues, no stats
- `--verbose` - Full details with line numbers

## Quick Start

```bash
# Install
npm install -g dead-links

# Scan your vault
dead-links scan --vault ./my-vault

# Or use npx
npx dead-links scan --vault ./my-vault
```

## Example Output

```
  Notes           368
  Links           943
  Broken links    5
  Orphan notes    222

✖  Broken links (5)

  ✖  2  Universidad/S1/Primer Semestre.md
      [Missing Note 1]
      [Missing Note 2]

⚠  Orphan notes (222 total)

  Notes/                                    ██████████  29
  Dev/Projects/                             ███░░░░░░░  8

  Completed in 234ms
```

## Breaking Changes

None. This is the initial release.

## Full Changelog

- See [CHANGELOG.md](https://github.com/offluisangel/dead-links/blob/main/CHANGELOG.md) for detailed changes.