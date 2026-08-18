export * from './types/index.js';
export { ConfigFinder } from './config/finder.js';
export { ConfigParser } from './config/parser.js';
export { TokenEngine } from './engine/tokenizer.js';
export { CostCalculator, PRICING_TABLE } from './engine/cost.js';
export { AnomalyDetector } from './engine/detector.js';
export { BackupManager } from './remediator/backup.js';
export { ConfigFixer } from './remediator/fixer.js';
export { TerminalReporter } from './reporters/terminal.js';
export { JsonReporter } from './reporters/json.js';
export { HtmlReporter } from './reporters/html.js';
import { DetectorOptions } from './engine/detector.js';
import { AuditResult } from './types/index.js';
/**
 * Main programmatic entry point: runs a full audit on the current or custom environment
 */
export declare function auditContext(customConfigPath?: string, options?: DetectorOptions): AuditResult;
//# sourceMappingURL=index.d.ts.map