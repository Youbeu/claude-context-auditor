import fs from 'fs';
import path from 'path';
import { DiscoveredPaths } from './finder.js';
import { MCPServerInfo, InjectedSkillInfo, HookInfo, RuleFileDocInfo } from '../types/index.js';
import { TokenEngine } from '../engine/tokenizer.js';

export interface ParsedConfigBundle {
  rawConfig: Record<string, unknown>;
  primaryPath: string;
  mcpServers: MCPServerInfo[];
  injectedSkills: InjectedSkillInfo[];
  hooks: HookInfo[];
  rules: RuleFileDocInfo[];
}

export class ConfigParser {
  /**
   * Parse all discovered configuration sources into a unified structure
   */
  static parseAll(paths: DiscoveredPaths): ParsedConfigBundle {
    let rawConfig: Record<string, unknown> = {};
    let primaryPath = paths.primaryConfig || paths.workspaceConfig || paths.desktopConfig || 'memory://default-config.json';

    // Parse Primary Config
    if (paths.primaryConfig && fs.existsSync(paths.primaryConfig)) {
      try {
        const content = fs.readFileSync(paths.primaryConfig, 'utf-8');
        rawConfig = JSON.parse(content);
        primaryPath = paths.primaryConfig;
      } catch {
        rawConfig = {};
      }
    } else if (paths.workspaceConfig && fs.existsSync(paths.workspaceConfig)) {
      try {
        const content = fs.readFileSync(paths.workspaceConfig, 'utf-8');
        rawConfig = JSON.parse(content);
        primaryPath = paths.workspaceConfig;
      } catch {
        rawConfig = {};
      }
    } else if (paths.desktopConfig && fs.existsSync(paths.desktopConfig)) {
      try {
        const content = fs.readFileSync(paths.desktopConfig, 'utf-8');
        rawConfig = JSON.parse(content);
        primaryPath = paths.desktopConfig;
      } catch {
        rawConfig = {};
      }
    }

    const mcpServers = this.extractMCPServers(rawConfig, paths);
    const injectedSkills = this.extractSkills(rawConfig, paths);
    const hooks = this.extractHooks(paths.hooksDir);
    const rules = this.extractRules(paths.claudeRuleFiles);

    return {
      rawConfig,
      primaryPath,
      mcpServers,
      injectedSkills,
      hooks,
      rules,
    };
  }

