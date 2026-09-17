/**
 * Context Builder - Collects context from VSCode editor and workspace
 */

import * as vscode from 'vscode';
import { CodeContext, ProjectContext } from './types';

export class ContextBuilder {
  async getCurrentCodeContext(): Promise<CodeContext | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const selection = editor.selection;

    const fileContent = document.getText();
    const languageId = document.languageId;
    const filePath = document.uri.fsPath;

    let selectionContext: CodeContext['selection'] | undefined;
    if (!selection.isEmpty) {
      const selectedText = document.getText(selection);
      selectionContext = {
        startLine: selection.start.line,
        endLine: selection.end.line,
        selectedText,
      };
    }

    return {
      filePath,
      fileContent,
      selection: selectionContext,
      languageId,
    };
  }

  async getProjectContext(): Promise<ProjectContext> {
    const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) ?? [];

    let packageJson: any = undefined;
    const keyFiles = new Map<string, string>();
    const fileList: string[] = [];

    if (workspaceFolders.length > 0) {
      const rootPath = workspaceFolders[0];

      // Read package.json
      try {
        const packageJsonUri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), 'package.json');
        const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
        packageJson = JSON.parse(packageJsonContent.toString());
      } catch {
        // package.json not found or invalid
      }

      // Get key files (README, tsconfig, etc.)
      const keyFilePatterns = [
        'README.md',
        'README.txt',
        'tsconfig.json',
        'tsconfig.build.json',
        'eslint.config.js',
        'eslint.config.mjs',
        '.prettierrc',
        'vite.config.ts',
        'webpack.config.js',
        'jest.config.js',
        'vitest.config.ts',
      ];

      for (const pattern of keyFilePatterns) {
        try {
          const fileUri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), pattern);
          const content = await vscode.workspace.fs.readFile(fileUri);
          keyFiles.set(pattern, content.toString());
        } catch {
          // File doesn't exist
        }
      }

      // Get file list (limited to relevant files)
      try {
        const files = await vscode.workspace.findFiles(
          '**/*.{ts,js,tsx,jsx,py,java,go,rs,cpp,c,h,json,md}',
          '**/node_modules/**',
          100
        );
        fileList.push(...files.map(f => vscode.workspace.asRelativePath(f)));
      } catch {
        // Ignore errors
      }
    }

    return {
      workspaceFolders,
      packageJson,
      keyFiles,
      fileList,
    };
  }

  buildProjectSummary(projectContext: ProjectContext): string {
    const lines: string[] = ['## Project Context'];

    if (projectContext.workspaceFolders.length > 0) {
      lines.push(`**Workspace:** ${projectContext.workspaceFolders.join(', ')}`);
    }

    if (projectContext.packageJson) {
      const pkg = projectContext.packageJson;
      lines.push(`**Project:** ${pkg.name ?? 'Unknown'} v${pkg.version ?? '0.0.0'}`);
      lines.push(`**Description:** ${pkg.description ?? 'No description'}`);
      if (pkg.dependencies) {
        lines.push(`**Dependencies:** ${Object.keys(pkg.dependencies).join(', ')}`);
      }
      if (pkg.devDependencies) {
        lines.push(`**Dev Dependencies:** ${Object.keys(pkg.devDependencies).join(', ')}`);
      }
    }

    if (projectContext.keyFiles.size > 0) {
      lines.push('\n**Key Files:**');
      for (const [name, content] of projectContext.keyFiles) {
        const preview = content.slice(0, 500).replace(/\n/g, ' ');
        lines.push(`- ${name}: ${preview}${content.length > 500 ? '...' : ''}`);
      }
    }

    if (projectContext.fileList.length > 0) {
      lines.push(`\n**Project Files (${projectContext.fileList.length}):**`);
      lines.push(projectContext.fileList.slice(0, 30).join(', '));
      if (projectContext.fileList.length > 30) {
        lines.push(`... and ${projectContext.fileList.length - 30} more files`);
      }
    }

    return lines.join('\n');
  }

  buildCodeContextPrompt(codeContext: CodeContext): string {
    const lines: string[] = ['## Current File Context'];
    lines.push(`**File:** ${codeContext.filePath}`);
    lines.push(`**Language:** ${codeContext.languageId}`);

    if (codeContext.selection) {
      lines.push(`**Selection:** Lines ${codeContext.selection.startLine + 1}-${codeContext.selection.endLine + 1}`);
      lines.push('\n**Selected Code:**');
      lines.push('```' + codeContext.languageId);
      lines.push(codeContext.selection.selectedText);
      lines.push('```');

      // Also provide surrounding context
      const fileLines = codeContext.fileContent.split('\n');
      const start = Math.max(0, codeContext.selection.startLine - 10);
      const end = Math.min(fileLines.length, codeContext.selection.endLine + 11);
      const surroundingContext = fileLines.slice(start, end).join('\n');
      lines.push('\n**Surrounding Context:**');
      lines.push('```' + codeContext.languageId);
      lines.push(surroundingContext);
      lines.push('```');
    } else {
      lines.push('\n**Full File Content:**');
      lines.push('```' + codeContext.languageId);
      lines.push(codeContext.fileContent);
      lines.push('```');
    }

    return lines.join('\n');
  }
}

export const contextBuilder = new ContextBuilder();