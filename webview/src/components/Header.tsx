import { FC } from 'react';

export interface HeaderProps {
  status: string;
  onExplain?: () => void;
  onFix?: () => void;
  onConfigure?: () => void;
}

export const Header: FC<HeaderProps> = ({ status, onExplain, onFix, onConfigure }) => {
  return (
    <div className="header">
      <strong>LLM Coding Assistant</strong>
      <div className="header-actions">
        {onExplain && (
          <button className="explain-btn" onClick={onExplain} title="Explain selected code">
            Explain Code
          </button>
        )}
        {onFix && (
          <button className="fix-btn" onClick={onFix} title="Fix selected code">
            Fix Code
          </button>
        )}
        {onConfigure && (
          <button className="configure-btn" onClick={onConfigure} title="Configure API settings">
            ⚙
          </button>
        )}
        <div className="status">{status}</div>
      </div>
    </div>
  );
};