  /**
   * Extract MCP Server definitions and calculate their schema token impact
   */
  private static extractMCPServers(rawConfig: Record<string, unknown>, paths: DiscoveredPaths): MCPServerInfo[] {
    const servers: MCPServerInfo[] = [];

    // Look in rawConfig.mcpServers or rawConfig.mcp_servers
    const mcpObj = (rawConfig.mcpServers || rawConfig.mcp_servers || {}) as Record<string, any>;

    // Also merge from desktop config if separate
    if (paths.desktopConfig && fs.existsSync(paths.desktopConfig)) {
      try {
        const desktopContent = fs.readFileSync(paths.desktopConfig, 'utf-8');
        const desktopJson = JSON.parse(desktopContent);
        if (desktopJson.mcpServers) {
          Object.assign(mcpObj, desktopJson.mcpServers);
        }
      } catch {
        // ignore parse error
      }
    }

    // Also merge from cursor config
    if (paths.cursorConfig && fs.existsSync(paths.cursorConfig)) {
      try {
        const cursorContent = fs.readFileSync(paths.cursorConfig, 'utf-8');
        const cursorJson = JSON.parse(cursorContent);
        if (cursorJson.mcpServers) {
          Object.assign(mcpObj, cursorJson.mcpServers);
        }
      } catch {
        // ignore parse error
      }
    }

    for (const [name, config] of Object.entries(mcpObj)) {
      if (typeof config !== 'object' || config === null) continue;

      const isDisabled = Boolean(config.disabled);
      let toolCount = 0;
      let tokenCost = 0;
      const toolsList: { name: string; description?: string; tokens: number }[] = [];

      // If mock/declared tools are listed
      if (Array.isArray(config.tools)) {
        toolCount = config.tools.length;
        for (const t of config.tools) {
          const tTokens = TokenEngine.countToolDefinitionTokens(t);
          tokenCost += tTokens;
          toolsList.push({
            name: t.name || 'unnamed_tool',
            description: t.description,
            tokens: tTokens,
          });
        }
      } else {
        // Estimate based on standard MCP server signatures or configuration size
        // Standard MCP server tools average ~650 tokens per tool schema
        // Common defaults: github ~45 tools (28k tokens), postgres ~12 tools (8k tokens), etc.
        const serverEstimates: Record<string, { tools: number; tokens: number }> = {
          github: { tools: 48, tokens: 32500 },
          filesystem: { tools: 11, tokens: 6200 },
          postgres: { tools: 14, tokens: 9400 },
          sqlite: { tools: 8, tokens: 4800 },
          jira: { tools: 36, tokens: 24100 },
          confluence: { tools: 22, tokens: 14600 },
          slack: { tools: 18, tokens: 11800 },
          memory: { tools: 6, tokens: 3200 },
          puppeteer: { tools: 12, tokens: 8400 },
          playwright: { tools: 16, tokens: 11200 },
          brave: { tools: 4, tokens: 2100 },
          fetch: { tools: 2, tokens: 1200 },
        };

        const key = name.toLowerCase();
        const matched = Object.keys(serverEstimates).find(k => key.includes(k));

        if (matched) {
          toolCount = serverEstimates[matched].tools;
          tokenCost = serverEstimates[matched].tokens;
        } else {
          // Dynamic estimation based on command, args and config volume
          const configTokens = TokenEngine.countObjectTokens(config);
          toolCount = Math.max(5, Math.ceil(configTokens / 40));
          tokenCost = Math.max(2500, toolCount * 580);
        }
      }

      let verdict = 'NORMAL';
      if (isDisabled) {
        verdict = 'DISABLED';
      } else if (tokenCost > 20000) {
        verdict = 'CRITICAL BLOAT (>20k tokens)';
      } else if (tokenCost > 10000) {
        verdict = 'HEAVY OVERHEAD (>10k tokens)';
      }

      servers.push({
        name,
        command: config.command,
        args: config.args,
        env: config.env,
        disabled: isDisabled,
        tokenCost: isDisabled ? 0 : tokenCost,
        toolCount,
        tools: toolsList.length > 0 ? toolsList : undefined,
        verdict,
      });
    }

    return servers;
  }

  /**
   * Extract skills and detect duplication between global, workspace, and remote
   */
  private static extractSkills(rawConfig: Record<string, unknown>, paths: DiscoveredPaths): InjectedSkillInfo[] {
    const skills: InjectedSkillInfo[] = [];
    const skillNameMap = new Map<string, string>(); // name -> path/source

    // 1. Injected from rawConfig.skills or anthropic-skills
    const configSkills = (rawConfig.skills || rawConfig.injected_skills || []) as any[];
    if (Array.isArray(configSkills)) {
      for (const item of configSkills) {
        const name = typeof item === 'string' ? item : item.name || 'unnamed_skill';
        const tokens = typeof item === 'object' && item.tokens ? item.tokens : TokenEngine.countTextTokens(JSON.stringify(item));
        const isRemote = name.startsWith('anthropic-skills:') || !item.filePath;

        skills.push({
          name,
          source: isRemote ? 'claude.ai (remote/injected)' : 'plugin',
          tokens,
          isDuplicate: false,
          verdict: isRemote ? 'REMOTE INJECTION' : 'PLUGIN',
        });

        skillNameMap.set(this.normalizeSkillName(name), isRemote ? 'claude.ai' : 'config');
      }
    }

    // 2. Scan Global Skills Directory
    if (paths.globalSkillsDir && fs.existsSync(paths.globalSkillsDir)) {
      this.scanSkillDirectory(paths.globalSkillsDir, 'global', skills, skillNameMap);
    }

    // 3. Scan Workspace Skills Directory
    if (paths.workspaceSkillsDir && fs.existsSync(paths.workspaceSkillsDir)) {
      this.scanSkillDirectory(paths.workspaceSkillsDir, 'workspace', skills, skillNameMap);
    }

    return skills;
  }

