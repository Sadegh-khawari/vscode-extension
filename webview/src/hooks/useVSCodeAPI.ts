import { useEffect, useRef } from 'react';

export function useVSCodeAPI() {
  const vscodeRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore - acquireVsCodeApi is provided by VS Code webview
    vscodeRef.current = acquireVsCodeApi();
  }, []);

  return vscodeRef.current;
}