import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  padding = 'md', 
  className = '', 
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  return (
    <div 
      className={`bg-card-surface rounded-[20px] border border-border-subtle shadow-[0_2px_10px_rgba(32,59,115,0.04)] ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
