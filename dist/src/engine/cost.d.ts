import { ClaudeModel } from '../types/index.js';
export interface ModelPricing {
    model: ClaudeModel;
    name: string;
    inputPerMillion: number;
    outputPerMillion: number;
    contextWindowMax: number;
}
export declare const PRICING_TABLE: Record<ClaudeModel, ModelPricing>;
export declare class CostCalculator {
    /**
     * Calculate cost for a given number of input tokens
     */
    static calculateSessionCost(tokens: number, model?: ClaudeModel): number;
    /**
     * Calculate estimated monthly cost of idle context overhead
     * @param tokensOverhead Tokens injected before conversation starts
     * @param sessionsPerDay Average number of agent sessions per day (default: 20)
     * @param workingDays Average working days per month (default: 22)
     * @param model Target Claude model
     */
    static calculateMonthlyCost(tokensOverhead: number, sessionsPerDay?: number, workingDays?: number, model?: ClaudeModel): number;
    /**
     * Format USD currency cleanly
     */
    static formatCurrency(amount: number): string;
}
//# sourceMappingURL=cost.d.ts.map