import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import ora from 'ora';
import { DeadLinksEngine } from './utils/engine.js';
import { ConfigLoader } from './utils/config-loader.js';
import { TerminalReporter } from './reporters/terminal-reporter.js';
import { JsonReporter } from './reporters/json-reporter.js';
import { generateMarkdownReport } from './utils/markdown-report.js';
import type { BrokenLink, Note } from './types/index.js';

const program = new Command();

program
  .name('dead-links')
  .description('Scan Obsidian vaults for broken links, orphan notes, and connection graphs')
  .version('0.1.0');

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
  .option('--format <type>', 'Output format: text, json, markdown', 'text')
  .option('--output <file>', 'Output file path')
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--attachments', 'Also check embedded attachments (images, PDFs, etc.)')
  .option('--ignore-folders <folders...>', 'Exclude folders from orphan report')
  .option('--quiet', 'Only show issues, no stats or summary')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    const spinner = ora('Scanning vault...').start();

    try {
      const report = await loadConfigAndAnalyze(options.vault, options);
      spinner.succeed(`Scanned ${report.stats.totalNotes} notes in ${report.duration}ms`);

      if (options.format === 'json') {
        const reporter = new JsonReporter();
        const output = reporter.report(report);
        if (options.output) {
          await writeFile(options.output, output);
          console.log(`JSON report written to ${options.output}`);
        } else {
          console.log(output);
        }
      } else if (options.format === 'markdown') {
        const output = generateMarkdownReport(report);
        if (options.output) {
          await writeFile(options.output, output);
          console.log(`Markdown report written to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        const reporter = new TerminalReporter(options.ignoreFolders || [], options.quiet || false);
        console.log(reporter.report(report));
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

program.parse();