# LLM Coding Assistant

A VSCode extension that connects to cloud LLMs (Anthropic Claude, OpenAI GPT) for code generation, explanation, bug fixing, and project analysis using MCP (Model Context Protocol).

## Features

- **Code Generation** - Generate code from natural language instructions (Command Palette or Webview)
- **Code Explanation** - Select code and get detailed explanations (Command Palette or Webview)
- **Bug Fixing** - Select problematic code, describe the error, get fix suggestions (Command Palette or Webview)
- **Chat Interface** - Interactive chat with project context awareness (Webview sidebar)
- **Project Context** - Automatically includes package.json, key files, and file structure
- **MCP Integration** - Connect to MCP servers for agentic file access

## Installation

### From Source

```bash
git clone https://github.com/your-username/llm-coding-assistant
cd llm-coding-assistant
npm install
npm run vscode:prepublish
```

Then press `F5` in VSCode to launch the Extension Development Host.

### From VSIX

```bash
code --install-extension llm-coding-assistant-0.0.5.vsix
```

## Configuration

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `LLM Coding Assistant: Configure`
3. Select your API provider (Anthropic or OpenAI)
4. Enter your API key
5. (Optional) Enter a custom base URL

## Usage

### Chat (Webview Sidebar)
- Click the "LLM Assistant" icon in the Activity Bar
- Type your question and press Enter
- The chat uses agentic MCP tools - the LLM can discover and read files on its own

### Generate Code
**Command Palette:**
- Run `LLM Coding Assistant: Generate Code` from Command Palette
- Enter your instruction (e.g., "Create a function that validates email addresses")

**Webview:**
- Click "LLM Assistant" in Activity Bar
- Type your instruction in the input area
- Click "Generate Code" button
- Use "Accept" to insert at cursor or "Reject" to dismiss

### Explain Code
**Command Palette:**
- Select code in the editor
- Run `LLM Coding Assistant: Explain Code` from Command Palette

**Webview:**
- Select code in the editor
- Click "LLM Assistant" in Activity Bar
- Click "Explain Code" button in header (appears when code is selected)
- Explanation appears in chat

### Fix Code
**Command Palette:**
- Select problematic code
- Run `LLM Coding Assistant: Fix Code` from Command Palette
- Describe the error (e.g., "TypeError: Cannot read property of undefined")

**Webview:**
- Select problematic code in the editor
- Click "LLM Assistant" in Activity Bar
- Click "Fix Code" button in header (appears when code is selected)
- Fix suggestion appears in chat with Accept/Reject buttons

## Architecture

```
src/
├── core/
│   ├── types.ts          # Core type definitions
│   ├── llm-service.ts    # LLM API communication (Anthropic/OpenAI)
│   ├── context-builder.ts # VSCode context collection
│   ├── prompt-builder.ts  # Prompt construction
│   └── core-service.ts    # Main orchestrator
├── mcp/
│   └── mcp-client.ts     # MCP client manager
├── webview/              # React-based chat UI
└── extension.ts          # Extension entry point
```

## Tech Stack

- **TypeScript** (strict mode)
- **VSCode Extension API**
- **React** (Webview UI)
- **Vite** (Webview bundler)
- **@anthropic-ai/sdk** / **openai** (LLM APIs)
- **@modelcontextprotocol/sdk** (MCP client)
- **Vitest** (testing)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Build webview
cd webview && npm run build

# Run tests
npm test

# Lint
npm run lint

# Package for distribution
npx vsce package
```

## Publishing

```bash
# Login to vsce (requires Azure DevOps PAT)
npx vsce login <publisher-name>

# Publish
npx vsce publish
```

## Requirements

- VSCode 1.137+
- Node.js 18+
- API key for Anthropic or OpenAI

## License

MIT