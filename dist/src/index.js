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
import { ConfigFinder } from './config/finder.js';
import { ConfigParser } from './config/parser.js';
import { AnomalyDetector } from './engine/detector.js';
/**
 * Main programmatic entry point: runs a full audit on the current or custom environment
 */
export function auditContext(customConfigPath, options) {
    const paths = ConfigFinder.discover(customConfigPath);
    const bundle = ConfigParser.parseAll(paths);
    return AnomalyDetector.analyze(bundle, options);
}
//# sourceMappingURL=index.js.map