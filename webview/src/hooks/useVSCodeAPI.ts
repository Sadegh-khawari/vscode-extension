interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let cachedApi: VSCodeAPI | null = null;

function getVSCodeAPI(): VSCodeAPI {
  if (!cachedApi) {
    cachedApi = acquireVsCodeApi();
  }
  return cachedApi;
}

/**
 * Returns the VS Code webview API handle.
 *
 * Acquired synchronously (not in useEffect) so it is available on the very
 * first render — otherwise click handlers created during that render close
 * over `null` and silently do nothing until a state change re-renders.
 */
export function useVSCodeAPI(): VSCodeAPI {
  return getVSCodeAPI();
}
