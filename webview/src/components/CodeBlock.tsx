interface CodeBlockProps {
  language: string;
  code: string;
  instruction: string;
  onAccept: () => void;
  onReject: () => void;
}

export function CodeBlock({ language, code, instruction, onAccept, onReject }: CodeBlockProps) {
  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-label">{language || 'text'}</span>
        <span className="code-block-instruction">{instruction}</span>
        <div className="code-block-actions">
          <button className="accept-btn" onClick={onAccept}>Accept</button>
          <button className="reject-btn" onClick={onReject}>Reject</button>
        </div>
      </div>
      <pre className="code-block">
        <code className={language ? `language-${language}` : ''}>{code}</code>
      </pre>
    </div>
  );
}