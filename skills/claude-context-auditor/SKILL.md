---
name: claude-context-auditor
description: Meta-tooling to audit and eliminate context window bloat, idle MCP token overhead, and skill duplicates in Claude Code & Claude Desktop.
triggers:
  - audit-context
  - context-cost
  - token-waste
  - mcp-bloat
  - prune-mcp
---

# Claude Context Auditor & Cost Profiler

## Purpose
Audit baseline context consumption before conversation turns, detect silent cloud skill injections, pinpoint bloated MCP schemas, and calculate the exact financial cost in USD ($).

## Quick Execution
To run an instant audit on the local environment:

```bash
# Run standalone audit
npx claude-context-auditor

# Run audit and export interactive HTML visual report
npx claude-context-auditor --export audit.html

# Safely deduplicate skills and prune bloat (with auto-backup)
npx claude-context-auditor --fix
```

## How It Works
1. **Config Discovery**: Automatically discovers `~/.claude.json`, `.claude/skills`, `claude_desktop_config.json`, `~/.cursor/mcp.json`, and `CLAUDE.md`.
2. **Deterministic Token Calculation**: Uses accurate BPE estimation for tool schemas, function descriptions, and skill headers.
3. **Economics Engine**: Calculates real dollar burn against Claude 3.7 Sonnet ($3.00/M tokens), Opus ($15/M), and Haiku ($0.80/M).
4. **Zero-Risk Remediation**: When running `--fix`, creates timestamped atomic backups before modifying configurations.
