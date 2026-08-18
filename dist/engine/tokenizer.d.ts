/**
 * Token Counter and Estimator Engine
 * Calibrated specifically for Anthropic Claude's BPE tokenizer (Byte-Pair Encoding)
 */
export declare class TokenEngine {
    /**
     * Fast, accurate estimation of token count for arbitrary text/code
     * Groups leading spaces with alphanumeric words (standard BPE behavior).
     * Average: ~3.8-4.0 characters per token for English & code.
     */
    static countTextTokens(text: string): number;
    /**
     * Estimate tokens consumed by an MCP Tool definition Schema
     * Anthropic formats MCP tools into XML/JSON schemas with ~24 tokens of framing overhead per tool
     */
    static countToolDefinitionTokens(tool: {
        name: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
    }): number;
    /**
     * Count tokens in a Skill or System Prompt file
     */
    static countSkillTokens(content: string): number;
    /**
     * Fast token count for standard objects
     */
    static countObjectTokens(obj: unknown): number;
}
//# sourceMappingURL=tokenizer.d.ts.map