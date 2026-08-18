import test from 'node:test';
import assert from 'node:assert';
import { TokenEngine } from '../src/engine/tokenizer.js';
import { CostCalculator } from '../src/engine/cost.js';
test('TokenEngine should accurately count text tokens', () => {
    const shortText = 'Hello world!';
    const tokens = TokenEngine.countTextTokens(shortText);
    assert.ok(tokens >= 2 && tokens <= 4, `Expected 2-4 tokens, got ${tokens}`);
    const codeSnippet = `
    function calculateTotal(items: Array<{ price: number; quantity: number }>): number {
      return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    }
  `;
    const codeTokens = TokenEngine.countTextTokens(codeSnippet);
    assert.ok(codeTokens >= 20 && codeTokens <= 80, `Expected 20-80 tokens for code snippet, got ${codeTokens}`);
});
test('TokenEngine should count tool definition schemas with framing overhead', () => {
    const tool = {
        name: 'search_database',
        description: 'Searches PostgreSQL database for users matching query filter',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'SQL search query filter' },
                limit: { type: 'number', description: 'Maximum results to return' },
            },
            required: ['query'],
        },
    };
    const tokens = TokenEngine.countToolDefinitionTokens(tool);
    assert.ok(tokens > 40, `Tool schema tokens should include framing, got ${tokens}`);
});
test('CostCalculator should accurately estimate dollar costs', () => {
    // 1,000,000 tokens on Claude 3.7 Sonnet ($3.00/M) = $3.00
    const sessionCost = CostCalculator.calculateSessionCost(1_000_000, 'claude-3-7-sonnet');
    assert.strictEqual(sessionCost, 3.00);
    // Monthly calculation: 50,000 tokens * 20 sessions/day * 22 days/mo = 22,000,000 tokens = $66.00
    const monthly = CostCalculator.calculateMonthlyCost(50_000, 20, 22, 'claude-3-7-sonnet');
    assert.strictEqual(monthly, 66.00);
});
//# sourceMappingURL=tokenizer.test.js.map