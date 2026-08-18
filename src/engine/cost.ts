import { ClaudeModel } from '../types/index.js';

export interface ModelPricing {
  model: ClaudeModel;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
  contextWindowMax: number;
}

export const PRICING_TABLE: Record<ClaudeModel, ModelPricing> = {
  'claude-3-7-sonnet': {
    model: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet (Hybrid / Thinking)',
    inputPerMillion: 3.00,
    outputPerMillion: 15.00,
    contextWindowMax: 200000,
  },
  'claude-3-5-sonnet': {
    model: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    inputPerMillion: 3.00,
    outputPerMillion: 15.00,
    contextWindowMax: 200000,
  },
  'claude-3-opus': {
    model: 'claude-3-opus',
    name: 'Claude 3 Opus',
    inputPerMillion: 15.00,
    outputPerMillion: 75.00,
    contextWindowMax: 200000,
  },
  'claude-3-5-haiku': {
    model: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    inputPerMillion: 0.80,
    outputPerMillion: 4.00,
    contextWindowMax: 200000,
  },
};

export class CostCalculator {
  /**
   * Calculate cost for a given number of input tokens
   */
  static calculateSessionCost(tokens: number, model: ClaudeModel = 'claude-3-7-sonnet'): number {
    const pricing = PRICING_TABLE[model] || PRICING_TABLE['claude-3-7-sonnet'];
    const cost = (tokens / 1_000_000) * pricing.inputPerMillion;
    return Number(cost.toFixed(4));
  }

  /**
   * Calculate estimated monthly cost of idle context overhead
   * @param tokensOverhead Tokens injected before conversation starts
   * @param sessionsPerDay Average number of agent sessions per day (default: 20)
   * @param workingDays Average working days per month (default: 22)
   * @param model Target Claude model
   */
  static calculateMonthlyCost(
    tokensOverhead: number,
    sessionsPerDay: number = 20,
    workingDays: number = 22,
    model: ClaudeModel = 'claude-3-7-sonnet'
  ): number {
    const pricing = PRICING_TABLE[model] || PRICING_TABLE['claude-3-7-sonnet'];
    const totalTokens = tokensOverhead * sessionsPerDay * workingDays;
    const monthly = (totalTokens / 1_000_000) * pricing.inputPerMillion;
    return Number(monthly.toFixed(2));
  }

  /**
   * Format USD currency cleanly
   */
  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
