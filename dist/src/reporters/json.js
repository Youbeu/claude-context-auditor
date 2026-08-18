export class JsonReporter {
    /**
     * Format audit result as clean, indented JSON string
     */
    static render(audit) {
        return JSON.stringify({
            version: '0.1.0',
            generatedAt: audit.timestamp,
            configPath: audit.configPath,
            summary: {
                totalContextBeforeConversation: audit.sessionSummary.totalContextBeforeConversation,
                contextWindowMax: audit.sessionSummary.contextWindowMax,
                overheadPercentage: audit.sessionSummary.overheadPercentage,
                tokenCostPerSession: audit.sessionSummary.tokenCostPerSession,
                monthlyWasteEst: audit.sessionSummary.monthlyWasteAtEstimatedUsage,
                optimizableTokens: audit.optimizableTokens,
                potentialMonthlySavings: audit.potentialMonthlySavings,
                targetModel: audit.sessionSummary.targetModel,
            },
            mcpServers: audit.mcpServers.map(s => ({
                name: s.name,
                tokens: s.tokenCost,
                tools: s.toolCount,
                disabled: s.disabled || false,
                verdict: s.verdict,
            })),
            injectedSkills: audit.injectedSkills.map(s => ({
                name: s.name,
                source: s.source,
                tokens: s.tokens,
                isDuplicate: s.isDuplicate,
                duplicateOf: s.duplicateOf,
                verdict: s.verdict,
            })),
            hooks: audit.hooks.map(h => ({
                name: h.name,
                tokens: h.tokensOverhead,
                isStale: h.isStale,
                lastModified: h.lastModified,
                verdict: h.verdict,
            })),
            rules: audit.rules.map(r => ({
                name: r.name,
                tokens: r.tokens,
                lineCount: r.lineCount,
                isBloated: r.isBloated,
                verdict: r.verdict,
            })),
            anomalies: audit.anomalies.map(a => ({
                id: a.id,
                title: a.title,
                severity: a.severity,
                category: a.category,
                wastedTokens: a.wastedTokens,
                wastedMonthlyCost: a.wastedMonthlyCost,
                fixAction: a.fixAction,
                autoFixable: a.autoFixable,
            })),
            topOffenders: audit.topOffenders,
        }, null, 2);
    }
}
//# sourceMappingURL=json.js.map