import { AuditResult, ClaudeModel } from '../types/index.js';
import { ParsedConfigBundle } from '../config/parser.js';
export interface DetectorOptions {
    model?: ClaudeModel;
    sessionsPerDay?: number;
    workingDaysPerMonth?: number;
}
export declare class AnomalyDetector {
    /**
     * Run deep audit on parsed configurations and produce structured report
     */
    static analyze(bundle: ParsedConfigBundle, options?: DetectorOptions): AuditResult;
}
//# sourceMappingURL=detector.d.ts.map