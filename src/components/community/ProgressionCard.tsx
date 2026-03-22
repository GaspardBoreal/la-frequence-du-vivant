import React from 'react';
import { motion } from 'framer-motion';
import { Footprints, Eye, Heart, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { ROLE_CONFIG, CommunityRoleKey } from '@/hooks/useCommunityProfile';
import RoleBadge from './RoleBadge';

const ICONS = { Footprints, Eye, Heart, Shield };

interface ProgressionCardProps {
  role: CommunityRoleKey;
  marchesCount: number;
  formationValidee: boolean;
  certificationValidee: boolean;
}

const ALL_ROLES: CommunityRoleKey[] = ['marcheur_en_devenir', 'marcheur', 'eclaireur', 'ambassadeur', 'sentinelle'];

const ProgressionCard: React.FC<ProgressionCardProps> = ({
  role,
  marchesCount,
  formationValidee,
  certificationValidee,
}) => {
  const config = ROLE_CONFIG[role];
  const currentIndex = ALL_ROLES.indexOf(role);

  // Calculate progress to next role
  let progressPercent = 100;
  let progressLabel = '';
  if (config.nextRole && config.nextThreshold) {
    const prevThreshold = currentIndex > 0 ? (ROLE_CONFIG[ALL_ROLES[currentIndex]]?.nextThreshold || 0) : 0;
    const needed = config.nextThreshold;
    progressPercent = Math.min(100, Math.round((marchesCount / needed) * 100));
    progressLabel = `${marchesCount}/${needed} marches`;

    if (config.nextRole === 'ambassadeur' && !formationValidee) {
      progressLabel += ' • Formation requise';
    }
    if (config.nextRole === 'sentinelle' && !certificationValidee) {
      progressLabel += ' • Certification requise';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-6 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Votre rôle actuel</p>
          <RoleBadge role={role} size="lg" />
        </div>
        <div className={`text-4xl font-bold ${config.color}`}>
          {marchesCount}
        </div>
      </div>

      <p className="text-sm text-muted-foreground italic">{config.description}</p>

      {config.nextRole && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressLabel}</span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {ROLE_CONFIG[config.nextRole].label}
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Timeline of all roles */}
      <div className="flex items-center justify-between pt-2">
        {ALL_ROLES.map((r, i) => {
          const rConfig = ROLE_CONFIG[r];
          const Icon = ICONS[rConfig.icon];
          const isActive = i <= currentIndex;
          return (
            <React.Fragment key={r}>
              <div className={`flex flex-col items-center gap-1 ${isActive ? rConfig.color : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? rConfig.bgColor : 'bg-gray-100'} border ${isActive ? rConfig.borderColor : 'border-gray-200'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight max-w-[60px]">
                  {rConfig.label}
                </span>
              </div>
              {i < ALL_ROLES.length - 1 && (
                <ChevronRight className={`w-3 h-3 flex-shrink-0 ${i < currentIndex ? 'text-emerald-400' : 'text-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProgressionCard;
