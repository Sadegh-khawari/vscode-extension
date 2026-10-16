# LLM-Based Coding Assistant (VSCode Extension)

## Project overview
A university project — building a VSCode Extension similar to GitHub Copilot that connects to a cloud LLM, uses MCP, and supports code generation, bug fixing, code explanation, and whole-project analysis.
End goal: publish it on the VSCode Marketplace so the professor can install and test it.
Timeline: solo, no fixed weekly schedule — work through the phases back-to-back, don't wait for "next week."

@ROADMAP.md
@TECH_STACK.md

## Architecture
- **Extension Host** (`src/extension.ts` and subfolders) — TypeScript, commands, VSCode API access (open file, selection, workspace).
- **Core Service** (`src/core/`) — Node.js; context building, prompt construction, LLM API calls.
- **MCP Client** (`src/mcp/`) — connects to MCP server(s) for agentic access to the project filesystem.
- **Webview UI** (`webview/`) — React; shows suggestions, chat, Accept/Reject.

## Note on the "local" part of the project topic
"Local" in the project topic means the tool itself and its context-processing run locally (unlike tools that send the full codebase to a server), not that the LLM itself is local.
LLM connectivity is **cloud APIs only** for now (OpenAI/Anthropic/etc.) — local model support (Ollama, etc.) is out of scope for this version.

## Coding rules
- TypeScript in `strict` mode — avoid `any`.
- Every new feature needs at least one test (Vitest).
- Never commit an API key — use `vscode.SecretStorage`, not settings.json or source files.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- `npm run compile` and `npm test` must pass before every commit.

## Common commands
| Command | Purpose |
|---|---|
| `npm run watch` | Auto-compile TypeScript during development |
| `npm test` | Run tests |
| F5 in VSCode | Launch the Extension Development Host for manual testing |
| `npx vsce package` | Build a `.vsix` for testing/publishing |

For VSCode Extension API details and Marketplace publishing steps, see the skill at `.claude/skills/vscode-extension-dev/`.

## Long-term context (background, not a technical constraint)
This project is part of my path toward ML engineering (production-focused); keep architecture explanations and trade-offs clear and defensible for a university presentation.
