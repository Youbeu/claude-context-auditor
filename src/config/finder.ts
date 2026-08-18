import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DiscoveredPaths {
  primaryConfig?: string;
  desktopConfig?: string;
  cursorConfig?: string;
  workspaceConfig?: string;
  globalSkillsDir?: string;
  workspaceSkillsDir?: string;
  hooksDir?: string;
  claudeRuleFiles: string[];
}

export class ConfigFinder {
  /**
   * Search and discover all active Claude and MCP configuration paths
   */
  static discover(customConfigPath?: string, cwd: string = process.cwd()): DiscoveredPaths {
    const home = os.homedir();
    const result: DiscoveredPaths = {
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
    } else if (fs.existsSync(localClaudeConfig)) {
      result.workspaceConfig = localClaudeConfig;
    }

    // 4. Claude Desktop Config
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    let desktopConfigPath = '';

    if (isWindows && process.env.APPDATA) {
      desktopConfigPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    } else if (isMac) {
      desktopConfigPath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else {
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
    } else if (fs.existsSync(globalCursorMcp)) {
      result.cursorConfig = globalCursorMcp;
    }

    // 6. Global Skills Directory (~/.claude/skills/)
    const globalSkills = path.join(home, '.claude', 'skills');
    if (fs.existsSync(globalSkills)) {
      result.globalSkillsDir = globalSkills;
    }

    // 7. Workspace Skills Directory (./.claude/skills/)
    const workspaceSkills = path.join(cwd, '.claude', 'skills');
    if (fs.existsSync(workspaceSkills)) {
      result.workspaceSkillsDir = workspaceSkills;
    }

    // 8. Hooks Directory (~/.claude/hooks/)
    const hooksPath = path.join(home, '.claude', 'hooks');
    if (fs.existsSync(hooksPath)) {
      result.hooksDir = hooksPath;
    }

    // 9. CLAUDE.md & Rules
    const localClaudeMd = path.join(cwd, 'CLAUDE.md');
    const globalClaudeMd = path.join(home, '.claude', 'CLAUDE.md');
    const localCursorRules = path.join(cwd, '.cursorrules');

    if (fs.existsSync(localClaudeMd)) result.claudeRuleFiles.push(localClaudeMd);
    if (fs.existsSync(globalClaudeMd)) result.claudeRuleFiles.push(globalClaudeMd);
    if (fs.existsSync(localCursorRules)) result.claudeRuleFiles.push(localCursorRules);

    return result;
  }
}
