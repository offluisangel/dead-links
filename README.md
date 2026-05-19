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
| `dead-links broken` | Show only broken links with smart suggestions |
| `dead-links orphans` | Show only orphan notes |
| `dead-links graph` | Show connection graph |
| `dead-links report` | Generate a `.md` report file |
| `dead-links stats` | **NEW** Show detailed vault statistics |

### scan

```bash
dead-links scan [options]

Options:
  --vault <path>              Path to the Obsidian vault (default: current directory)
  --format <type>            Output format: text, json, markdown, csv, html, mermaid, dot (default: text)
  --output <file>            Save output to a file
  --ignore <patterns...>     Glob patterns to ignore
  --attachments              Also check embedded attachments (images, PDFs)
  --ignore-folders <folders> Exclude folders from orphan report
  --quiet                    Only show issues, no stats
  --no-color                 Disable colored output
  --suggestions              Show smart suggestions for broken links
  --debug                    Enable debug mode with verbose output
  --fix                      Auto-fix broken links (structure ready)
```

### broken

```bash
dead-links broken [options]

Options:
  --vault <path>         Path to the Obsidian vault (default: current directory)
  --ignore <patterns...> Glob patterns to ignore
  --attachments          Also check embedded attachments
  --verbose              Show line numbers and full details
  --suggestions          Show smart suggestions for broken links
  --debug                Enable debug mode
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

### stats

```bash
dead-links stats [options]

Options:
  --vault <path>         Path to the Obsidian vault (default: current directory)
  --ignore <patterns...> Glob patterns to ignore
  --debug                Enable debug mode

Shows:
  • Total notes and links count
  • Average links per note
  • Vault health score
  • Most connected notes
  • Orphan notes preview
  • Connected components
```

## Quick Start

```bash
# Full scan with suggestions
npx dead-links scan --vault "my-vault" --suggestions

# Check for broken links with suggestions
npx dead-links broken --vault "my-vault" --suggestions

# Detailed vault statistics
npx dead-links stats --vault "my-vault"

# Interactive HTML report
npx dead-links scan --vault "my-vault" --format html --output report.html

# CSV export for spreadsheets
npx dead-links scan --vault "my-vault" --format csv --output issues.csv

# Graph visualization (Mermaid diagram)
npx dead-links scan --vault "my-vault" --format mermaid --output graph.md

# Graph visualization (GraphViz/DOT format)
npx dead-links scan --vault "my-vault" --format dot --output graph.dot

# Markdown report
npx dead-links report --vault "my-vault" --output report.md

# Debug mode (verbose)
npx dead-links scan --vault "my-vault" --debug

# Include attachments in the check
npx dead-links scan --vault "my-vault" --attachments

# Ignore noisy folders from orphan report
npx dead-links scan --vault "my-vault" --ignore-folders Films Diary Books

# JSON output for scripts/CI
npx dead-links scan --vault "my-vault" --format json

# Ignore patterns
npx dead-links scan --vault "my-vault" --ignore "**/Templates/**" "**/.trash/**"

# Quiet mode (only issues)
npx dead-links scan --vault "my-vault" --quiet

# Disable colors
npx dead-links scan --vault "my-vault" --no-color

# Show orphan notes list
npx dead-links orphans --vault "my-vault" --verbose
```
## Opening Reports

After generating a report with `--output`, you can open it with:

```bash
# Windows
start report.html

# macOS
open report.html

# Linux
xdg-open report.html

# Or navigate to the file in your file explorer and double-click it
```

The generated files are saved in your current directory:
- `report.html` - Open in any web browser
- `issues.csv` - Open with Excel, Google Sheets, or any spreadsheet app
- `graph.md` - View in GitHub, Obsidian, or any markdown viewer
- `graph.dot` - Render with Graphviz: `dot -Tpng graph.dot -o graph.png`
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
  "checkAttachments": false,
  "suggestions": true,
  "debug": false,
  "fix": false
}
```

## Output Formats

### Text (default)
Colorful terminal output with stats, broken links, and orphan notes grouped by folder.

### JSON
Machine-readable format for automation and scripting.

### Markdown
Human-readable report with sections for broken links and orphan notes.

### CSV
Tabular format compatible with Excel, Google Sheets, and data analysis tools.

### HTML
Beautiful interactive dashboard with:
- Live search and filtering
- Stats cards with metrics
- Sortable tables
- Most connected notes preview
- Responsive design

### Mermaid
Graph visualization in Mermaid syntax. Render in:
- GitHub README files
- Obsidian notes
- Notion docs
- Online editors (mermaid.live)

### GraphViz (DOT)
Professional graph format for advanced visualization tools:
- Graphviz CLI: `dot -Tpng graph.dot -o graph.png`
- Online: webgraphviz.com

## Smart Suggestions

The `--suggestions` flag uses Levenshtein distance algorithm to recommend fixes for broken links:

```bash
npx dead-links broken --vault "my-vault" --suggestions
```

Example output:
```
💡 Suggestions:
  MyNote → MyNotes (95%)
  ProjectXY → ProjectXYZ (87%)
  Article2 → Article1 (72%)
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

## Version & Status

**Current Version:** v0.2.0

### What's New in v0.2.0
- Multiple export formats (HTML, CSV, Mermaid, GraphViz)
- Smart suggestions with similarity scoring
- New `stats` command with vault metrics
- Debug mode for diagnostics

## License
MIT
