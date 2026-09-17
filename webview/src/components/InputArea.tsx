import { useRef } from 'react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
  onGenerate: (instruction: string) => void;
}

export function InputArea({ onSend, disabled, onGenerate }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = e.currentTarget.value.trim();
      if (text && !disabled) {
        onSend(text);
        e.currentTarget.value = '';
        // Reset height
        e.currentTarget.style.height = 'auto';
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize textarea
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
  };

  const handleGenerateClick = () => {
    const textarea = textareaRef.current;
    if (textarea && !disabled) {
      const text = textarea.value.trim();
      if (text) {
        onGenerate(text);
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    }
  };

  return (
    <div className="input-area">
      <div className="input-row">
        <textarea
          ref={textareaRef}
          placeholder="Ask a coding question... (Shift+Enter for new line)"
          onKeyDown={handleKeyDown}
          onChange={handleInput}
          disabled={disabled}
          rows={3}
        />
        <div className="input-buttons">
          <button onClick={handleGenerateClick} disabled={disabled} className="generate-btn">
            Generate Code
          </button>
          <button onClick={() => {
            const textarea = textareaRef.current;
            if (textarea && !disabled) {
              const text = textarea.value.trim();
              if (text) {
                onSend(text);
                textarea.value = '';
                textarea.style.height = 'auto';
              }
            }
          }} disabled={disabled}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}