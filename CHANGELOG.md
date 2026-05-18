# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-05-18

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

### Changed
- **Output format** - Compact scannable output with bars, pills, and grouped results
- **Orphan display** - Grouped by folder with proportional bars instead of full list

## [0.1.0] - 2026-05-17

### Added
- Initial release
- Basic broken link detection
- Orphan note detection