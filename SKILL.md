---
name: vscode-extension-dev
description: Use this skill whenever building, testing, or debugging the VSCode extension in this project — running the Extension Development Host, working with the VSCode Extension API, debugging the MCP client, or packaging/publishing with vsce to the Marketplace.
---

# VSCode Extension Development Workflow

## Debug/test loop
1. Run `npm run watch` in one terminal to keep TypeScript compiling continuously.
2. Press F5 (or Run > Start Debugging) to launch the **Extension Development Host** — a second VSCode window with the extension loaded.
3. Reproduce the feature manually in the Dev Host window.
4. Check the Debug Console in the main window for extension logs and errors.
5. After any change to `package.json` (commands, contributes, activation events), reload the Dev Host window (Cmd/Ctrl+R) — `watch` alone doesn't pick up manifest changes.

## Common VSCode API patterns for this project
- Register commands in `extension.ts`'s `activate()`; dispose them in `deactivate()`.
- Use `vscode.window.activeTextEditor` to get the open file and current selection for context.
- Use `vscode.workspace.findFiles` for lightweight project analysis — respect `.gitignore` (pass an exclude glob).
- Use the Webview API (`vscode.window.createWebviewPanel`) to host the React UI; communicate via `postMessage`, not HTTP.
- Store API keys with `vscode.SecretStorage` — never in `settings.json` or source files.

## MCP debugging
- Verify the MCP client connects to the configured server *before* debugging a feature — a broken MCP connection looks like an LLM/prompt bug but isn't.
- Log MCP tool calls (name + arguments) during development to trace what context the model requested.
- Strip verbose MCP/debug logging before packaging for a Marketplace release.

## Packaging for the Marketplace
1. Confirm `package.json` has: `publisher`, `repository`, `icon` (128×128 PNG), `categories`, `keywords`, `engines.vscode`.
2. `npx vsce login <publisher>` — requires a Personal Access Token from Azure DevOps.
3. `npx vsce package` to produce a local `.vsix`. Test-install it before publishing:
   `code --install-extension <name>.vsix`
4. `npx vsce publish` (or `npx vsce publish patch|minor|major` to bump the version and publish in one step).

## Before marking a ROADMAP.md item done
Run `npm run compile` and `npm test`; both must pass. Then update the corresponding checkbox in `ROADMAP.md`.
