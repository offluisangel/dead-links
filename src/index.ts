import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import ora from 'ora';
import { DeadLinksEngine } from './utils/engine.js';
import { ConfigLoader } from './utils/config-loader.js';
import { TerminalReporter } from './reporters/terminal-reporter.js';
import { JsonReporter } from './reporters/json-reporter.js';
import { CsvReporter } from './reporters/csv-reporter.js';
import { HtmlReporter } from './reporters/html-reporter.js';
import { MermaidReporter } from './reporters/mermaid-reporter.js';
import { GraphVizReporter } from './reporters/graphviz-reporter.js';
import { generateMarkdownReport } from './utils/markdown-report.js';
import type { BrokenLink, Note } from './types/index.js';

const program = new Command();

program
  .name('dead-links')
  .description('Scan Obsidian vaults for broken links, orphan notes, and connection graphs')
  .version('0.2.0');

async function loadConfigAndAnalyze(
  vaultPath: string,
  cliOptions: Record<string, unknown>,
) {
  const configLoader = new ConfigLoader();
  const fileConfig = await configLoader.loadConfig(vaultPath);
  const config = configLoader.mergeConfig(fileConfig, cliOptions);

  const engine = new DeadLinksEngine();
  return engine.analyze(vaultPath, config);
}

function printBrokenVerbose(brokenLinks: BrokenLink[]) {
  const grouped = new Map<string, BrokenLink[]>();
  for (const b of brokenLinks) {
    const existing = grouped.get(b.source) || [];
    existing.push(b);
    grouped.set(b.source, existing);
  }

  for (const [source, links] of grouped) {
    for (const link of links) {
      console.log(`  ${source}  →  ${link.link.target}  (line ${link.link.line})`);
    }
  }
}

function printOrphansVerbose(orphanNotes: Note[]) {
  for (const note of orphanNotes) {
    console.log(`  ${note.relativePath}`);
  }
}

