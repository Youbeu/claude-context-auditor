export interface DiscoverOptions {
    includeGlobalSkills?: boolean;
    includeWorkspaceSkills?: boolean;
}
export interface DiscoveredPaths {
    primaryConfig?: string;
    desktopConfig?: string;
    cursorConfig?: string;
    workspaceConfig?: string;
    globalSkillsDirs: string[];
    workspaceSkillsDirs: string[];
    hooksDir?: string;
    claudeRuleFiles: string[];
}
export declare class ConfigFinder {
    /**
     * Search and discover all active Claude, Gemini, Antigravity, and MCP configuration paths
     */
    static discover(customConfigPath?: string, cwd?: string, options?: DiscoverOptions): DiscoveredPaths;
}
//# sourceMappingURL=finder.d.ts.map