import fs from 'fs';
import path from 'path';
import { BackupManager } from './backup.js';
export class ConfigFixer {
    /**
     * Safely apply automated remediations to the user's config
     */
    static applyFix(audit, options = {}) {
        const targetFile = audit.configPath;
        const changesApplied = [];
        let tokensSaved = 0;
        if (!fs.existsSync(targetFile)) {
            return {
                success: false,
                backupPath: '',
                changesApplied: ['Configuration file does not exist on disk for modification.'],
                tokensSaved: 0,
                monthlySavings: 0,
            };
        }
        if (options.dryRun) {
            return {
                success: true,
                backupPath: '(Dry run - no backup created)',
                changesApplied: ['[DRY RUN] Would deduplicate skills and prune bloated schemas.'],
                tokensSaved: audit.optimizableTokens,
                monthlySavings: audit.potentialMonthlySavings,
            };
        }
        // 1. Create Timestamped Backup
        const backupPath = BackupManager.createBackup(targetFile, options.backupDir);
        try {
            const rawContent = fs.readFileSync(targetFile, 'utf-8');
            const config = JSON.parse(rawContent);
            // 2. Fix Skill Duplications
            if (options.deduplicateSkills !== false) {
                const duplicates = audit.injectedSkills.filter(s => s.isDuplicate);
                for (const dup of duplicates) {
                    if (dup.filePath && fs.existsSync(dup.filePath) && dup.source === 'workspace') {
                        // Rename to .bak / .disabled to avoid accidental data loss
                        const disabledPath = `${dup.filePath}.disabled`;
                        fs.renameSync(dup.filePath, disabledPath);
                        changesApplied.push(`Disabled duplicate workspace skill file: ${path.basename(dup.filePath)}`);
                        tokensSaved += dup.tokens;
                    }
                    else if (Array.isArray(config.skills)) {
                        config.skills = config.skills.filter((s) => {
                            const name = typeof s === 'string' ? s : s.name;
                            return name !== dup.name;
                        });
                        changesApplied.push(`Removed duplicate skill entry from config: ${dup.name}`);
                        tokensSaved += dup.tokens;
                    }
                }
            }
            // 3. Fix Bloated MCPs (Disable servers with >20k tokens if flag set)
            if (options.disableBloatedMcp) {
                const mcpServers = config.mcpServers || config.mcp_servers || {};
                for (const s of audit.mcpServers) {
                    if (s.tokenCost > 20000 && mcpServers[s.name]) {
                        mcpServers[s.name].disabled = true;
                        changesApplied.push(`Set disabled=true for bloated MCP server: ${s.name} (~${s.tokenCost} tokens)`);
                        tokensSaved += s.tokenCost;
                    }
                }
                if (config.mcpServers)
                    config.mcpServers = mcpServers;
                if (config.mcp_servers)
                    config.mcp_servers = mcpServers;
            }
            // 4. Stale Hooks Cleanup
            if (options.removeStaleHooks) {
                for (const hook of audit.hooks) {
                    if (hook.isStale && fs.existsSync(hook.filePath)) {
                        const disabledHook = `${hook.filePath}.disabled`;
                        fs.renameSync(hook.filePath, disabledHook);
                        changesApplied.push(`Archived stale hook: ${hook.name} -> ${path.basename(disabledHook)}`);
                        tokensSaved += hook.tokensOverhead;
                    }
                }
            }
            // Write updated config atomically
            fs.writeFileSync(targetFile, JSON.stringify(config, null, 2), 'utf-8');
            const monthlySavings = (tokensSaved / 1_000_000) * 3.0 * (audit.sessionSummary.sessionsPerDay * audit.sessionSummary.workingDaysPerMonth);
            return {
                success: true,
                backupPath,
                changesApplied: changesApplied.length > 0 ? changesApplied : ['No eligible automated fixes found.'],
                tokensSaved,
                monthlySavings,
            };
        }
        catch (err) {
            // If error occurs, restore backup
            BackupManager.restore(backupPath, targetFile);
            return {
                success: false,
                backupPath,
                changesApplied: [`Error applying fixes (restored backup): ${err.message}`],
                tokensSaved: 0,
                monthlySavings: 0,
            };
        }
    }
}
//# sourceMappingURL=fixer.js.map