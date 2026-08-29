import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';

interface HierarchyNodeCardProps {
  name: string;
  userId: string;
  designation?: string;
  commissionPercentage?: number;
  role?: string;
  directMembersCount?: number;
  totalDescendantsCount?: number;
  isTeamHead?: boolean;
  imageUrl?: string;
}

export const HierarchyNodeCard: React.FC<HierarchyNodeCardProps> = ({
  name,
  userId,
  designation,
  commissionPercentage,
  role,
  directMembersCount = 0,
  totalDescendantsCount = 0,
  isTeamHead = false,
  imageUrl
}) => {
  return (
    <div className={`relative min-w-[260px] max-w-[280px] bg-white rounded-2xl shadow-sm border ${isTeamHead ? 'border-brand-gold shadow-brand-gold/10' : 'border-gray-200'} p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg`}>
      {isTeamHead && (
        <div className="absolute -top-3 bg-brand-gold text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
          Team Head
        </div>
      )}
      
      <div className={`h-16 w-16 mb-3 flex items-center justify-center rounded-full shadow-sm`}>
        <Avatar name={name} imageUrl={imageUrl} size="lg" />
      </div>
      
      <h4 className="text-sm font-black text-deep-navy mb-0.5 truncate w-full px-2" title={name}>{name}</h4>
      <p className="text-xs font-bold text-gray-400 tracking-wider mb-2">{userId}</p>
      
      <div className="flex gap-2 items-center mb-3">
        <Badge variant={isTeamHead ? 'warning' : 'info'} className="text-[10px]">
          {designation || role || 'Member'}
        </Badge>
        {commissionPercentage !== undefined && (
          <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
            {commissionPercentage}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-50 rounded-xl p-2 flex justify-between items-center text-xs border border-gray-100">
        <div className="text-center w-1/2 border-r border-gray-200">
          <p className="font-bold text-gray-400">Direct</p>
          <p className="font-black text-deep-navy text-sm">{directMembersCount}</p>
        </div>
        <div className="text-center w-1/2">
          <p className="font-bold text-gray-400">Total</p>
          <p className="font-black text-deep-navy text-sm">{totalDescendantsCount}</p>
        </div>
      </div>
    </div>
  );
};
