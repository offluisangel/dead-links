# dead-links

A CLI tool to scan your Obsidian vault for broken links, orphan notes, and connection graphs.

## Installation

```bash
npm install -g dead-links
```

Or use without installing:

```bash
npx dead-links scan --vault ./my-vault
```

## Quick Start

```bash
dead-links scan --vault ./my-vault
```

That's it. You'll see broken links, orphan notes, and graph stats.

## Commands

| Command | Description |
|---------|-------------|
| `dead-links scan` | Full scan: broken links + orphan notes + graph |
| `dead-links broken` | Show only broken links |
| `dead-links orphans` | Show only orphan notes |
| `dead-links graph` | Show connection graph |
| `dead-links report` | Generate a `.md` report file |

## Options

| Flag | Description |
|------|-------------|
| `--vault <path>` | Path to the vault (default: current directory) |
| `--format <type>` | Output format: `text`, `json`, or `markdown` (default: `text`) |
| `--output <file>` | Save output to a file |
| `--ignore <patterns...>` | Glob patterns to ignore |
| `--attachments` | Also check if images/PDFs/files exist |
| `--ignore-folders <folders...>` | Exclude folders from orphan report |
| `--quiet` | Only show issues, no stats or summary |
| `--no-color` | Disable colored output |
| `--verbose` | Show line numbers and full details |

## Examples

```bash
# Scan vault
dead-links scan --vault ./my-vault

# Check for broken links only
dead-links broken --vault ./my-vault

# Include attachments in the check
dead-links scan --vault ./my-vault --attachments

# Ignore noisy folders from orphan report
dead-links scan --vault ./my-vault --ignore-folders Films Trunk Diary

# JSON output for scripts/CI
dead-links scan --vault ./my-vault --format json

# Generate markdown report
dead-links report --vault ./my-vault --output report.md

# Ignore patterns
dead-links scan --vault ./my-vault --ignore "**/Templates/**" "**/.trash/**"

# Quiet mode (only issues)
dead-links scan --vault ./my-vault --quiet
```

## Output Format

```
  Notes           368
  Links           943
  Broken links    5
  Orphan notes    222
  Components      248

✖  Broken links (5)

  ✖  2  Universidad/S1/Primer Semestre.md
      [Missing Note 1]
      [Missing Note 2]

  ✖  1  Notes/My Note.md
      [Another Missing]

⚠  Orphan notes (222 total)

  Notes/                                    ██████████  29
  Dev/Projects/                             ███░░░░░░░  8

  Completed in 234ms
```

## Configuration

Create a `.deadlinksrc.json` in your vault root for persistent settings:

```json
{
  "ignore": ["**/Templates/**", "**/.trash/**"],
  "ignoreFolders": ["Films", "Trunk", "Diary", "Books", "Games"],
  "checkAttachments": false
}
```

## CI/CD

Exit code is `0` if no issues found, `1` if issues exist. Perfect for CI pipelines.

```bash
# GitHub Actions
- run: npx dead-links scan --vault . --format json > report.json

# Fail pipeline if broken links exist
- run: npx dead-links scan --vault . --quiet && exit 1 || true
```

## Links Detected

- `[[Note]]` - Wiki links
- `[[Note|Alias]]` - Wiki links with alias
- `[[Note#Section]]` - Wiki links with heading
- `[[Note#^blockid]]` - Wiki links with block reference
- `![[image.png]]` - Embeds
- `[text](file.md)` - Markdown links

## Development

```bash
pnpm install
pnpm run build
pnpm test
pnpm run lint
```

## License

MIT
