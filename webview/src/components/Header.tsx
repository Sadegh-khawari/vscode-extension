import { FC } from 'react';

export interface HeaderProps {
  status: string;
}

export const Header: FC<HeaderProps> = ({ status }) => {
  return (
    <div className="header">
      <strong>LLM Coding Assistant</strong>
      <div className="status">{status}</div>
    </div>
  );
};