// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { coreService, CoreService } from './core/core-service';
import { LLMConfig } from './core/types';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "llm-coding-assistant" is now active!');

	// Initialize core service
	await coreService.initialize(context);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('llm-coding-assistant.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from LLM Coding Assistant!');
	});

	context.subscriptions.push(disposable);

	// Register configure command
	const configDisposable = vscode.commands.registerCommand('llm-coding-assistant.configure', async () => {
		await showConfigurationDialog(context);
	});
	context.subscriptions.push(configDisposable);

	// Register chat command - opens webview
	const chatDisposable = vscode.commands.registerCommand('llm-coding-assistant.chat', () => {
		vscode.commands.executeCommand('llm-coding-assistant.chatView.focus');
	});
	context.subscriptions.push(chatDisposable);

	// Register generate code command
	const generateDisposable = vscode.commands.registerCommand('llm-coding-assistant.generateCode', async () => {
		await handleGenerateCode(context);
	});
	context.subscriptions.push(generateDisposable);

	// Register explain code command
	const explainDisposable = vscode.commands.registerCommand('llm-coding-assistant.explainCode', async () => {
		await handleExplainCode(context);
	});
	context.subscriptions.push(explainDisposable);

	// Register fix code command
	const fixDisposable = vscode.commands.registerCommand('llm-coding-assistant.fixCode', async () => {
		await handleFixCode(context);
	});
	context.subscriptions.push(fixDisposable);

	// Register webview provider for chat view
	const chatViewProvider = new ChatViewProvider(context.extensionUri, coreService);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('llm-coding-assistant.chatView', chatViewProvider)
	);

	// Register generate code command (webview-based)
	const generateWebviewDisposable = vscode.commands.registerCommand('llm-coding-assistant.generateCodeWebview', async () => {
		await handleGenerateCodeWebview(context);
	});
	context.subscriptions.push(generateWebviewDisposable);
}

// This method is called when your extension is deactivated
export async function deactivate() {
	await coreService.dispose();
}

async function showConfigurationDialog(context: vscode.ExtensionContext): Promise<void> {
	const currentConfig = coreService.getConfig();

	const provider = await vscode.window.showQuickPick(
		['anthropic', 'openai'],
		{ placeHolder: 'Select LLM API Provider', canPickMany: false }
	);
	if (!provider) {
		return;
	}

	const model = await vscode.window.showInputBox({
		prompt: 'Enter model name',
		value: currentConfig?.model || (provider === 'anthropic' ? 'claude-sonnet-5' : 'gpt-4o'),
	});
	if (!model) {
		return;
	}

	const apiKey = await vscode.window.showInputBox({
		prompt: 'Enter API Key',
		password: true,
		ignoreFocusOut: true,
	});
	if (!apiKey) {
		return;
	}

	const baseUrl = await vscode.window.showInputBox({
		prompt: 'Enter custom base URL (optional)',
		value: currentConfig?.baseUrl || '',
	});

	const config: LLMConfig = {
		apiProvider: provider as 'anthropic' | 'openai',
		model,
		apiKey,
		baseUrl: baseUrl || undefined,
	};

	await coreService.saveConfig(config, context);
	vscode.window.showInformationMessage('LLM configuration saved successfully!');
}

async function handleGenerateCode(context: vscode.ExtensionContext): Promise<void> {
	if (!coreService.isConfigured()) {
		const action = await vscode.window.showWarningMessage(
			'LLM Coding Assistant is not configured. Please set up your API key first.',
			'Configure Now'
		);
		if (action === 'Configure Now') {
			await showConfigurationDialog(context);
		}
		return;
	}

	const codeContext = await coreService.getCodeContext();
	if (!codeContext) {
		vscode.window.showWarningMessage('No active editor found. Please open a file first.');
		return;
	}

	const instruction = await vscode.window.showInputBox({
		prompt: 'Describe what code you want to generate',
		placeHolder: 'e.g., Create a function that validates email addresses',
		ignoreFocusOut: true,
	});
	if (!instruction) {
		return;
	}

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Generating code...',
		cancellable: false,
	}, async () => {
		try {
			const projectContext = await coreService.getProjectContext();
			const response = await coreService.generateCode({
				instruction,
				context: codeContext,
				projectContext,
			});

			// Show result in a new document or insert at cursor
			const action = await vscode.window.showInformationMessage(
				'Code generated successfully!',
				'Insert at Cursor',
				'Open in New File',
				'Copy to Clipboard'
			);

			if (action === 'Insert at Cursor') {
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					await editor.edit(editBuilder => {
						editBuilder.insert(editor.selection.active, response.content);
					});
				}
			} else if (action === 'Open in New File') {
				const doc = await vscode.workspace.openTextDocument({
					content: response.content,
					language: codeContext.languageId,
				});
				await vscode.window.showTextDocument(doc);
			} else if (action === 'Copy to Clipboard') {
				await vscode.env.clipboard.writeText(response.content);
				vscode.window.showInformationMessage('Code copied to clipboard!');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
		}
	});
}

