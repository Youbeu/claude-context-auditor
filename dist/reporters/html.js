import { CostCalculator } from '../engine/cost.js';
export class HtmlReporter {
    /**
     * Generate a standalone, interactive HTML dashboard report
     */
    static render(audit) {
        const sum = audit.sessionSummary;
        const now = new Date(audit.timestamp).toLocaleString();
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Context & Cost Audit Report</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-dim: #9ca3af;
      --accent: #3b82f6;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      padding: 32px 24px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header { margin-bottom: 32px; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 26px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .badge { background: #1e3a8a; color: #bfdbfe; font-size: 12px; padding: 3px 8px; border-radius: 9999px; }
    .meta { color: var(--text-dim); font-size: 13px; margin-top: 6px; }

    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: var(--accent);
    }
    .stat-card.danger::before { background: var(--danger); }
    .stat-card.warning::before { background: var(--warning); }
    .stat-card.success::before { background: var(--success); }
    .stat-title { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 800; color: #fff; }
    .stat-sub { font-size: 12px; color: var(--text-dim); margin-top: 4px; }

    .progress-section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .progress-bar-bg {
      background: #1f2937;
      height: 14px;
      border-radius: 7px;
      overflow: hidden;
      margin: 12px 0 8px 0;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      background: ${sum.overheadPercentage > 30 ? 'var(--danger)' : sum.overheadPercentage > 15 ? 'var(--warning)' : 'var(--success)'};
      width: ${Math.min(100, sum.overheadPercentage)}%;
      transition: width 1s ease-in-out;
    }

    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #fff; display: flex; align-items: center; gap: 8px; }
    
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { background: #1a2234; padding: 14px 18px; color: #cbd5e1; font-weight: 600; border-bottom: 1px solid var(--card-border); }
    td { padding: 14px 18px; border-bottom: 1px solid var(--card-border); color: #e2e8f0; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .tag-mcp { background: #1e3a8a; color: #93c5fd; }
    .tag-skill { background: #581c87; color: #d8b4fe; }
    .tag-dup { background: #7f1d1d; color: #fca5a5; }
    .tag-rule { background: #064e3b; color: #6ee7b7; }

    .anomalies-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .anomaly-card {
      background: var(--card-bg);
      border-left: 4px solid var(--danger);
      border-top: 1px solid var(--card-border);
      border-right: 1px solid var(--card-border);
      border-bottom: 1px solid var(--card-border);
      border-radius: 0 10px 10px 0;
      padding: 16px 20px;
    }
    .anomaly-card.warning { border-left-color: var(--warning); }
    .anomaly-card.info { border-left-color: var(--accent); }
    .anomaly-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .anomaly-title { font-weight: 700; color: #fff; font-size: 15px; }
    .anomaly-desc { font-size: 13px; color: var(--text-dim); margin-bottom: 8px; }
    .anomaly-fix { font-size: 13px; color: var(--success); font-weight: 600; }

    footer { text-align: center; color: var(--text-dim); font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🔍 Claude Context & Cost Audit <span class="badge">v0.1.0</span></h1>
        <div class="meta">Audit performed on <strong>${now}</strong> • Target: <code>${audit.configPath}</code></div>
      </div>
      <div>
        <span class="badge" style="background:#374151;color:#fff;">Model: ${sum.targetModel}</span>
      </div>
    </header>

    <div class="grid-stats">
      <div class="stat-card ${sum.overheadPercentage > 25 ? 'danger' : 'warning'}">
        <div class="stat-title">Baseline Context Overhead</div>
        <div class="stat-value">${sum.totalContextBeforeConversation.toLocaleString()} <span style="font-size:16px;font-weight:400;color:var(--text-dim)">tokens</span></div>
        <div class="stat-sub">${sum.overheadPercentage}% of 200,000 token window</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-title">Estimated Monthly Waste</div>
        <div class="stat-value">${CostCalculator.formatCurrency(sum.monthlyWasteAtEstimatedUsage)}</div>
        <div class="stat-sub">Based on ${sum.sessionsPerDay} daily sessions @ $3/M tokens</div>
      </div>
      <div class="stat-card success">
        <div class="stat-title">Potential Monthly Savings</div>
        <div class="stat-value">${CostCalculator.formatCurrency(audit.potentialMonthlySavings)}</div>
        <div class="stat-sub">${audit.optimizableTokens.toLocaleString()} recoverable tokens / session</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Detected Components</div>
        <div class="stat-value">${audit.mcpServers.length + audit.injectedSkills.length + audit.hooks.length + audit.rules.length}</div>
        <div class="stat-sub">${audit.mcpServers.length} MCPs, ${audit.injectedSkills.length} Skills, ${audit.anomalies.length} Alerts</div>
      </div>
    </div>

    <div class="progress-section">
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;">
        <span>Context Saturation Before Prompting</span>
        <span>${sum.overheadPercentage}%</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);">
        <span>0 tokens</span>
        <span>${sum.totalContextBeforeConversation.toLocaleString()} tokens injected</span>
        <span>200k max</span>
      </div>
    </div>

    ${audit.anomalies.length > 0 ? `
    <div class="section-title">🚨 Detected Anomalies & Waste Points (${audit.anomalies.length})</div>
    <div class="anomalies-list">
      ${audit.anomalies.map(a => `
        <div class="anomaly-card ${a.severity.toLowerCase()}">
          <div class="anomaly-header">
            <div class="anomaly-title">${a.title}</div>
            <div style="font-size:13px;font-weight:700;color:var(--danger)">-${a.wastedTokens.toLocaleString()} tokens (${CostCalculator.formatCurrency(a.wastedMonthlyCost)}/mo)</div>
          </div>
          <div class="anomaly-desc">${a.description}</div>
          <div class="anomaly-fix">💡 Fix: ${a.fixAction}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="section-title">📦 Detailed Component Breakdown</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name / Source</th>
            <th>Token Cost</th>
            <th>Context %</th>
            <th>Monthly Cost</th>
            <th>Status / Verdict</th>
          </tr>
        </thead>
        <tbody>
          ${audit.mcpServers.map(s => `
            <tr>
              <td><span class="tag tag-mcp">MCP</span></td>
              <td><strong>${s.name}</strong> ${s.disabled ? '<small style="color:var(--text-dim)">(Disabled)</small>' : `(${s.toolCount} tools)`}</td>
              <td>${s.tokenCost.toLocaleString()} tk</td>
              <td>${((s.tokenCost / sum.contextWindowMax) * 100).toFixed(1)}%</td>
              <td>${CostCalculator.formatCurrency(CostCalculator.calculateMonthlyCost(s.tokenCost, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel))}</td>
              <td>${s.verdict}</td>
            </tr>
          `).join('')}
          ${audit.injectedSkills.map(s => `
            <tr>
              <td><span class="tag ${s.isDuplicate ? 'tag-dup' : 'tag-skill'}">${s.isDuplicate ? 'DUPLICATE' : 'SKILL'}</span></td>
              <td><strong>${s.name}</strong> <small style="color:var(--text-dim)">(${s.source})</small></td>
              <td>${s.tokens.toLocaleString()} tk</td>
              <td>${((s.tokens / sum.contextWindowMax) * 100).toFixed(1)}%</td>
              <td>${CostCalculator.formatCurrency(CostCalculator.calculateMonthlyCost(s.tokens, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel))}</td>
              <td>${s.verdict}</td>
            </tr>
          `).join('')}
          ${audit.rules.map(r => `
            <tr>
              <td><span class="tag tag-rule">RULES</span></td>
              <td><strong>${r.name}</strong> <small style="color:var(--text-dim)">(${r.lineCount} lines)</small></td>
              <td>${r.tokens.toLocaleString()} tk</td>
              <td>${((r.tokens / sum.contextWindowMax) * 100).toFixed(1)}%</td>
              <td>${CostCalculator.formatCurrency(CostCalculator.calculateMonthlyCost(r.tokens, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel))}</td>
              <td>${r.verdict}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <footer>
      Generated with <strong>claude-context-auditor</strong> • Stop context bloat, save your tokens.
    </footer>
  </div>
</body>
</html>`;
    }
}
//# sourceMappingURL=html.js.map