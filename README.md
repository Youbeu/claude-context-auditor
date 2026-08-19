<div align="center">

# 🔍 Claude Context Auditor & Cost Profiler

**The bundle analyzer for Claude Code, Claude Desktop, and Model Context Protocol (MCP).**  
*Stop wasting 60,000+ tokens ($200/month) on idle MCP schemas and silent skill bloat.*

[![npm version](https://img.shields.io/npm/v/claude-context-auditor.svg?style=flat-square&color=3b82f6)](https://www.npmjs.com/package/claude-context-auditor)
[![GitHub Stars](https://img.shields.io/github/stars/Youbeu/claude-context-auditor.svg?style=flat-square)](https://github.com/Youbeu/claude-context-auditor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/Youbeu/claude-context-auditor/pulls)

</div>

---

## ⚡ The Dirty Secret of AI Agents

When you install **5 MCP servers** (e.g. GitHub, Jira, Postgres, Slack, Puppeteer), Claude loads **their entire JSON schemas upfront into every single prompt**.

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      YOUR CONTEXT WINDOW AT START                      │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 🔌 MCP Tool Schemas (Jira, GitHub, Postgres)    : 67,300 tokens (33.7%)│
 │ 🛠️  Duplicated Skills (Bug #29971)               :  6,100 tokens ( 3.0%)│
 │ 📜 Static CLAUDE.md Rules                       :  8,400 tokens ( 4.2%)│
 │ 💬 Your First Prompt ("fix this bug")           :     25 tokens ( 0.1%)│
 └────────────────────────────────────────────────────────────────────────┘
```

> **The Result:** You burn **~80,000 tokens before you even type a message**.  
> At $3.00 / M tokens across 25 sessions/day, that is **$150 to $250/month in pure overhead waste**, while inducing severe **Context Rot** and hallucinations.

---

## 🚀 Quickstart (Zero Installation)

Run instantly via `npx`:

```bash
# 1. Run instant diagnostic on your local Claude environment
npx claude-context-auditor

# 2. Export a beautiful, interactive HTML visual report
npx claude-context-auditor --export report.html

# 3. Automatically fix duplicates & bloat with safe atomic backup
npx claude-context-auditor --fix
```

---

## 📊 Terminal Output Preview

```
========================================================================
 🔍 CLAUDE CONTEXT AUDITOR & COST PROFILER v0.1.0
========================================================================
Target Config : ~/.claude.json
Target Model  : claude-3-7-sonnet ($3.00/M input tokens)

📊 CONTEXT WINDOW OVERHEAD AT COLD START:
   [█████████████████░░░░░░░░░░░░░░░░░░░░░░░] 43.12% (86,242 / 200,000 tokens)

💰 FINANCIAL IMPACT & ESTIMATED MONTHLY BURN:
   • Waste per session     : $0.26 / prompt baseline
   • Monthly Idle Burn     : $113.84 (based on 20 sessions/day, 22 days/mo)
   • Potential Savings     : $60.14 / month (45,562 tokens/session)

📦 BREAKDOWN BY COMPONENT SOURCE:
┌──────────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Source Component             │ Tokens       │ % Context    │ Est. $/mo    │
├──────────────────────────────┼──────────────┼──────────────┼──────────────┤
│ 🔌 MCP github               │    32,500 tk │       16.3 % │     $42.90   │
│ 🔌 MCP jira                 │    24,100 tk │       12.0 % │     $31.81   │
│ 🔌 MCP slack                │    11,800 tk │        5.9 % │     $15.58   │
│ 🔌 MCP postgres             │     9,400 tk │        4.7 % │     $12.41   │
│ 🛠️  SKILL git-commit-helper   │     1,200 tk │        0.6 % │      $1.58 ⚠️│
└──────────────────────────────┴──────────────┴──────────────┴──────────────┘

🚨 DETECTED ANOMALIES & BLEEDING POINTS (3):
   CRITICAL  Heavy MCP Schema Overhead: github (48 tools)
    Impact : -22,750 tokens ($30.03/mo)
    Details: MCP Server "github" injects ~32,500 tokens of JSON schemas. Most sessions use 1-2 tools.
    Fix    : Disable or prune unused tools from github, or use on-demand scoping

   CRITICAL  Issue #29971 Duplicate: git-commit-helper
    Impact : -1,200 tokens ($1.58/mo)
    Details: Loaded in ~/.claude/skills and duplicated in .claude/skills.
    Fix    : Remove redundant copy

💡 RECOMMENDED ACTION:
   Run npx claude-context-auditor --fix to automatically resolve duplicates & purge bloat.
```

---

## ✨ Features

- 🔍 **Universal Config Scanner**: Automatically discovers `~/.claude.json`, `.claude/skills/`, `claude_desktop_config.json`, `~/.cursor/mcp.json`, and `CLAUDE.md`.
- 🧮 **Accurate BPE Token Estimation**: Tailored to Anthropic's tool framing schemas and function calling signatures.
- 💵 **Real Financial Modeling**: Precise calculations for Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3.5 Haiku.
- 🚨 **Anthropic Issue #29971 Fix**: Detects and purges duplicate skills across global and workspace directories.
- 🛡️ **Safe Auto-Fix with Atomic Backups**: Every `--fix` creates a timestamped `.bak` with automatic rollback on error.
- 📈 **Interactive HTML Dashboard**: Generate self-contained, offline visual reports for teams and management.
- 🤖 **Claude Code Skill Included**: Seamlessly use `/audit-context` inside Claude Code.

---

## 🛠️ CLI Options

| Flag | Short | Description |
| :--- | :---: | :--- |
| `--config <path>` | `-c` | Custom config file path |
| `--fix` | | Safely auto-remediate duplicates and bloat with backup |
| `--dry-run` | | Simulate `--fix` without writing changes to disk |
| `--json` | | Output structured JSON for CI/CD pipelines |
| `--export <file>`| `-e` | Export interactive HTML dashboard (e.g. `audit.html`) |
| `--model <name>` | `-m` | Target model (`claude-3-7-sonnet`, `claude-3-opus`, etc.) |
| `--sessions <n>` | `-s` | Average sessions per day (default: `20`) |
| `--help` | `-h` | Display help screen |
| `--version` | `-v` | Show version number |

---

## 💻 Programmatic API

```typescript
import { auditContext, ConfigFixer } from 'claude-context-auditor';

// Run full audit
const audit = auditContext();

console.log(`Context Overhead: ${audit.sessionSummary.overheadPercentage}%`);
console.log(`Monthly Waste: $${audit.sessionSummary.monthlyWasteAtEstimatedUsage}`);

// Apply automated remediation
const fixResult = ConfigFixer.applyFix(audit, {
  deduplicateSkills: true,
  disableBloatedMcp: false,
});
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/Youbeu/claude-context-auditor/issues).

## 📄 License

MIT © [Youbeu](https://github.com/Youbeu)
