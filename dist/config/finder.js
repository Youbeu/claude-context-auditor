import fs from 'fs';
import path from 'path';
import os from 'os';
export class ConfigFinder {
    /**
     * Search and discover all active Claude, Gemini, Antigravity, and MCP configuration paths
     */
    static discover(customConfigPath, cwd = process.cwd()) {
        const home = os.homedir();
        const result = {
            globalSkillsDirs: [],
            workspaceSkillsDirs: [],
            claudeRuleFiles: [],
        };
        // 1. Explicit Custom Path
        if (customConfigPath && fs.existsSync(customConfigPath)) {
            result.primaryConfig = path.resolve(customConfigPath);
        }
        // 2. Standard Global Claude Config (~/.claude.json)
        if (!result.primaryConfig) {
            const globalClaudeJson = path.join(home, '.claude.json');
            if (fs.existsSync(globalClaudeJson)) {
                result.primaryConfig = globalClaudeJson;
            }
        }
        // 3. Workspace Config (.claude.json or .claude/config.json)
        const localClaudeJson = path.join(cwd, '.claude.json');
        const localClaudeConfig = path.join(cwd, '.claude', 'config.json');
        if (fs.existsSync(localClaudeJson)) {
            result.workspaceConfig = localClaudeJson;
        }
        else if (fs.existsSync(localClaudeConfig)) {
            result.workspaceConfig = localClaudeConfig;
        }
        // 4. Claude Desktop Config
        const isWindows = process.platform === 'win32';
        const isMac = process.platform === 'darwin';
        let desktopConfigPath = '';
        if (isWindows && process.env.APPDATA) {
            desktopConfigPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
        }
        else if (isMac) {
            desktopConfigPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        }
        else {
            desktopConfigPath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
        }
        if (fs.existsSync(desktopConfigPath)) {
            result.desktopConfig = desktopConfigPath;
        }
        // 5. Cursor MCP Config (~/.cursor/mcp.json or .cursor/mcp.json)
        const globalCursorMcp = path.join(home, '.cursor', 'mcp.json');
        const localCursorMcp = path.join(cwd, '.cursor', 'mcp.json');
        if (fs.existsSync(localCursorMcp)) {
            result.cursorConfig = localCursorMcp;
        }
        else if (fs.existsSync(globalCursorMcp)) {
            result.cursorConfig = globalCursorMcp;
        }
        // 6. Global Skills Directories (~/.claude/skills/, ~/.gemini/config/skills/, builtin)
        const candidateGlobalSkills = [
            path.join(home, '.claude', 'skills'),
            path.join(home, '.gemini', 'config', 'skills'),
            path.join(home, '.gemini', 'antigravity-ide', 'builtin', 'skills'),
        ];
        for (const dir of candidateGlobalSkills) {
            if (fs.existsSync(dir)) {
                result.globalSkillsDirs.push(dir);
            }
        }
        // 7. Workspace Skills Directories (./.claude/skills/, ./.agents/skills/)
        const candidateWorkspaceSkills = [
            path.join(cwd, '.claude', 'skills'),
            path.join(cwd, '.agents', 'skills'),
            path.join(cwd, 'skills'),
        ];
        for (const dir of candidateWorkspaceSkills) {
            if (fs.existsSync(dir)) {
                result.workspaceSkillsDirs.push(dir);
            }
        }
        // 8. Hooks Directory (~/.claude/hooks/)
        const hooksPath = path.join(home, '.claude', 'hooks');
        if (fs.existsSync(hooksPath)) {
            result.hooksDir = hooksPath;
        }
        // 9. CLAUDE.md & Rules
        const candidateRules = [
            path.join(cwd, 'CLAUDE.md'),
            path.join(home, '.claude', 'CLAUDE.md'),
            path.join(cwd, '.cursorrules'),
            path.join(cwd, 'GEMINI.md'),
            path.join(cwd, 'AGENTS.md'),
        ];
        for (const rule of candidateRules) {
            if (fs.existsSync(rule)) {
                result.claudeRuleFiles.push(rule);
            }
        }
        return result;
    }
}
//# sourceMappingURL=finder.js.map