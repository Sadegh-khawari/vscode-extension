# Project Tech Stack

## Language & runtime
- **TypeScript** (strict mode) — both extension host and backend
- **Node.js** — runtime for the backend/core service

## VSCode Extension
- VSCode Extension API (`vscode` npm module — comes from VSCode itself, no install needed)
- Generator: `yo code` (generator-code) for the initial scaffold
- Bundler: **esbuild** (VSCode's official recommendation for extensions — faster than webpack)
- Packaging/publishing: `@vscode/vsce`

## UI
- **React** — inside the Webview, for the chat/suggestion panel
- Webview ↔ Extension communication via `postMessage` (not HTTP)

## LLM integration
- Official SDK for the chosen provider — one of:
  - `openai` (npm) for the OpenAI API
  - `@anthropic-ai/sdk` (npm) for the Claude API
- Current scope: cloud APIs only, no local-model support

## MCP
- `@modelcontextprotocol/sdk` (npm) — for implementing the MCP client
- Suggested server to start with: the official MCP filesystem server (no need to write a server from scratch)

## Testing
- **Vitest** — unit tests for backend/core logic
- Manual testing in the Extension Development Host (F5) for in-VSCode behavior

## Publishing
- `@vscode/vsce` for packaging and publishing
- Azure DevOps Personal Access Token for publisher authentication

## Versioning
- Semantic Versioning (semver) — `vsce publish patch/minor/major`
