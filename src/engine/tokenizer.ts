/**
 * Token Counter and Estimator Engine
 * Calibrated specifically for Anthropic Claude's BPE tokenizer (Byte-Pair Encoding)
 */

export class TokenEngine {
  /**
   * Fast, accurate estimation of token count for arbitrary text/code
   * Groups leading spaces with alphanumeric words (standard BPE behavior).
   * Average: ~3.8-4.0 characters per token for English & code.
   */
  static countTextTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Matches word chunks with leading whitespace (like BPE), or individual punctuation marks/newlines
    const tokens = text.match(/\s*[\p{L}\p{N}]+|[^\s\p{L}\p{N}]|\n+/gu);
    if (!tokens) {
      return Math.ceil(text.length / 3.8);
    }

    let count = 0;
    for (const t of tokens) {
      if (t.length <= 5) {
        count += 1;
      } else {
        // Longer words/identifiers broken into subword tokens
        count += Math.ceil(t.length / 4.0);
      }
    }

    return Math.max(1, count);
  }

  /**
   * Estimate tokens consumed by an MCP Tool definition Schema
   * Anthropic formats MCP tools into XML/JSON schemas with ~24 tokens of framing overhead per tool
   */
  static countToolDefinitionTokens(tool: {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }): number {
    let rawSchemaStr = tool.name;
    if (tool.description) {
      rawSchemaStr += ' ' + tool.description;
    }
    if (tool.inputSchema) {
      rawSchemaStr += ' ' + JSON.stringify(tool.inputSchema);
    }

    const baseTokens = this.countTextTokens(rawSchemaStr);
    const framingOverhead = 24;

    return baseTokens + framingOverhead;
  }

  /**
   * Count tokens in a Skill or System Prompt file
   */
  static countSkillTokens(content: string): number {
    const rawTokens = this.countTextTokens(content);
    const wrapperOverhead = 15;
    return rawTokens + wrapperOverhead;
  }

  /**
   * Fast token count for standard objects
   */
  static countObjectTokens(obj: unknown): number {
    return this.countTextTokens(JSON.stringify(obj, null, 2));
  }
}
