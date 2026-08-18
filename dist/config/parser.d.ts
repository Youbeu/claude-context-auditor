import { DiscoveredPaths } from './finder.js';
import { MCPServerInfo, InjectedSkillInfo, HookInfo, RuleFileDocInfo } from '../types/index.js';
export interface ParsedConfigBundle {
    rawConfig: Record<string, unknown>;
    primaryPath: string;
    mcpServers: MCPServerInfo[];
    injectedSkills: InjectedSkillInfo[];
    hooks: HookInfo[];
    rules: RuleFileDocInfo[];
}
export declare class ConfigParser {
    /**
     * Parse all discovered configuration sources into a unified structure
     */
    static parseAll(paths: DiscoveredPaths): ParsedConfigBundle;
    /**
     * Extract MCP Server definitions and calculate their schema token impact
     */
    private static extractMCPServers;
    /**
     * Extract skills and detect duplication between global, workspace, and remote
     */
    private static extractSkills;
    /**
     * Helper to scan skill directories
     */
    private static scanSkillDirectory;
    /**
     * Scan Hooks Directory
     */
    private static extractHooks;
    /**
     * Scan CLAUDE.md and rule files
     */
    private static extractRules;
    private static normalizeSkillName;
}
//# sourceMappingURL=parser.d.ts.map