import { useState, useEffect, useRef } from 'react';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Header } from './components/Header';
import { useVSCodeAPI } from './hooks/useVSCodeAPI';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const vscode = useVSCodeAPI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'chat-response') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: message.payload.content,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
        setStatus('Ready');
      } else if (message.type === 'error') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Error: ' + message.payload,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
        setStatus('Error');
      }
    });

    // Scroll to bottom on messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }]);
    setIsLoading(true);
    setStatus('Thinking...');

    vscode.postMessage({
      type: 'chat',
      payload: { message: text }
    });
  };

  return (
    <div className="app">
      <Header status={status} />
      <div className="messages-container">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
}