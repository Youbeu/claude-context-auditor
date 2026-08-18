import { CostCalculator } from '../engine/cost.js';
// ANSI escape codes for clean terminal output
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const BG_RED = '\x1b[41m';
const BG_YELLOW = '\x1b[43m';
const BG_BLUE = '\x1b[44m';
export class TerminalReporter {
    /**
     * Render visually striking, high-impact terminal audit report
     */
    static render(audit) {
        const lines = [];
        const sum = audit.sessionSummary;
        // 1. Header Banner
        lines.push('');
        lines.push(`${BOLD}${CYAN}========================================================================${RESET}`);
        lines.push(`${BOLD}${WHITE} 🔍 CLAUDE CONTEXT AUDITOR & COST PROFILER ${RESET}${DIM}v0.1.0${RESET}`);
        lines.push(`${BOLD}${CYAN}========================================================================${RESET}`);
        lines.push(`${DIM}Target Config : ${audit.configPath}${RESET}`);
        lines.push(`${DIM}Target Model  : ${sum.targetModel} ($3.00/M input tokens)${RESET}`);
        lines.push('');
        // 2. Visual Context Gauge
        const gaugeWidth = 40;
        const filledLength = Math.min(gaugeWidth, Math.round((sum.overheadPercentage / 100) * gaugeWidth));
        const emptyLength = gaugeWidth - filledLength;
        let barColor = GREEN;
        if (sum.overheadPercentage > 30)
            barColor = RED;
        else if (sum.overheadPercentage > 15)
            barColor = YELLOW;
        const progressBar = `${barColor}${'█'.repeat(filledLength)}${DIM}${'░'.repeat(emptyLength)}${RESET}`;
        lines.push(`${BOLD}📊 CONTEXT WINDOW OVERHEAD AT COLD START:${RESET}`);
        lines.push(`   [${progressBar}] ${BOLD}${barColor}${sum.overheadPercentage}%${RESET} (${sum.totalContextBeforeConversation.toLocaleString()} / ${sum.contextWindowMax.toLocaleString()} tokens)`);
        lines.push('');
        // 3. Financial Impact Box
        lines.push(`${BOLD}${YELLOW}💰 FINANCIAL IMPACT & ESTIMATED MONTHLY BURN:${RESET}`);
        lines.push(`   • Waste per session     : ${BOLD}${RED}${CostCalculator.formatCurrency(sum.tokenCostPerSession)}${RESET} / prompt baseline`);
        lines.push(`   • Monthly Idle Burn     : ${BOLD}${RED}${CostCalculator.formatCurrency(sum.monthlyWasteAtEstimatedUsage)}${RESET} ${DIM}(based on ${sum.sessionsPerDay} sessions/day, ${sum.workingDaysPerMonth} days/mo)${RESET}`);
        lines.push(`   • Potential Savings     : ${BOLD}${GREEN}${CostCalculator.formatCurrency(audit.potentialMonthlySavings)} / month${RESET} ${DIM}(${audit.optimizableTokens.toLocaleString()} tokens/session)${RESET}`);
        lines.push('');
        // 4. Source Breakdown Table
        lines.push(`${BOLD}📦 BREAKDOWN BY COMPONENT SOURCE:${RESET}`);
        lines.push(`┌──────────────────────────────┬──────────────┬──────────────┬──────────────┐`);
        lines.push(`│ ${BOLD}Source Component${RESET}             │ ${BOLD}Tokens${RESET}       │ ${BOLD}% Context${RESET}    │ ${BOLD}Est. $/mo${RESET}    │`);
        lines.push(`├──────────────────────────────┼──────────────┼──────────────┼──────────────┤`);
        for (const server of audit.mcpServers) {
            const pct = ((server.tokenCost / sum.contextWindowMax) * 100).toFixed(1);
            const cost = CostCalculator.calculateMonthlyCost(server.tokenCost, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel);
            const name = server.name.length > 26 ? server.name.substring(0, 23) + '...' : server.name;
            const statusIcon = server.disabled ? `${DIM}[OFF]${RESET}` : `${CYAN}🔌 MCP${RESET}`;
            lines.push(`│ ${statusIcon} ${name.padEnd(20)} │ ${server.tokenCost.toLocaleString().padStart(10)} tk │ ${pct.padStart(10)} % │ ${CostCalculator.formatCurrency(cost).padStart(10)} │`);
        }
        for (const skill of audit.injectedSkills) {
            const pct = ((skill.tokens / sum.contextWindowMax) * 100).toFixed(1);
            const cost = CostCalculator.calculateMonthlyCost(skill.tokens, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel);
            const name = skill.name.length > 25 ? skill.name.substring(0, 22) + '...' : skill.name;
            const icon = skill.isDuplicate ? `${RED}⚠️ DUP${RESET}` : `${MAGENTA}🛠️ SKILL${RESET}`;
            lines.push(`│ ${icon} ${name.padEnd(19)} │ ${skill.tokens.toLocaleString().padStart(10)} tk │ ${pct.padStart(10)} % │ ${CostCalculator.formatCurrency(cost).padStart(10)} │`);
        }
        for (const rule of audit.rules) {
            const pct = ((rule.tokens / sum.contextWindowMax) * 100).toFixed(1);
            const cost = CostCalculator.calculateMonthlyCost(rule.tokens, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel);
            const name = rule.name.length > 26 ? rule.name.substring(0, 23) + '...' : rule.name;
            lines.push(`│ ${BLUE}📜 RULE${RESET} ${name.padEnd(20)} │ ${rule.tokens.toLocaleString().padStart(10)} tk │ ${pct.padStart(10)} % │ ${CostCalculator.formatCurrency(cost).padStart(10)} │`);
        }
        for (const hook of audit.hooks) {
            const pct = ((hook.tokensOverhead / sum.contextWindowMax) * 100).toFixed(1);
            const cost = CostCalculator.calculateMonthlyCost(hook.tokensOverhead, sum.sessionsPerDay, sum.workingDaysPerMonth, sum.targetModel);
            const name = hook.name.length > 26 ? hook.name.substring(0, 23) + '...' : hook.name;
            lines.push(`│ ${DIM}⚙️ HOOK${RESET} ${name.padEnd(20)} │ ${hook.tokensOverhead.toLocaleString().padStart(10)} tk │ ${pct.padStart(10)} % │ ${CostCalculator.formatCurrency(cost).padStart(10)} │`);
        }
        lines.push(`└──────────────────────────────┴──────────────┴──────────────┴──────────────┘`);
        lines.push('');
        // 5. Anomalies & Actionable Warnings
        if (audit.anomalies.length > 0) {
            lines.push(`${BOLD}🚨 DETECTED ANOMALIES & BLEEDING POINTS (${audit.anomalies.length}):${RESET}`);
            for (const a of audit.anomalies) {
                let badge = `${BG_YELLOW}${WHITE} WARNING ${RESET}`;
                if (a.severity === 'CRITICAL')
                    badge = `${BG_RED}${WHITE} CRITICAL ${RESET}`;
                else if (a.severity === 'INFO')
                    badge = `${BG_BLUE}${WHITE} INFO ${RESET}`;
                lines.push(`  ${badge} ${BOLD}${a.title}${RESET}`);
                lines.push(`    ${DIM}Impact :${RESET} ${RED}-${a.wastedTokens.toLocaleString()} tokens${RESET} (${CostCalculator.formatCurrency(a.wastedMonthlyCost)}/mo)`);
                lines.push(`    ${DIM}Details:${RESET} ${a.description}`);
                lines.push(`    ${DIM}Fix    :${RESET} ${GREEN}${a.fixAction}${RESET}`);
                lines.push('');
            }
        }
        else {
            lines.push(`${BOLD}${GREEN}✅ No major anomalies detected! Your Claude environment is lean.${RESET}`);
            lines.push('');
        }
        // 6. Action prompt
        if (audit.anomalies.some(a => a.autoFixable)) {
            lines.push(`${BOLD}${CYAN}💡 RECOMMENDED ACTION:${RESET}`);
            lines.push(`   Run ${BOLD}npx claude-context-auditor --fix${RESET} to automatically resolve duplicates & purge bloat.`);
        }
        lines.push('');
        return lines.join('\n');
    }
}
//# sourceMappingURL=terminal.js.map