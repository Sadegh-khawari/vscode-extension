interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown rendering - in production you might want to use a library like react-markdown
  const parts = content.split(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g);

  return (
    <div className="markdown-content">
      {parts.map((part, index) => {
        // Code blocks
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const language = lines[0].slice(3).trim();
          const code = lines.slice(1, -1).join('\n');
          return (
            <pre key={index} className="code-block">
              <code className={language ? `language-${language}` : ''}>{code}</code>
            </pre>
          );
        }
        // Inline code
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={index} className="inline-code">{part.slice(1, -1)}</code>;
        }
        // Regular text - convert line breaks to <br>
        return <span key={index}>{part.split('\n').map((line, i) => i > 0 && <br key={i} /> || line)}</span>;
      })}
    </div>
  );
}