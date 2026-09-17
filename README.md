# LLM Coding Assistant

A VSCode extension that connects to cloud LLMs (Anthropic Claude, OpenAI GPT) for code generation, explanation, bug fixing, and project analysis using MCP (Model Context Protocol).

## Features

- **Code Generation** - Generate code from natural language instructions
- **Code Explanation** - Select code and get detailed explanations
- **Bug Fixing** - Select problematic code, describe the error, get fix suggestions
- **Chat Interface** - Interactive chat with project context awareness
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

### From VSIX (coming soon)

```bash
code --install-extension llm-coding-assistant-0.0.1.vsix
```

## Configuration

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `LLM Coding Assistant: Configure`
3. Select your API provider (Anthropic or OpenAI)
4. Enter your API key
5. (Optional) Enter a custom base URL

## Usage

### Chat
- Click the "LLM Assistant" icon in the Activity Bar
- Type your question and press Enter

### Generate Code
- Run `LLM Coding Assistant: Generate Code` from Command Palette
- Enter your instruction (e.g., "Create a function that validates email addresses")

### Explain Code
- Select code in the editor
- Run `LLM Coding Assistant: Explain Code` from Command Palette

### Fix Code
- Select problematic code
- Run `LLM Coding Assistant: Fix Code` from Command Palette
- Describe the error (e.g., "TypeError: Cannot read property of undefined")

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