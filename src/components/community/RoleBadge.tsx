import React from 'react';
import { Footprints, Eye, Heart, Shield } from 'lucide-react';
import { ROLE_CONFIG, CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ICONS = { Footprints, Eye, Heart, Shield };

interface RoleBadgeProps {
  role: CommunityRoleKey;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', showLabel = true }) => {
  const config = ROLE_CONFIG[role];
  const Icon = ICONS[config.icon];
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color}`}>
      <Icon className={sizeClasses[size]} />
      {showLabel && <span className={`font-medium ${textSizes[size]}`}>{config.label}</span>}
    </div>
  );
};

export default RoleBadge;