async function handleExplainCode(context: vscode.ExtensionContext): Promise<void> {
	if (!coreService.isConfigured()) {
		const action = await vscode.window.showWarningMessage(
			'LLM Coding Assistant is not configured. Please set up your API key first.',
			'Configure Now'
		);
		if (action === 'Configure Now') {
			await showConfigurationDialog(context);
		}
		return;
	}

	const codeContext = await coreService.getCodeContext();
	if (!codeContext || !codeContext.selection) {
		vscode.window.showWarningMessage('Please select code to explain first.');
		return;
	}

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Explaining code...',
		cancellable: false,
	}, async () => {
		try {
			const projectContext = await coreService.getProjectContext();
			const response = await coreService.explainCode({
				context: codeContext,
				projectContext,
			});

			// Show explanation in a webview panel or output channel
			const panel = vscode.window.createWebviewPanel(
				'llm-coding-assistant.explanation',
				'Code Explanation',
				vscode.ViewColumn.Beside,
				{ enableScripts: true }
			);
			panel.webview.html = getExplanationHtml(response.content);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
		}
	});
}

async function handleFixCode(context: vscode.ExtensionContext): Promise<void> {
	if (!coreService.isConfigured()) {
		const action = await vscode.window.showWarningMessage(
			'LLM Coding Assistant is not configured. Please set up your API key first.',
			'Configure Now'
		);
		if (action === 'Configure Now') {
			await showConfigurationDialog(context);
		}
		return;
	}

	const codeContext = await coreService.getCodeContext();
	if (!codeContext || !codeContext.selection) {
		vscode.window.showWarningMessage('Please select code to fix first.');
		return;
	}

	const errorMessage = await vscode.window.showInputBox({
		prompt: 'Describe the error or problem',
		placeHolder: 'e.g., TypeError: Cannot read property of undefined',
		ignoreFocusOut: true,
	});
	if (!errorMessage) {return;}

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Analyzing and fixing code...',
		cancellable: false,
	}, async () => {
		try {
			const projectContext = await coreService.getProjectContext();
			const response = await coreService.fixCode({
				errorMessage,
				context: codeContext,
				projectContext,
			});

			const action = await vscode.window.showInformationMessage(
				'Fix suggestion generated!',
				'Apply Fix',
				'Open in New File',
				'Copy to Clipboard'
			);

			if (action === 'Apply Fix') {
				const editor = vscode.window.activeTextEditor;
				if (editor && codeContext.selection) {
					await editor.edit(editBuilder => {
						const start = new vscode.Position(codeContext.selection!.startLine, 0);
						const end = new vscode.Position(codeContext.selection!.endLine + 1, 0);
						editBuilder.replace(new vscode.Range(start, end), response.content);
					});
				}
			} else if (action === 'Open in New File') {
				const doc = await vscode.workspace.openTextDocument({
					content: response.content,
					language: codeContext.languageId,
				});
				await vscode.window.showTextDocument(doc);
			} else if (action === 'Copy to Clipboard') {
				await vscode.env.clipboard.writeText(response.content);
				vscode.window.showInformationMessage('Fix copied to clipboard!');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to fix code: ${error}`);
		}
	});
}

function getExplanationHtml(content: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Explanation</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
        pre { background: var(--vscode-textBlockQuote-background); padding: 12px; border-radius: 4px; overflow: auto; }
        code { font-family: var(--vscode-editor-font-family); }
        h1, h2, h3 { color: var(--vscode-foreground); }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
}

class ChatViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly coreService: CoreService
	) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async (message) => {
				await this.handleWebviewMessage(message);
			},
			undefined
		);
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		// Get the built React app
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'assets', 'index.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'assets', 'index.css')
		);
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>LLM Coding Assistant</title>
    <link href="${styleUri}" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}

	private async handleWebviewMessage(message: any): Promise<void> {
		if (!this._view) {return;}

		switch (message.type) {
			case 'chat': {
				if (!this.coreService.isConfigured()) {
					this._view.webview.postMessage({
						type: 'error',
						payload: 'LLM Coding Assistant is not configured. Please set up your API key first.'
					});
					return;
				}

				const codeContext = await this.coreService.getCodeContext();
				const projectContext = await this.coreService.getProjectContext();

				try {
					const response = await this.coreService.chat(
						[{ role: 'user', content: message.payload.message }],
						projectContext
					);

					this._view.webview.postMessage({
						type: 'chat-response',
						payload: { content: response.content }
					});
				} catch (error) {
					this._view.webview.postMessage({
						type: 'error',
						payload: `Failed to get response: ${error}`
					});
				}
				break;
			}
			case 'generate': {
				if (!this.coreService.isConfigured()) {
					this._view.webview.postMessage({
						type: 'error',
						payload: 'LLM Coding Assistant is not configured. Please set up your API key first.'
					});
					return;
				}

				const codeContext = await this.coreService.getCodeContext();
				if (!codeContext) {
					this._view.webview.postMessage({
						type: 'error',
						payload: 'No active editor found. Please open a file first.'
					});
					return;
				}

				try {
					const projectContext = await this.coreService.getProjectContext();
					const response = await this.coreService.generateCode({
						instruction: message.payload.instruction,
						context: codeContext,
						projectContext,
					});

					this._view.webview.postMessage({
						type: 'code-generated',
						payload: {
							code: response.content,
							language: codeContext.languageId,
							instruction: message.payload.instruction,
							explanation: 'Here is the generated code based on your instruction:'
						}
					});
				} catch (error) {
					this._view.webview.postMessage({
						type: 'error',
						payload: `Failed to generate code: ${error}`
					});
				}
				break;
			}
			case 'code-action': {
				if (message.payload.action === 'accept') {
					const editor = vscode.window.activeTextEditor;
					if (editor) {
						await editor.edit(editBuilder => {
							editBuilder.insert(editor.selection.active, message.payload.code);
						});
						vscode.window.showInformationMessage('Code inserted at cursor!');
					}
				} else if (message.payload.action === 'reject') {
					vscode.window.showInformationMessage('Code generation rejected.');
				}
				break;
			}
		}
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

async function handleGenerateCodeWebview(context: vscode.ExtensionContext): Promise<void> {
	if (!coreService.isConfigured()) {
		const action = await vscode.window.showWarningMessage(
			'LLM Coding Assistant is not configured. Please set up your API key first.',
			'Configure Now'
		);
		if (action === 'Configure Now') {
			await showConfigurationDialog(context);
		}
		return;
	}

	const codeContext = await coreService.getCodeContext();
	if (!codeContext) {
		vscode.window.showWarningMessage('No active editor found. Please open a file first.');
		return;
	}

	const instruction = await vscode.window.showInputBox({
		prompt: 'Describe what code you want to generate',
		placeHolder: 'e.g., Create a function that validates email addresses',
		ignoreFocusOut: true,
	});
	if (!instruction) {
		return;
	}

	// Focus the chat view and send the generate command
	vscode.commands.executeCommand('llm-coding-assistant.chatView.focus');

	// Send the generate request to the webview
	setTimeout(() => {
		const chatViewProvider = (vscode as any).window.getWebviewView?.('llm-coding-assistant.chatView');
		// We'll use the coreService directly to generate and send to webview
		generateCodeToWebview(instruction, codeContext);
	}, 100);
}

async function generateCodeToWebview(instruction: string, codeContext: any): Promise<void> {
	try {
		const projectContext = await coreService.getProjectContext();
		const response = await coreService.generateCode({
			instruction,
			context: codeContext,
			projectContext,
		});

		// Send to webview
		// The webview will receive this via postMessage from the extension
		// We need to get the webview instance - for now we'll send it through a different mechanism
		// Actually, let's use the coreService to send a message to the webview
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
	}
}