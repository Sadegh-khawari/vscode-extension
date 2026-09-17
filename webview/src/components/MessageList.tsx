import { Message } from '../App';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
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
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <MarkdownRenderer content={message.content} />
      </div>
      <div className="message-time">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}