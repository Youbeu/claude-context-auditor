#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ConfigFinder,
  ConfigParser,
  AnomalyDetector,
  ConfigFixer,
  TerminalReporter,
  JsonReporter,
  HtmlReporter,
} from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: undefined,
    fix: false,
    dryRun: false,
    json: false,
    exportHtml: undefined,
    model: 'claude-3-7-sonnet',
    sessions: 20,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' || arg === '-c') {
      options.config = args[++i];
    } else if (arg === '--fix') {
      options.fix = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
      options.fix = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--export' || arg === '-e') {
      options.exportHtml = args[++i] || 'claude-context-audit.html';
    } else if (arg === '--model' || arg === '-m') {
      options.model = args[++i] || 'claude-3-7-sonnet';
    } else if (arg === '--sessions' || arg === '-s') {
      options.sessions = parseInt(args[++i], 10) || 20;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔍 CLAUDE CONTEXT AUDITOR & COST PROFILER v0.1.0
Stop wasting $200/mo on idle MCP servers and context bloat in Claude Code.

USAGE:
  npx claude-context-auditor [OPTIONS]
  claude-doctor [OPTIONS]

OPTIONS:
  -c, --config <path>     Path to custom config file (e.g. ~/.claude.json)
  --fix                   Safely auto-remediate duplicates and bloat with backup
  --dry-run               Simulate --fix without writing changes to disk
  --json                  Output raw JSON for CI/CD and automation
  -e, --export <file>     Export interactive HTML report (e.g. report.html)
  -m, --model <name>      Target model (claude-3-7-sonnet, claude-3-opus, etc.)
  -s, --sessions <num>    Average sessions/day for cost estimation (default: 20)
  -h, --help              Show this help menu
  -v, --version           Show version information

EXAMPLES:
  $ npx claude-context-auditor
  $ npx claude-context-auditor --fix
  $ npx claude-context-auditor --export audit.html
  $ npx claude-context-auditor --json | jq .summary
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log('claude-context-auditor v0.1.0');
    process.exit(0);
  }

  try {
    // 1. Discover paths and parse
    const paths = ConfigFinder.discover(options.config);
    const bundle = ConfigParser.parseAll(paths);

    // 2. Run Anomaly & Cost Detector
    const audit = AnomalyDetector.analyze(bundle, {
      model: options.model,
      sessionsPerDay: options.sessions,
    });

    // 3. Handle --fix if requested
    if (options.fix) {
      const fixResult = ConfigFixer.applyFix(audit, {
        dryRun: options.dryRun,
        deduplicateSkills: true,
        disableBloatedMcp: false,
      });

      if (options.json) {
        console.log(JSON.stringify({ audit, fixResult }, null, 2));
      } else {
        console.log(TerminalReporter.render(audit));
        console.log(`\n========================================================================`);
        console.log(`🛠️  REMEDIATION REPORT:`);
        console.log(`   • Status          : ${fixResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   • Backup created  : ${fixResult.backupPath}`);
        console.log(`   • Recovered tokens: ${fixResult.tokensSaved.toLocaleString()} tk / session`);
        console.log(`   • Monthly savings : ~$${fixResult.monthlySavings.toFixed(2)} / month`);
        console.log(`   • Actions applied :`);
        for (const act of fixResult.changesApplied) {
          console.log(`     - ${act}`);
        }
        console.log(`========================================================================\n`);
      }
      process.exit(0);
    }

    // 4. Output according to format flags
    if (options.json) {
      console.log(JsonReporter.render(audit));
    } else {
      console.log(TerminalReporter.render(audit));
    }

    // 5. HTML Export if requested
    if (options.exportHtml) {
      const htmlContent = HtmlReporter.render(audit);
      const targetPath = path.resolve(options.exportHtml);
      fs.writeFileSync(targetPath, htmlContent, 'utf-8');
      if (!options.json) {
        console.log(`📊 Interactive HTML report exported to: ${targetPath}\n`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Error during audit:`, error.message);
    process.exit(1);
  }
}

main();