  /**
   * Helper to scan skill directories
   */
  private static scanSkillDirectory(
    dirPath: string,
    source: 'global' | 'workspace',
    results: InjectedSkillInfo[],
    nameMap: Map<string, string>
  ) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        let skillFile = '';
        let skillName = entry.name;

        if (entry.isDirectory()) {
          const possibleSkillMd = path.join(dirPath, entry.name, 'SKILL.md');
          const possiblePrompt = path.join(dirPath, entry.name, 'prompt.md');
          if (fs.existsSync(possibleSkillMd)) skillFile = possibleSkillMd;
          else if (fs.existsSync(possiblePrompt)) skillFile = possiblePrompt;
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.prompt'))) {
          skillFile = path.join(dirPath, entry.name);
          skillName = entry.name.replace(/\.(md|prompt)$/, '');
        }

        if (skillFile && fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf-8');
          const tokens = TokenEngine.countSkillTokens(content);
          const normalized = this.normalizeSkillName(skillName);

          const isDuplicate = nameMap.has(normalized);
          const duplicateOf = nameMap.get(normalized);

          let verdict = 'CLEAN';
          if (isDuplicate) {
            verdict = `DUPLICATE of ${duplicateOf}`;
          }

          results.push({
            name: skillName,
            filePath: skillFile,
            source,
            tokens,
            isDuplicate,
            duplicateOf,
            verdict,
          });

          if (!isDuplicate) {
            nameMap.set(normalized, `${source}:${skillName}`);
          }
        }
      }
    } catch {
      // ignore read error
    }
  }

  /**
   * Scan Hooks Directory
   */
  private static extractHooks(hooksDir?: string): HookInfo[] {
    const hooks: HookInfo[] = [];
    if (!hooksDir || !fs.existsSync(hooksDir)) return hooks;

    try {
      const files = fs.readdirSync(hooksDir);
      const now = Date.now();

      for (const file of files) {
        const fullPath = path.join(hooksDir, file);
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const tokensOverhead = TokenEngine.countTextTokens(content);
        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        const isStale = ageInDays > 45;

        hooks.push({
          name: file,
          filePath: fullPath,
          tokensOverhead,
          lastModified: stats.mtime.toISOString().split('T')[0],
          isStale,
          verdict: isStale ? `STALE (${Math.round(ageInDays)} days untouched)` : 'ACTIVE',
        });
      }
    } catch {
      // ignore
    }

    return hooks;
  }

  /**
   * Scan CLAUDE.md and rule files
   */
  private static extractRules(ruleFiles: string[]): RuleFileDocInfo[] {
    const rules: RuleFileDocInfo[] = [];

    for (const file of ruleFiles) {
      if (!fs.existsSync(file)) continue;
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const tokens = TokenEngine.countTextTokens(content);
        const lines = content.split('\n').length;
        const isBloated = tokens > 3000 || lines > 200;

        rules.push({
          name: path.basename(file),
          filePath: file,
          tokens,
          lineCount: lines,
          isBloated,
          verdict: isBloated ? 'BLOATED (>3k tokens static rules)' : 'NORMAL',
        });
      } catch {
        // ignore
      }
    }

    return rules;
  }

  private static normalizeSkillName(name: string): string {
    return name.toLowerCase().replace(/^(anthropic-skills:|skill-)/, '').replace(/[-_]/g, '');
  }
}
