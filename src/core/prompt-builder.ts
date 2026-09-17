/**
 * Prompt Builder - Constructs prompts for different LLM tasks
 */

import { CodeContext, ProjectContext, GenerateCodeRequest, ExplainCodeRequest, FixCodeRequest } from './types';
import { contextBuilder } from './context-builder';
import { LLMService } from './llm-service';

export class PromptBuilder {
  buildGeneratePrompt(request: GenerateCodeRequest): string {
    const projectSummary = request.projectContext
      ? contextBuilder.buildProjectSummary(request.projectContext)
      : '';
    const codeContext = contextBuilder.buildCodeContextPrompt(request.context);

    return `${projectSummary}

${codeContext}

## Task
${request.instruction}

## Instructions
- Generate only the code that fulfills the instruction
- Match the style and patterns of the existing codebase
- Include necessary imports
- Use TypeScript strict mode conventions
- Return ONLY the code block`;
  }

  buildExplainPrompt(request: ExplainCodeRequest): string {
    const projectSummary = request.projectContext
      ? contextBuilder.buildProjectSummary(request.projectContext)
      : '';
    const codeContext = contextBuilder.buildCodeContextPrompt(request.context);

    return `${projectSummary}

${codeContext}

## Task
Explain the selected code in detail. Cover:
1. What the code does (high-level summary)
2. How it works (key logic, algorithms, patterns)
3. Important variables, functions, and types
4. Any potential issues, edge cases, or improvements
5. How it fits into the larger codebase (if apparent)

Use clear headings and markdown formatting.`;
  }

  buildFixPrompt(request: FixCodeRequest): string {
    const projectSummary = request.projectContext
      ? contextBuilder.buildProjectSummary(request.projectContext)
      : '';
    const codeContext = contextBuilder.buildCodeContextPrompt(request.context);

    return `${projectSummary}

${codeContext}

## Error/Problem
${request.errorMessage}

## Task
Fix the bug in the code above. Provide:
1. Root cause analysis
2. The fix (minimal, targeted change)
3. Corrected code block

Return the explanation first, then the corrected code in a markdown code block.`;
  }

  buildChatPrompt(messages: Array<{role: string, content: string}>, projectContext?: ProjectContext): string {
    const projectSummary = projectContext
      ? contextBuilder.buildProjectSummary(projectContext)
      : '';

    const conversation = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    return `${projectSummary}

## Conversation
${conversation}

## Task
Continue the conversation as a helpful coding assistant.`;
  }
}

export const promptBuilder = new PromptBuilder();