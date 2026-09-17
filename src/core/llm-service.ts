/**
 * LLM Service - Handles communication with LLM APIs (Anthropic, OpenAI)
 */

import { LLMConfig, LLMRequest, LLMResponse, ChatMessage, ApiProvider, Tool, ToolCall } from './types';

export class LLMService {
  private config: LLMConfig | null = null;

  setConfig(config: LLMConfig): void {
    this.config = config;
  }

  getConfig(): LLMConfig | null {
    return this.config;
  }

  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config) {
      throw new Error('LLM service not configured. Please set API key first.');
    }

    switch (this.config.apiProvider) {
      case 'anthropic':
        return this.sendToAnthropic(request);
      case 'openai':
        return this.sendToOpenAI(request);
      default:
        throw new Error(`Unsupported API provider: ${this.config.apiProvider}`);
    }
  }

  private async sendToAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: this.config!.apiKey,
      baseURL: this.config!.baseUrl,
    });

    const messages = request.messages
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    const response = await client.messages.create({
      model: this.config!.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.1,
      system: request.systemPrompt,
      messages,
      tools: request.tools ? this.convertToolsToAnthropic(request.tools) : undefined,
      tool_choice: request.toolChoice ? this.convertToolChoiceToAnthropic(request.toolChoice) : undefined,
    });

    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private convertToolsToAnthropic(tools: Tool[]) {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  private convertToolChoiceToAnthropic(toolChoice: LLMRequest['toolChoice']) {
    if (toolChoice === 'auto') {return { type: 'auto' as const };}
    if (toolChoice === 'none') {return { type: 'any' as const };}  // Anthropic uses 'any' not 'none'
    if (toolChoice && toolChoice.type === 'function') {
      return { type: 'tool' as const, name: toolChoice.function.name };
    }
    return undefined;
  }

  private async sendToOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: this.config!.apiKey,
      baseURL: this.config!.baseUrl,
    });

    const messages = [
      ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
      ...request.messages,
    ];

    const response = await client.chat.completions.create({
      model: this.config!.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.1,
      messages,
      tools: request.tools ? this.convertToolsToOpenAI(request.tools) : undefined,
      tool_choice: request.toolChoice ? this.convertToolChoiceToOpenAI(request.toolChoice) : undefined,
    });

    const message = response.choices[0]?.message;
    const content = message?.content ?? '';
    const toolCalls: ToolCall[] = [];

    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  private convertToolsToOpenAI(tools: Tool[]) {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  }

  private convertToolChoiceToOpenAI(toolChoice: LLMRequest['toolChoice']) {
    if (toolChoice === 'auto') {return 'auto';}
    // OpenAI uses 'none' as string literal
    if (toolChoice === 'none') {return 'none' as const;}
    if (toolChoice && toolChoice.type === 'function') {
      return { type: 'function' as const, function: { name: toolChoice.function.name } };
    }
    return undefined;
  }

  // Helper to build system prompts for different tasks
  static getSystemPrompt(task: 'generate' | 'explain' | 'fix' | 'chat'): string {
    const basePrompt = `You are an expert software engineer assistant integrated into VSCode.
You help with code generation, explanation, bug fixing, and project analysis.
Be concise, accurate, and provide production-ready code.`;

    const taskPrompts: Record<string, string> = {
      generate: `${basePrompt}

TASK: Generate code based on user instruction.
- Write clean, idiomatic code for the target language
- Follow best practices and patterns
- Include relevant imports and types
- Return ONLY the code block, no extra explanation unless asked`,
      explain: `${basePrompt}

TASK: Explain the selected code.
- Provide a clear, structured explanation
- Cover what the code does, how it works, and any important details
- Mention potential issues or improvements if relevant
- Use markdown formatting for readability`,
      fix: `${basePrompt}

TASK: Fix the bug in the provided code.
- Analyze the error and code context
- Provide a minimal, targeted fix
- Explain the root cause and the fix
- Return the corrected code block`,
      chat: `${basePrompt}

TASK: General coding assistance chat.
- Answer questions about code, architecture, best practices
- Provide code snippets when helpful
- Be conversational but technical`,
    };

    return taskPrompts[task] || basePrompt;
  }
}

// Singleton instance
export const llmService = new LLMService();