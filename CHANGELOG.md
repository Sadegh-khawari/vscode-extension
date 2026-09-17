# Change Log

All notable changes to the "LLM Coding Assistant" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.5] - 2024-09-17

### Added
- Bug fixing feature in webview (select code, click "Fix Code" in header)
- Fix results displayed directly in chat sidebar with Accept/Reject buttons
- "Fix Code" button in webview header when code is selected
- Real-time selection tracking - buttons appear/disappear based on selection

### Changed
- Header now shows "Fix Code" button when applicable
- Improved webview message handling for bug fixes
- Enhanced error messages with clear user guidance
- Added loading states for all operations

### Fixed
- Fixed webview selection state tracking
- Improved error handling in all webview flows

## [0.0.4] - 2024-09-17

### Added
- MCP (Model Context Protocol) integration with filesystem server
- Agentic tool calling - LLM can now discover and read files on its own
- Tool support in LLM service for both Anthropic and OpenAI
- `sendAgenticRequest` in CoreService for multi-turn tool use
- MCP tools converted to LLM function calling format

### Changed
- Chat now uses agentic mode with MCP tools by default
- Updated LLMRequest/Response types to support tools and tool calls
- Updated system prompts for agentic behavior

### Fixed
- Fixed TypeScript types for MCP tool integration
- Fixed Anthropic/OpenAI tool choice type compatibility

## [0.0.3] - 2024-09-17

### Added
- Webview-based code explanation (select code, click "Explain Code" in header)
- Explanation results displayed directly in chat sidebar
- "Explain Code" button in webview header when code is selected

### Changed
- Header now shows "Explain Code" button when applicable
- Improved webview message handling for explanations

### Fixed
- Fixed switch statement in webview message handler

## [0.0.2] - 2024-09-17

### Added
- Webview-based code generation with Accept/Reject buttons
- Code generation directly from chat sidebar
- Inline code block rendering with syntax highlighting
- Generation action buttons (Accept to insert at cursor, Reject to dismiss)

### Changed
- Improved webview UI with dedicated "Generate Code" button
- Code blocks now show language label and original instruction

### Fixed
- N/A

## [0.0.1] - 2024-09-17

### Added
- Initial release of LLM Coding Assistant
- Code generation from natural language instructions
- Code explanation for selected code blocks
- Bug fixing with error descriptions
- Chat interface with project context awareness
- MCP (Model Context Protocol) filesystem integration
- Secure API key storage using VSCode SecretStorage
- Support for Anthropic (Claude) and OpenAI (GPT) APIs
- React-based webview UI in sidebar

### Changed
- N/A

### Fixed
- N/A