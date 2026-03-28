import React from 'react';
import { Footprints, Eye, Heart, Shield } from 'lucide-react';
import { ROLE_CONFIG, CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ICONS = { Footprints, Eye, Heart, Shield };

const DARK_BADGE: Record<CommunityRoleKey, { text: string; bg: string; border: string }> = {
  marcheur_en_devenir: { text: 'text-emerald-200', bg: 'bg-white/10', border: 'border-white/20' },
  marcheur: { text: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-400/30' },
  eclaireur: { text: 'text-teal-300', bg: 'bg-teal-500/20', border: 'border-teal-400/30' },
  ambassadeur: { text: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-400/30' },
  sentinelle: { text: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-400/30' },
};

interface RoleBadgeProps {
  role: CommunityRoleKey;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  darkMode?: boolean;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', showLabel = true, darkMode = false }) => {
  const config = ROLE_CONFIG[role];
  const Icon = ICONS[config.icon];
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  const colors = darkMode ? DARK_BADGE[role] : { text: config.color, bg: config.bgColor, border: config.borderColor };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}>
      <Icon className={sizeClasses[size]} />
      {showLabel && <span className={`font-bold ${textSizes[size]}`}>{config.label}</span>}
    </div>
  );
};

export default RoleBadge;
