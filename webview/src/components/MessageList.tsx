import { Message } from '../App';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CodeBlock } from './CodeBlock';

interface MessageListProps {
  messages: Message[];
  onCodeAction: (action: 'accept' | 'reject', codeBlock: Message['codeBlock'] | Message['fixResult']) => void;
}

export function MessageList({ messages, onCodeAction }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <p>Welcome to LLM Coding Assistant!</p>
        <p>Ask me anything about your code.</p>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map(message => (
        <MessageItem key={message.id} message={message} onCodeAction={onCodeAction} />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  onCodeAction: (action: 'accept' | 'reject', codeBlock: Message['codeBlock'] | Message['fixResult']) => void;
}

function MessageItem({ message, onCodeAction }: MessageItemProps) {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <MarkdownRenderer content={message.content} />
        {message.codeBlock && (
          <CodeBlock
            language={message.codeBlock.language}
            code={message.codeBlock.code}
            instruction={message.codeBlock.instruction}
            onAccept={() => onCodeAction('accept', message.codeBlock)}
            onReject={() => onCodeAction('reject', message.codeBlock)}
          />
        )}
        {message.fixResult && (
          <CodeBlock
            language={message.fixResult.language}
            code={message.fixResult.code}
            instruction={message.fixResult.explanation}
            onAccept={() => onCodeAction('accept', message.fixResult)}
            onReject={() => onCodeAction('reject', message.fixResult)}
          />
        )}
      </div>
      <div className="message-time">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}