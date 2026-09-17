import { FC } from 'react';

export interface HeaderProps {
  status: string;
  onExplain?: () => void;
}

export const Header: FC<HeaderProps> = ({ status, onExplain }) => {
  return (
    <div className="header">
      <strong>LLM Coding Assistant</strong>
      <div className="header-actions">
        {onExplain && (
          <button className="explain-btn" onClick={onExplain} title="Explain selected code">
            Explain Code
          </button>
        )}
        <div className="status">{status}</div>
      </div>
    </div>
  );
};