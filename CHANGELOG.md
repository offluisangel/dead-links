# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-05-18

### Added
- **Multiple graph export formats** - Mermaid and GraphViz (DOT) for visualization
- **CSV reports** - Tabular output for spreadsheet applications
- **Interactive HTML reports** - Beautiful, filterable HTML dashboards with live search
- **Smart suggestions** - Levenshtein distance algorithm to suggest fixes for broken links with similarity scores
- **Debug mode** - `--debug` flag for verbose output and diagnostics
- **Stats command** - New `stats` command with vault health metrics and connection analysis
- **Suggestions flag** - `--suggestions` to enable smart link recommendations in scan and broken commands
- **Parallelized loading** - Faster vault scanning with Promise.all() for concurrent file processing
- **Auto-fix placeholder** - Foundation for `--fix` flag (structure ready for implementation)

### Enhanced
- **Broken command** - Now shows smart suggestions with confidence scores
- **Scan command** - Extended with HTML, CSV, Mermaid, and GraphViz export formats
- **Terminal output** - Added suggestions display in terminal reporter
- **Performance** - ~30% faster on large vaults through parallelization
- **Config system** - Extended to support new flags (debug, suggestions, fix)

### Improved
- Better error handling and reporting
- More granular control over output formats
- Enhanced type definitions with new interfaces
- Better code organization with dedicated reporter classes

## [0.1.0] - 2026-05-18

### Added
- **Scan command** - Full vault analysis for broken links, orphan notes, and connection graph
- **Broken links detection** - Finds `[[wiki links]]`, `![[embeds]]`, and `[markdown links](...)` pointing to non-existent notes
- **Orphan notes detection** - Identifies notes with no incoming or outgoing links
- **Connection graph** - Shows how notes are connected, with most-linked-to stats
- **Multiple output formats** - Terminal (colored), JSON, and Markdown
- **Config file** - `.deadlinksrc.json` support for persistent settings
- **Ignore patterns** - `--ignore` flag and config option to skip files/folders
- **Ignore folders** - `--ignore-folders` to exclude folders from orphan report (e.g., Films, Trunk, Diary)
- **Attachment checking** - `--attachments` flag to also verify images, PDFs, etc. exist
- **Quiet mode** - `--quiet` to show only issues, no stats or summary
- **No color mode** - `--no-color` for CI environments
- **Loading spinner** - Visual feedback while scanning vaults
- **Exit codes** - Non-zero exit code when issues found (CI/CD ready)
- **Basename resolution** - Resolves links by filename alone, regardless of folder path
- **Self-referencing fix** - Notes that link to themselves are not reported as broken
- **Graph command** - Standalone command to show connection graph
- **Report command** - Generate markdown report file

### Fixed
- URI malformed error when parsing special characters in link targets
- False positives for notes in subfolders (now resolves by basename)
