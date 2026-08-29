import React from 'react';
import { getStaticUrl } from '../../services/api';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl'
  };

  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-brand-gold to-yellow-500 text-deep-navy shadow-md font-bold shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
      {imageUrl ? (
        <img src={getStaticUrl(imageUrl)} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase() || 'U'
      )}
    </div>
  );
};
