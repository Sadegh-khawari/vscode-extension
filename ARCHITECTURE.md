# Architecture Decisions

This document explains the key architectural choices made in the LLM Coding Assistant extension.

## Why Context Window Over RAG?

**Decision:** We use the LLM's native context window with VSCode's workspace context rather than implementing a Retrieval-Augmented Generation (RAG) system.

**Rationale:**
1. **Simplicity:** RAG adds significant infrastructure complexity (embeddings, vector DB, chunking, retrieval). For a university project with a solo developer, this would consume disproportionate time.
2. **Token Budgets Are Growing:** Modern LLMs (Claude Sonnet 5: 200k, GPT-4o: 128k) can hold substantial project context. Our context builder collects: package.json, key config files, file tree, and the active file — typically well under 50k tokens.
3. **Precision Over Recall:** RAG retrieves "relevant" chunks but may miss cross-file relationships. Full context ensures the LLM sees exact imports, types, and patterns.
4. **No Indexing Lag:** Context is always fresh — no re-indexing needed after edits.

**Trade-off:** Won't scale to massive monorepos (>100k lines). For those, a hybrid approach (project summary + RAG for distant files) would be needed.

---

## Why the Pre-built MCP Filesystem Server?

**Decision:** We use the official `@modelcontextprotocol/server-filesystem` rather than building a custom MCP server.

**Rationale:**
1. **Battle-Tested:** The official server handles edge cases (symlinks, permissions, encoding, large files) that a custom implementation would miss.
2. **Standard Protocol:** Using the reference implementation ensures compatibility with the broader MCP ecosystem — other clients can use our server, and we can use other servers.
3. **Security:** The official server includes path validation and sandboxing. Building this correctly from scratch is non-trivial.
4. **Time-to-Value:** Connecting to an existing server took hours; building one would take days/weeks.

**Implementation:** The extension spawns the filesystem server as a subprocess, restricted to the workspace root. The LLM gets tools: `read_file`, `list_dir`, `glob`, `grep` — enabling agentic exploration.

---

## Why Webview Over Tree View / Panel?

**Decision:** React-based Webview in the sidebar (WebviewViewProvider) rather than TreeView or WebviewPanel.

**Rationale:**
1. **Rich Interactivity:** Chat needs streaming responses, code blocks with syntax highlighting, Accept/Reject buttons, markdown rendering — all easier in React.
2. **Sidebar Persistence:** WebviewViewProvider keeps state when hidden; WebviewPanel unloads.
3. **Theming:** CSS variables (`var(--vscode-*)`) give native VSCode look automatically.
4. **Component Reuse:** MessageList, CodeBlock, MarkdownRenderer are reusable React components.

---

## Why Two-Pass Agentic Loop?

**Decision:** `sendAgenticRequest` does: (1) LLM decides tools → (2) execute → (3) send results back for final response.

**Rationale:**
1. **Anthropic/OpenAI Both Support This:** Native function calling handles the loop; we just orchestrate.
2. **MCP Tools Are Dynamic:** Available tools depend on connected servers. Two-pass lets the LLM discover what's available.
3. **Simplicity vs. Streaming:** A full streaming agentic loop (tool calls interleaved with text) is complex. Two-pass covers 90% of use cases with less code.
4. **Error Handling:** Tool failures are caught and fed back to the LLM for recovery.

---

## Secret Storage Over Settings

**Decision:** API keys stored in `vscode.SecretStorage` (OS keychain), not `settings.json` or `globalState`.

**Rationale:**
1. **Security:** SecretStorage encrypts at rest; settings.json is plain text and synced across machines.
2. **Best Practice:** VSCode explicitly recommends this for credentials.
3. **User Trust:** Professors/evaluators will check for this.

---

## TypeScript Strict Mode

**Decision:** `"strict": true` in tsconfig.json, no `any` types.

**Rationale:**
1. **Catch Bugs Early:** LLM API responses, MCP tool schemas, VSCode API callbacks — all benefit from strict typing.
2. **Refactoring Confidence:** Renaming a field in `types.ts` immediately shows all call sites.
3. **University Requirement:** Demonstrates professional engineering practices.

---

## Build Pipeline: esbuild (tsc) + Vite

**Decision:** TypeScript compiler (`tsc`) for extension host, Vite for webview.

**Rationale:**
1. **Extension Host:** `tsc` is VSCode's official recommendation — outputs CommonJS, handles declaration maps, works with `@vscode/test-cli`.
2. **Webview:** Vite provides HMR during development, optimal React bundling, CSS extraction, and CSP-compatible output.
3. **Separation:** Extension and webview have different targets (Node vs Browser), bundler requirements, and dependency trees.

---

## Conventional Commits

**Decision:** `feat:`, `fix:`, `docs:`, `chore:` prefixes enforced by habit.

**Rationale:**
1. **Automated Changelog:** Tools can generate CHANGELOG.md from git history.
2. **Semantic Versioning:** Commit type maps to version bump (feat→minor, fix→patch).
3. **Reviewer Clarity:** Commit message tells you *what kind* of change before reading diff.

---

## Summary

| Decision | Alternative Considered | Why We Chose This |
|----------|------------------------|-------------------|
| Context window | RAG / Embeddings | Simpler, fresher, precise |
| Official MCP server | Custom MCP server | Secure, standard, faster |
| Webview (React) | TreeView / Panel | Rich UI, persistence, theming |
| Two-pass agentic | Streaming agentic | Simpler, handles dynamic tools |
| SecretStorage | settings.json | Security, best practice |
| TypeScript strict | Loose types | Catch bugs, refactor safely |
| tsc + Vite | Webpack / esbuild for both | Right tool per target |
| Conventional Commits | Free-form messages | Automation, clarity |

---

*This architecture write-up is intended for the university project presentation and evaluation.*