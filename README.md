# dead-links

A CLI tool to scan your Obsidian vault for broken links, orphan notes, and connection graphs.

## Usage

```bash
npx dead-links scan --vault "my-vault"
npx dead-links broken --vault "my-vault" --verbose
npx dead-links orphans --vault "my-vault" --ignore-folders Films Diary
npx dead-links graph --vault "my-vault" --format json
npx dead-links report --vault "my-vault" --output report.md
```

## Commands

| Command | Description |
|---------|-------------|
| `dead-links scan` | Full scan: broken links + orphan notes + graph |
| `dead-links broken` | Show only broken links |
| `dead-links orphans` | Show only orphan notes |
| `dead-links graph` | Show connection graph |
| `dead-links report` | Generate a `.md` report file |

### scan

```bash
dead-links scan [options]

Options:
  --vault <path>              Path to the Obsidian vault (default: current directory)
  --format <type>            Output format: text, json, markdown (default: text)
  --output <file>            Save output to a file
  --ignore <patterns...>     Glob patterns to ignore
  --attachments              Also check embedded attachments (images, PDFs)
  --ignore-folders <folders> Exclude folders from orphan report
  --quiet                    Only show issues, no stats
  --no-color                 Disable colored output
```

### broken

```bash
dead-links broken [options]

Options:
  --vault <path>         Path to the Obsidian vault (default: current directory)
  --ignore <patterns...> Glob patterns to ignore
  --attachments          Also check embedded attachments
  --verbose              Show line numbers and full details
```

### orphans

```bash
dead-links orphans [options]

Options:
  --vault <path>              Path to the Obsidian vault (default: current directory)
  --ignore <patterns...>      Glob patterns to ignore
  --ignore-folders <folders>  Exclude folders from report
  --verbose                   Show full list of orphan notes
```

### graph

```bash
dead-links graph [options]

Options:
  --vault <path>         Path to the Obsidian vault (default: current directory)
  --format <type>        Output format: text, json (default: text)
  --ignore <patterns...> Glob patterns to ignore
```

### report

```bash
dead-links report [options]

Options:
  --vault <path>         Path to the Obsidian vault (default: current directory)
  --output <file>        Output file path (default: dead-links-report.md)
  --ignore <patterns...> Glob patterns to ignore
```

## Quick Start

```bash
# Full scan
npx dead-links scan --vault "my-vault"

# Check for broken links only with verbose output
npx dead-links broken --vault "my-vault" --verbose

# Include attachments in the check
npx dead-links scan --vault "my-vault" --attachments

# Ignore noisy folders from orphan report
npx dead-links scan --vault "my-vault" --ignore-folders Films Diary Books

# JSON output for scripts/CI
npx dead-links scan --vault "my-vault" --format json

# Generate markdown report
npx dead-links report --vault "my-vault" --output report.md

# Ignore patterns
npx dead-links scan --vault "my-vault" --ignore "**/Templates/**" "**/.trash/**"

# Quiet mode (only issues)
npx dead-links scan --vault "my-vault" --quiet

# Disable colors
npx dead-links scan --vault "my-vault" --no-color

# Show orphan notes list
npx dead-links orphans --vault "my-vault" --verbose
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

## License
MIT
