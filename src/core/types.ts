/**
 * Core types for the LLM Coding Assistant
 */

export type ApiProvider = 'anthropic' | 'openai';

export interface LLMConfig {
  apiProvider: ApiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CodeContext {
  filePath: string;
  fileContent: string;
  selection?: {
    startLine: number;
    endLine: number;
    selectedText: string;
  };
  languageId: string;
}

export interface ProjectContext {
  workspaceFolders: string[];
  packageJson?: any;
  keyFiles: Map<string, string>;
  fileList: string[];
}

export interface LLMRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: {
      type: 'object';
      properties?: Record<string, any>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface GenerateCodeRequest {
  instruction: string;
  context: CodeContext;
  projectContext?: ProjectContext;
}

export interface ExplainCodeRequest {
  context: CodeContext;
  projectContext?: ProjectContext;
}

export interface FixCodeRequest {
  errorMessage: string;
  context: CodeContext;
  projectContext?: ProjectContext;
}

export interface WebviewMessage {
  type: 'chat' | 'generate' | 'explain' | 'fix' | 'accept' | 'reject' | 'config';
  payload: any;
}