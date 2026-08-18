export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';

export type ClaudeModel = 'claude-3-7-sonnet' | 'claude-3-5-sonnet' | 'claude-3-opus' | 'claude-3-5-haiku';

export interface MCPServerInfo {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  tokenCost: number;
  toolCount: number;
  tools?: {
    name: string;
    description?: string;
    tokens: number;
  }[];
  verdict: string;
}

export interface InjectedSkillInfo {
  name: string;
  namespace?: string;
  source: 'claude.ai (remote/injected)' | 'workspace' | 'global' | 'plugin';
  filePath?: string;
  tokens: number;
  isDuplicate: boolean;
  duplicateOf?: string;
  verdict: string;
}

export interface HookInfo {
  name: string;
  filePath: string;
  tokensOverhead: number;
  lastModified: string;
  isStale: boolean;
  verdict: string;
}

export interface RuleFileDocInfo {
  name: string;
  filePath: string;
  tokens: number;
  lineCount: number;
  isBloated: boolean;
  verdict: string;
}

export interface AnomalyReport {
  id: string;
  title: string;
  severity: Severity;
  category: 'DUPLICATION' | 'MCP_BLOAT' | 'STATIC_DOC_POISONING' | 'STALE_HOOK' | 'SILENT_INJECTION';
  description: string;
  wastedTokens: number;
  wastedMonthlyCost: number;
  fixAction: string;
  autoFixable: boolean;
}

export interface SessionSummary {
  totalContextBeforeConversation: number;
  contextWindowMax: number;
  overheadPercentage: number;
  tokenCostPerSession: number;
  monthlyWasteAtEstimatedUsage: number;
  targetModel: ClaudeModel;
  sessionsPerDay: number;
  workingDaysPerMonth: number;
}

export interface AuditResult {
  timestamp: string;
  configPath: string;
  sessionSummary: SessionSummary;
  mcpServers: MCPServerInfo[];
  injectedSkills: InjectedSkillInfo[];
  hooks: HookInfo[];
  rules: RuleFileDocInfo[];
  anomalies: AnomalyReport[];
  topOffenders: {
    name: string;
    type: 'MCP' | 'SKILL' | 'HOOK' | 'RULES';
    tokens: number;
    percentage: number;
    costPerMonth: number;
  }[];
  optimizableTokens: number;
  potentialMonthlySavings: number;
}

export interface FixOptions {
  deduplicateSkills?: boolean;
  disableBloatedMcp?: boolean;
  removeStaleHooks?: boolean;
  backupDir?: string;
  dryRun?: boolean;
}

export interface FixResult {
  success: boolean;
  backupPath: string;
  changesApplied: string[];
  tokensSaved: number;
  monthlySavings: number;
}
