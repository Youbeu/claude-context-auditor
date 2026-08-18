import {
  AuditResult,
  AnomalyReport,
  ClaudeModel,
  SessionSummary,
} from '../types/index.js';
import { ParsedConfigBundle } from '../config/parser.js';
import { CostCalculator, PRICING_TABLE } from './cost.js';

export interface DetectorOptions {
  model?: ClaudeModel;
  sessionsPerDay?: number;
  workingDaysPerMonth?: number;
}

export class AnomalyDetector {
  /**
   * Run deep audit on parsed configurations and produce structured report
   */
  static analyze(bundle: ParsedConfigBundle, options: DetectorOptions = {}): AuditResult {
    const model: ClaudeModel = options.model || 'claude-3-7-sonnet';
    const sessionsPerDay = options.sessionsPerDay ?? 20;
    const workingDays = options.workingDaysPerMonth ?? 22;
    const pricing = PRICING_TABLE[model];

    const anomalies: AnomalyReport[] = [];
    let optimizableTokens = 0;

    // 1. Calculate Baseline Context Overhead
    const mcpTokens = bundle.mcpServers.reduce((sum, s) => sum + s.tokenCost, 0);
    const skillTokens = bundle.injectedSkills.reduce((sum, s) => sum + s.tokens, 0);
    const hookTokens = bundle.hooks.reduce((sum, h) => sum + h.tokensOverhead, 0);
    const ruleTokens = bundle.rules.reduce((sum, r) => sum + r.tokens, 0);

    const totalContextBeforeConversation = mcpTokens + skillTokens + hookTokens + ruleTokens;
    const overheadPercentage = Number(((totalContextBeforeConversation / pricing.contextWindowMax) * 100).toFixed(2));
    const tokenCostPerSession = CostCalculator.calculateSessionCost(totalContextBeforeConversation, model);
    const monthlyWasteAtEstimatedUsage = CostCalculator.calculateMonthlyCost(
      totalContextBeforeConversation,
      sessionsPerDay,
      workingDays,
      model
    );

    // 2. DETECTOR: Skill Duplications (Bug #29971)
    const duplicateSkills = bundle.injectedSkills.filter(s => s.isDuplicate);
    for (const dup of duplicateSkills) {
      const dupCost = CostCalculator.calculateMonthlyCost(dup.tokens, sessionsPerDay, workingDays, model);
      optimizableTokens += dup.tokens;

      anomalies.push({
        id: `dup-${dup.name}`,
        title: `Skill Duplication Detected: ${dup.name}`,
        severity: 'CRITICAL',
        category: 'DUPLICATION',
        description: `Skill "${dup.name}" is loaded in ${dup.source} but already exists in ${dup.duplicateOf}. Consumes ${dup.tokens} unnecessary tokens every single session.`,
        wastedTokens: dup.tokens,
        wastedMonthlyCost: dupCost,
        fixAction: `Remove redundant copy at ${dup.filePath || dup.source}`,
        autoFixable: true,
      });
    }

    // 3. DETECTOR: MCP Server Bloat
    for (const server of bundle.mcpServers) {
      if (server.disabled) continue;

      if (server.tokenCost > 20000) {
        const waste = Math.round(server.tokenCost * 0.7); // 70% uncalled tools
        const monthly = CostCalculator.calculateMonthlyCost(waste, sessionsPerDay, workingDays, model);
        optimizableTokens += waste;

        anomalies.push({
          id: `mcp-heavy-${server.name}`,
          title: `Heavy MCP Schema Overhead: ${server.name} (${server.toolCount} tools)`,
          severity: 'CRITICAL',
          category: 'MCP_BLOAT',
          description: `MCP Server "${server.name}" injects ~${server.tokenCost.toLocaleString()} tokens of JSON schemas into every prompt. Most sessions only use 1-2 tools.`,
          wastedTokens: waste,
          wastedMonthlyCost: monthly,
          fixAction: `Disable or prune unused tools from ${server.name}, or use on-demand scoping`,
          autoFixable: true,
        });
      } else if (server.tokenCost > 10000) {
        const waste = Math.round(server.tokenCost * 0.5);
        const monthly = CostCalculator.calculateMonthlyCost(waste, sessionsPerDay, workingDays, model);
        optimizableTokens += waste;

        anomalies.push({
          id: `mcp-warning-${server.name}`,
          title: `High MCP Token Weight: ${server.name}`,
          severity: 'WARNING',
          category: 'MCP_BLOAT',
          description: `Server "${server.name}" consumes ${server.tokenCost.toLocaleString()} tokens per interaction (${server.toolCount} tool definitions).`,
          wastedTokens: waste,
          wastedMonthlyCost: monthly,
          fixAction: `Scope ${server.name} to projects where it is strictly required`,
          autoFixable: false,
        });
      }
    }

    // 4. DETECTOR: Silent Injections from claude.ai
    const remoteInjected = bundle.injectedSkills.filter(s => s.source === 'claude.ai (remote/injected)');
    if (remoteInjected.length > 0) {
      const remoteTokens = remoteInjected.reduce((acc, s) => acc + s.tokens, 0);
      const monthly = CostCalculator.calculateMonthlyCost(remoteTokens, sessionsPerDay, workingDays, model);
      optimizableTokens += remoteTokens;

      anomalies.push({
        id: 'remote-silent-injection',
        title: `Silent Cloud Skills Injected (${remoteInjected.length} skills)`,
        severity: 'WARNING',
        category: 'SILENT_INJECTION',
        description: `Found ${remoteInjected.length} skills automatically injected from claude.ai account settings without local opt-in (${remoteTokens} tokens).`,
        wastedTokens: remoteTokens,
        wastedMonthlyCost: monthly,
        fixAction: 'Add `--skip-remote-skills` or prune account-level integrations',
        autoFixable: false,
      });
    }

    // 5. DETECTOR: CLAUDE.md / Static Doc Poisoning
    for (const rule of bundle.rules) {
      if (rule.isBloated) {
        const excess = Math.max(0, rule.tokens - 1500);
        const monthly = CostCalculator.calculateMonthlyCost(excess, sessionsPerDay, workingDays, model);
        optimizableTokens += excess;

        anomalies.push({
          id: `rule-bloat-${rule.name}`,
          title: `Static Rules File Bloat: ${rule.name}`,
          severity: 'WARNING',
          category: 'STATIC_DOC_POISONING',
          description: `File "${rule.name}" contains ${rule.tokens.toLocaleString()} tokens (${rule.lineCount} lines). Large static rules cause context rot and degrade reasoning.`,
          wastedTokens: excess,
          wastedMonthlyCost: monthly,
          fixAction: 'Split static references into separate docs loaded via search on-demand',
          autoFixable: false,
        });
      }
    }

    // 6. DETECTOR: Stale Hooks
    for (const hook of bundle.hooks) {
      if (hook.isStale) {
        const monthly = CostCalculator.calculateMonthlyCost(hook.tokensOverhead, sessionsPerDay, workingDays, model);
        optimizableTokens += hook.tokensOverhead;

        anomalies.push({
          id: `hook-stale-${hook.name}`,
          title: `Stale Hook Detected: ${hook.name}`,
          severity: 'INFO',
          category: 'STALE_HOOK',
          description: `Hook script "${hook.name}" has not been modified since ${hook.lastModified}. Runs on every trigger adding overhead.`,
          wastedTokens: hook.tokensOverhead,
          wastedMonthlyCost: monthly,
          fixAction: `Review or remove ~/.claude/hooks/${hook.name}`,
          autoFixable: true,
        });
      }
    }

    // 7. Compute Top Offenders
    const allItems: { name: string; type: 'MCP' | 'SKILL' | 'HOOK' | 'RULES'; tokens: number }[] = [];
    bundle.mcpServers.forEach(s => !s.disabled && allItems.push({ name: `MCP: ${s.name}`, type: 'MCP', tokens: s.tokenCost }));
    bundle.injectedSkills.forEach(s => allItems.push({ name: `Skill: ${s.name}`, type: 'SKILL', tokens: s.tokens }));
    bundle.hooks.forEach(h => allItems.push({ name: `Hook: ${h.name}`, type: 'HOOK', tokens: h.tokensOverhead }));
    bundle.rules.forEach(r => allItems.push({ name: `Rule: ${r.name}`, type: 'RULES', tokens: r.tokens }));

    allItems.sort((a, b) => b.tokens - a.tokens);
    const topOffenders = allItems.slice(0, 5).map(item => ({
      name: item.name,
      type: item.type,
      tokens: item.tokens,
      percentage: totalContextBeforeConversation > 0 ? Number(((item.tokens / totalContextBeforeConversation) * 100).toFixed(1)) : 0,
      costPerMonth: CostCalculator.calculateMonthlyCost(item.tokens, sessionsPerDay, workingDays, model),
    }));

    const potentialMonthlySavings = CostCalculator.calculateMonthlyCost(
      optimizableTokens,
      sessionsPerDay,
      workingDays,
      model
    );

    const sessionSummary: SessionSummary = {
      totalContextBeforeConversation,
      contextWindowMax: pricing.contextWindowMax,
      overheadPercentage,
      tokenCostPerSession,
      monthlyWasteAtEstimatedUsage,
      targetModel: model,
      sessionsPerDay,
      workingDaysPerMonth: workingDays,
    };

    return {
      timestamp: new Date().toISOString(),
      configPath: bundle.primaryPath,
      sessionSummary,
      mcpServers: bundle.mcpServers,
      injectedSkills: bundle.injectedSkills,
      hooks: bundle.hooks,
      rules: bundle.rules,
      anomalies,
      topOffenders,
      optimizableTokens,
      potentialMonthlySavings,
    };
  }
}
