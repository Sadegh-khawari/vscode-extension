/**
 * Core Service - Main orchestrator for the LLM Coding Assistant
 */

import * as vscode from 'vscode';
import { llmService, LLMService } from './llm-service';
import { contextBuilder } from './context-builder';
import { promptBuilder } from './prompt-builder';
import { mcpClientManager, DEFAULT_FILESYSTEM_MCP_CONFIG } from '../mcp/mcp-client';
import {
  LLMConfig,
  GenerateCodeRequest,
  ExplainCodeRequest,
  FixCodeRequest,
  CodeContext,
  ProjectContext,
  LLMResponse,
  ApiProvider,
  Tool,
  ToolCall,
} from './types';

export class CoreService {
  private config: LLMConfig | null = null;
  private mcpInitialized = false;

  async initialize(context: vscode.ExtensionContext): Promise<void> {
    // Load saved configuration
    await this.loadConfig(context);

    // Initialize LLM service with saved config
    if (this.config) {
      llmService.setConfig(this.config);
    }

    // Initialize MCP filesystem server
    await this.initializeMCP(context);
  }

  private async loadConfig(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await context.secrets.get('llm-coding-assistant.apiKey');
    const apiProvider = context.globalState.get<ApiProvider>('llm-coding-assistant.apiProvider', 'anthropic');
    const model = context.globalState.get<string>('llm-coding-assistant.model', 'claude-sonnet-5');
    const baseUrl = context.globalState.get<string>('llm-coding-assistant.baseUrl');

    if (apiKey) {
      this.config = {
        apiProvider,
        model,
        apiKey,
        baseUrl,
      };
    }
  }

  async saveConfig(config: LLMConfig, context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.store('llm-coding-assistant.apiKey', config.apiKey);
    await context.globalState.update('llm-coding-assistant.apiProvider', config.apiProvider);
    await context.globalState.update('llm-coding-assistant.model', config.model);
    if (config.baseUrl) {
      await context.globalState.update('llm-coding-assistant.baseUrl', config.baseUrl);
    }
    this.config = config;
    llmService.setConfig(config);
  }

  async clearConfig(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete('llm-coding-assistant.apiKey');
    await context.globalState.update('llm-coding-assistant.apiProvider', undefined);
    await context.globalState.update('llm-coding-assistant.model', undefined);
    await context.globalState.update('llm-coding-assistant.baseUrl', undefined);
    this.config = null;
    llmService.setConfig({ apiProvider: 'anthropic', model: '', apiKey: '' });
  }

  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0;
  }

  getConfig(): LLMConfig | null {
    return this.config;
  }

  private async initializeMCP(context: vscode.ExtensionContext): Promise<void> {
    if (this.mcpInitialized) {
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const config = {
      ...DEFAULT_FILESYSTEM_MCP_CONFIG,
      args: [...DEFAULT_FILESYSTEM_MCP_CONFIG.args, workspacePath],
    };

    try {
      await mcpClientManager.connectServer(config);
      this.mcpInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP filesystem server:', error);
      // Don't throw - MCP is optional
    }
  }

  private getMCPTools(): Tool[] {
    const tools = mcpClientManager.getAvailableTools();
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema,
      },
    }));
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<LLMResponse> {
    let allResults = '';

    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        // For now, use the filesystem server
        const result = await mcpClientManager.callTool('filesystem', toolCall.function.name, args);
        allResults += `\nTool ${toolCall.function.name} result:\n${JSON.stringify(result, null, 2)}\n`;
      } catch (error) {
        allResults += `\nTool ${toolCall.function.name} error: ${error}\n`;
      }
    }

    // Send results back to LLM for final response
    return {
      content: allResults,
    };
  }

  async sendAgenticRequest(
    request: { messages: Array<{role: 'user' | 'assistant', content: string}>; systemPrompt?: string },
    projectContext?: ProjectContext
  ): Promise<LLMResponse> {
    const tools = this.getMCPTools();

    // First pass - let the model decide if it needs to use tools
    // Use full conversation history, not just the last message
    const response = await llmService.sendRequest({
      messages: request.messages,
      systemPrompt: request.systemPrompt,
      temperature: 0.3,
      maxTokens: 4096,
      tools: tools.length > 0 ? tools : undefined,
      toolChoice: tools.length > 0 ? 'auto' : undefined,
    });

    // If model wants to use tools, execute them and send results back
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults = await this.executeToolCalls(response.toolCalls);

      // Send tool results back to LLM for final response
      const finalResponse = await llmService.sendRequest({
        messages: [
          ...request.messages,
          { role: 'assistant', content: response.content || '' },
          { role: 'user', content: toolResults.content },
        ],
        systemPrompt: request.systemPrompt,
        temperature: 0.3,
        maxTokens: 4096,
      });

      return finalResponse;
    }

    return response;
  }

  async generateCode(request: GenerateCodeRequest): Promise<LLMResponse> {
    const prompt = promptBuilder.buildGeneratePrompt(request);
    const systemPrompt = LLMService.getSystemPrompt('generate');

    return llmService.sendRequest({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
      temperature: 0.1,
      maxTokens: 4096,
    });
  }

  async explainCode(request: ExplainCodeRequest): Promise<LLMResponse> {
    const prompt = promptBuilder.buildExplainPrompt(request);
    const systemPrompt = LLMService.getSystemPrompt('explain');

    return llmService.sendRequest({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
      temperature: 0.2,
      maxTokens: 4096,
    });
  }

  async fixCode(request: FixCodeRequest): Promise<LLMResponse> {
    const prompt = promptBuilder.buildFixPrompt(request);
    const systemPrompt = LLMService.getSystemPrompt('fix');

    return llmService.sendRequest({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
      temperature: 0.1,
      maxTokens: 4096,
    });
  }

  async chat(messages: Array<{role: string, content: string}>, projectContext?: ProjectContext): Promise<LLMResponse> {
    const prompt = promptBuilder.buildChatPrompt(messages, projectContext);
    const systemPrompt = LLMService.getSystemPrompt('chat');

    // Use agentic chat with MCP tools
    return this.sendAgenticRequest({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
    }, projectContext);
  }

  async getCodeContext(): Promise<CodeContext | null> {
    return contextBuilder.getCurrentCodeContext();
  }

  async getProjectContext(): Promise<ProjectContext> {
    return contextBuilder.getProjectContext();
  }

  async dispose(): Promise<void> {
    await mcpClientManager.disconnectAll();
  }
}

export const coreService = new CoreService();