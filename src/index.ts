import { Command, Option } from 'commander';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import ora from 'ora';
import { DeadLinksEngine } from './utils/engine.js';
import { ConfigLoader } from './utils/config-loader.js';
import { TerminalReporter } from './reporters/terminal-reporter.js';
import { JsonReporter } from './reporters/json-reporter.js';
import { CsvReporter } from './reporters/csv-reporter.js';
import { HtmlReporter } from './reporters/html-reporter.js';
import { generateMarkdownReport } from './utils/markdown-report.js';

const packageMetadata = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

const program = new Command();

program
  .name('dead-links')
  .description('Scan Obsidian vaults for broken links, orphan notes, and connection graphs')
  .version(packageMetadata.version);

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

program
  .command('scan')
  .description('Scan the vault for all issues')
  .option('--vault <path>', 'Path to the Obsidian vault', process.cwd())
  .addOption(
    new Option('--format <type>', 'Output format: text, json, markdown, csv, html')
      .choices(['text', 'json', 'markdown', 'csv', 'html'])
      .default('text'),
  )
  .option('--output <file>', 'Output file path')
  .option('--ignore <patterns...>', 'Ignore patterns (glob)')
  .option('--attachments', 'Also check embedded attachments (images, PDFs, etc.)')
  .option('--ignore-folders <folders...>', 'Exclude folders from orphan report')
  .option('--quiet', 'Only show issues, no stats or summary')
  .option('--no-color', 'Disable colored output')
  .option('--debug', 'Enable debug mode with verbose output')
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
      } else {
        const reporter = new TerminalReporter(
          options.ignoreFolders || [],
          options.quiet || false,
          options.color === false,
        );
        output = reporter.report(report);
      }

      if (options.output) {
        await writeFile(options.output, output);
        console.log(`Report written to ${options.output}`);
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
