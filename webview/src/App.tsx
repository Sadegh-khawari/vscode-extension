import { useState, useEffect, useRef } from 'react';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Header } from './components/Header';
import { useVSCodeAPI } from './hooks/useVSCodeAPI';
import { CodeBlock } from './components/CodeBlock';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: {
    language: string;
    code: string;
    instruction: string;
  };
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
      } else if (message.type === 'code-generated') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: message.payload.explanation || 'Here is the generated code:',
          timestamp: new Date(),
          codeBlock: {
            language: message.payload.language,
            code: message.payload.code,
            instruction: message.payload.instruction,
          },
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

  const handleGenerateCode = (instruction: string) => {
    if (!instruction.trim() || isLoading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate: ${instruction}`,
      timestamp: new Date(),
    }]);
    setIsLoading(true);
    setStatus('Generating...');

    vscode.postMessage({
      type: 'generate',
      payload: { instruction }
    });
  };

  const handleCodeAction = (action: 'accept' | 'reject', codeBlock: Message['codeBlock']) => {
    vscode.postMessage({
      type: 'code-action',
      payload: { action, code: codeBlock?.code, language: codeBlock?.language }
    });
  };

  return (
    <div className="app">
      <Header status={status} />
      <div className="messages-container">
        <MessageList messages={messages} onCodeAction={handleCodeAction} />
        <div ref={messagesEndRef} />
      </div>
      <InputArea onSend={handleSend} disabled={isLoading} onGenerate={handleGenerateCode} />
    </div>
  );
}