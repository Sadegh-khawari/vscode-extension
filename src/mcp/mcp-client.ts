/**
 * MCP Client - Connects to MCP servers for agentic file access
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private availableTools: Map<string, Tool[]> = new Map();

  async connectServer(config: MCPServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      await this.disconnectServer(config.name);
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    const client = new Client(
      { name: `vscode-llm-assistant-${config.name}`, version: '0.0.1' },
      { capabilities: {} }
    );

    await client.connect(transport);

    // Get available tools
    const toolsResult = await client.listTools();
    this.availableTools.set(config.name, toolsResult.tools);

    this.clients.set(config.name, client);
    this.transports.set(config.name, transport);

    vscode.window.showInformationMessage(`Connected to MCP server: ${config.name}`);
  }

  async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    const transport = this.transports.get(name);

    if (client) {
      await client.close();
      this.clients.delete(name);
    }
    if (transport) {
      await transport.close();
      this.transports.delete(name);
    }
    this.availableTools.delete(name);
  }

  getAvailableTools(serverName?: string): Tool[] {
    if (serverName) {
      return this.availableTools.get(serverName) ?? [];
    }
    // Return all tools from all servers
    const allTools: Tool[] = [];
    for (const tools of this.availableTools.values()) {
      allTools.push(...tools);
    }
    return allTools;
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  }

  async disconnectAll(): Promise<void> {
    for (const name of this.clients.keys()) {
      await this.disconnectServer(name);
    }
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
}

export const mcpClientManager = new MCPClientManager();

// Default filesystem MCP server config
export const DEFAULT_FILESYSTEM_MCP_CONFIG: MCPServerConfig = {
  name: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem'],
  // The workspace path will be added dynamically
};