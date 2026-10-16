# Project Roadmap — Execution Checklist

This is a sequential phase list, not a calendar. There are no week/day targets — move to the next phase as soon as the current one's exit criteria are met, and don't pace the work to any deadline. Before starting a task, check which boxes are already checked. After finishing a task, check its box before moving on.

Skip nothing except where a phase explicitly says "optional" — Marketplace publishing (Phase 6) is never optional, it's part of the deliverable.

## Phase 1 — Setup & Architecture
- [ ] Scaffold the extension with `yo code` (generator-code), TypeScript template
- [ ] Fill `package.json` with Marketplace fields from the start: `publisher`, `repository`, `categories`, `keywords`, `engines.vscode`, `icon`
- [ ] Create an Azure DevOps publisher account (required for `vsce publish` later) — do this early, it's the one manual/external step in the whole roadmap
- [ ] Build a minimal Node.js backend (just a proxy to one LLM API)
- [ ] Add one extension command that sends a user message to the backend and shows the LLM's reply
- **Exit criteria**: extension runs in the Dev Host and completes one full round-trip to the LLM

## Phase 2 — Context Engine & Code Generation
- [ ] Collect context: current open file + user's text selection
- [ ] Prompt template for code generation
- [ ] Webview panel showing the suggested code with Accept/Reject
- **Exit criteria**: user gives an instruction, code is generated and inserted into the editor

## Phase 3 — Code Explanation & Lightweight Project Analysis
- [ ] Explain code: select a code block → LLM explanation
- [ ] Lightweight project summary: file list + package.json + a few key files, added as context to every request
- **Exit criteria**: the assistant is aware of overall project structure, not just the open file

## Phase 4 — MCP Integration
- [ ] Implement an MCP client connecting to the official filesystem MCP server
- [ ] Wire the LLM to MCP tools agentically (model decides when to read more files)
- **Exit criteria**: the assistant can discover and read related files on its own mid-response

## Phase 5 — Bug Fixing & Polish
- [ ] Bug fixing: take an error/problematic code + surrounding context → suggest a fix
- [ ] UX polish (loading states, error handling, clear error messages)
- **Exit criteria**: all four core features (generate, explain, analyze, fix) work end to end

## Phase 6 — Testing, Docs, Marketplace Publish
- [ ] Manual testing on a few real projects (not just hello-world)
- [ ] `README.md` with a screenshot/GIF demo
- [ ] `LICENSE` and `CHANGELOG.md`
- [ ] 128×128 extension icon
- [ ] `npx vsce package` → test-install the local `.vsix` with `code --install-extension`
- [ ] `npx vsce publish` → publish to the Marketplace
- [ ] Send the install link to the professor
- [ ] Short write-up of architecture decisions (why context window over RAG, why the pre-built MCP filesystem server)
- **Exit criteria**: extension is live on the Marketplace and installable by the professor

## If something has to be cut
Drop in this order, never cutting Phase 6: MCP integration (Phase 4) down to a single `read_file` tool → bug fixing (Phase 5) dropped entirely. Everything else stays.
