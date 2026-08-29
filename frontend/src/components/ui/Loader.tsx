import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: number;
  className?: string;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 24, className = '', text }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-action-blue" />
      {text && <span className="mt-2 text-sm text-muted-text">{text}</span>}
    </div>
  );
};
