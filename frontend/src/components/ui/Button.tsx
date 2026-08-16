import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'financial' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    className = '', 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[12px] transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-primary-navy text-white hover:bg-deep-navy shadow-md hover:shadow-lg',
      secondary: 'bg-action-blue text-white hover:bg-blue-700 shadow-md hover:shadow-lg',
      outline: 'border-2 border-border-subtle bg-white text-primary-navy hover:border-primary-navy hover:bg-gray-50',
      ghost: 'bg-transparent text-primary-text hover:bg-gray-100',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
      financial: 'bg-brand-gold text-white hover:bg-yellow-600 shadow-md hover:shadow-lg',
      success: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
    };

    const sizes = {
      sm: 'py-2 px-4 text-sm min-h-[36px]',
      md: 'py-2.5 px-6 text-sm min-h-[44px]',
      lg: 'py-3.5 px-8 text-base min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