program
  .command('scan')
  .description('Scan the vault for all issues')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--format <type>', 'Output format: text, json, markdown, csv, html, mermaid, dot', 'text')
  .option('--output <file>', 'Output file path')
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--attachments', 'Also check embedded attachments (images, PDFs, etc.)')
  .option('--ignore-folders <folders...>', 'Exclude folders from orphan report')
  .option('--quiet', 'Only show issues, no stats or summary')
  .option('--no-color', 'Disable colored output')
  .option('--suggestions', 'Show smart suggestions for broken links')
  .option('--debug', 'Enable debug mode with verbose output')
  .option('--fix', 'Automatically fix broken links (requires suggestions)')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      if (options.debug) {
        console.log(`[DEBUG] Vault: ${options.vault}`);
        console.log(`[DEBUG] Format: ${options.format}`);
        console.log(`[DEBUG] Broken links: ${report.stats.brokenCount}`);
        console.log(`[DEBUG] Orphan notes: ${report.stats.orphanCount}`);
      }

      let output = '';

      if (options.format === 'json') {
        const reporter = new JsonReporter();
        output = reporter.report(report);
      } else if (options.format === 'markdown') {
        output = generateMarkdownReport(report);
      } else if (options.format === 'csv') {
        const reporter = new CsvReporter();
        output = reporter.report(report);
      } else if (options.format === 'html') {
        const reporter = new HtmlReporter();
        output = reporter.report(report);
      } else if (options.format === 'mermaid') {
        const reporter = new MermaidReporter();
        output = reporter.report(report);
      } else if (options.format === 'dot') {
        const reporter = new GraphVizReporter();
        output = reporter.report(report);
      } else {
        const reporter = new TerminalReporter(options.ignoreFolders || [], options.quiet || false);
        output = reporter.report(report);
      }

      if (options.output) {
        await writeFile(options.output, output);
        console.log(`Report written to ${options.output}`);
      } else if (options.format === 'text') {
        console.log(output);
      } else {
        console.log(output);
      }

      process.exit(report.stats.brokenCount > 0 || report.stats.orphanCount > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('broken')
  .description('Show only broken links')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--attachments', 'Also check embedded attachments (images, PDFs, etc.)')
  .option('--verbose', 'Show line numbers and full details')
  .option('--suggestions', 'Show smart suggestions for broken links')
  .option('--debug', 'Enable debug mode with verbose output')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      if (report.brokenLinks.length === 0) {
        console.log('No broken links found.');
      } else {
        console.log(`\nBroken links (${report.brokenLinks.length})\n`);
        if (options.verbose) {
          printBrokenVerbose(report.brokenLinks);
        } else {
          const grouped = new Map<string, BrokenLink[]>();
          for (const b of report.brokenLinks) {
            const existing = grouped.get(b.source) || [];
            existing.push(b);
            grouped.set(b.source, existing);
          }
          for (const [source, links] of grouped) {
            const targets = links.map((l: BrokenLink) => l.link.target).join(', ');
            console.log(`  ${source}  →  ${targets}`);
          }
        }
        console.log();

        if (report.suggestions && report.suggestions.length > 0) {
          console.log('💡 Suggestions:');
          for (const suggestion of report.suggestions.slice(0, 5)) {
            const confidence = Math.round(suggestion.similarity * 100);
            console.log(`  ${suggestion.broken} → ${suggestion.suggested} (${confidence}%)`);
          }
          console.log();
        }
      }

      process.exit(report.stats.brokenCount > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('orphans')
  .description('Show only orphan notes')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--ignore-folders <folders...>', 'Exclude folders from report')
  .option('--verbose', 'Show full list of orphan notes')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      if (report.orphanNotes.length === 0) {
        console.log('No orphan notes found.');
      } else {
        console.log(`\nOrphan notes (${report.orphanNotes.length})\n`);
        if (options.verbose) {
          printOrphansVerbose(report.orphanNotes);
        } else {
          const ignoreFolders = options.ignoreFolders || [];
          const byFolder = new Map<string, number>();
          for (const note of report.orphanNotes) {
            const folder = note.relativePath.includes('/')
              ? note.relativePath.split('/').slice(0, -1).join('/') + '/'
              : './';
            if (ignoreFolders.some((f: string) => folder.startsWith(f + '/') || folder === f + '/')) {
              continue;
            }
            byFolder.set(folder, (byFolder.get(folder) || 0) + 1);
          }
          for (const [folder, count] of [...byFolder.entries()].sort((a, b) => b[1] - a[1])) {
            console.log(`  ${folder}  ${count}`);
          }
        }
        console.log();
      }

      process.exit(report.stats.orphanCount > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('graph')
  .description('Show connection graph')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--format <type>', 'Output format: text, json', 'text')
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      if (options.format === 'json') {
        console.log(JSON.stringify(report.graph, null, 2));
      } else {
        console.log(
          `Graph: ${report.stats.totalNotes} notes, ${report.stats.totalLinks} links (${report.duration}ms)\n`,
        );

        const topConnected = [...report.graph]
          .sort((a, b) => b.incoming.length - a.incoming.length)
          .slice(0, 10)
          .filter((n) => n.incoming.length > 0);

        if (topConnected.length > 0) {
          console.log('Most linked-to notes:');
          for (const node of topConnected) {
            console.log(
              `  ${node.note.relativePath} (${node.incoming.length} incoming, ${node.outgoing.length} outgoing)`,
            );
          }
        }
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a markdown report')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--output <file>', 'Output file path', 'dead-links-report.md')
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      const markdown = generateMarkdownReport(report);
      await writeFile(options.output, markdown);
      console.log(`Report written to ${options.output}`);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show detailed vault statistics')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--debug', 'Enable debug mode')
  .action(async (options) => {
    const spinner = ora('Analyzing vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Analysis complete in ${report.duration}ms`);

      console.log('\n📊 Vault Statistics\n');
      console.log(`  Total Notes: ${report.stats.totalNotes}`);
      console.log(`  Total Links: ${report.stats.totalLinks}`);
      console.log(`  Avg Links per Note: ${(report.stats.totalLinks / report.stats.totalNotes).toFixed(2)}`);
      console.log(`  Broken Links: ${report.stats.brokenCount}`);
      console.log(`  Orphan Notes: ${report.stats.orphanCount}`);
      console.log(`  Connected Components: ${report.stats.connectedComponents}`);
      console.log(`  Health Score: ${(100 - (report.stats.brokenCount / report.stats.totalLinks) * 100).toFixed(1)}%`);

      const mostConnected = [...report.graph]
        .sort((a, b) => (b.incoming.length + b.outgoing.length) - (a.incoming.length + a.outgoing.length))
        .slice(0, 5);

      console.log('\n🌐 Most Connected Notes:');
      for (const node of mostConnected) {
        const total = node.incoming.length + node.outgoing.length;
        console.log(`  ${node.note.relativePath} (${total} connections: ${node.incoming.length} in, ${node.outgoing.length} out)`);
      }

      const lonelyNotes = report.graph.filter((n) => n.incoming.length === 0 && n.outgoing.length === 0).slice(0, 5);
      if (lonelyNotes.length > 0) {
        console.log('\n🔴 Orphan Notes:');
        for (const node of lonelyNotes) {
          console.log(`  ${node.note.relativePath}`);
        }
      }

      console.log();
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();