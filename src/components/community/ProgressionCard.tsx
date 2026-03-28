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
  pendingCount?: number;
}

const ALL_ROLES: CommunityRoleKey[] = ['marcheur_en_devenir', 'marcheur', 'eclaireur', 'ambassadeur', 'sentinelle'];

// Dark-theme color mapping for each role
const DARK_COLORS: Record<CommunityRoleKey, { text: string; bg: string; border: string }> = {
  marcheur_en_devenir: { text: 'text-emerald-200/80', bg: 'bg-white/10', border: 'border-white/20' },
  marcheur: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-400/30' },
  eclaireur: { text: 'text-teal-300', bg: 'bg-teal-500/15', border: 'border-teal-400/30' },
  ambassadeur: { text: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-400/30' },
  sentinelle: { text: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-400/30' },
};

const ProgressionCard: React.FC<ProgressionCardProps> = ({
  role,
  marchesCount,
  formationValidee,
  certificationValidee,
  pendingCount = 0,
}) => {
  const config = ROLE_CONFIG[role];
  const dark = DARK_COLORS[role];
  const currentIndex = ALL_ROLES.indexOf(role);

  let progressPercent = 100;
  let progressLabel = '';
  if (config.nextRole && config.nextThreshold) {
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
      className={`rounded-2xl border-2 ${dark.border} bg-white/[0.14] backdrop-blur-lg p-4 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 mb-1">Votre rôle actuel</p>
          <RoleBadge role={role} size="lg" darkMode />
        </div>
        <div className={`text-4xl font-bold ${dark.text}`}>
          {marchesCount}
        </div>
      </div>

      <p className="text-sm text-white/60 italic">
        {role === 'marcheur_en_devenir' && pendingCount === 1
          ? 'Bravo, votre première marche vous attend ! Chaque pas compte — explorez d\'autres sentiers pour enrichir votre parcours.'
          : role === 'marcheur_en_devenir' && pendingCount > 1
          ? `Magnifique, ${pendingCount} marches vous attendent ! Vous êtes déjà sur le chemin du Vivant.`
          : pendingCount > 0 && config.nextRole
          ? `${pendingCount} marche${pendingCount > 1 ? 's' : ''} en approche — continuez sur cette belle lancée !`
          : config.description}
      </p>

      {config.nextRole && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>{progressLabel}</span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {ROLE_CONFIG[config.nextRole].label}
            </span>
          </div>
          <div className="h-2 bg-white/25 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
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
          const rDark = DARK_COLORS[r];
          const rConfig = ROLE_CONFIG[r];
          const Icon = ICONS[rConfig.icon];
          const isActive = i <= currentIndex;
          return (
            <React.Fragment key={r}>
              <div className={`flex flex-col items-center gap-1 ${isActive ? rDark.text : 'text-emerald-200/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? rDark.bg : 'bg-white/5'} border ${isActive ? rDark.border : 'border-white/10'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight max-w-[60px] text-white/70">
                  {rConfig.label}
                </span>
              </div>
              {i < ALL_ROLES.length - 1 && (
                <ChevronRight className={`w-3 h-3 flex-shrink-0 ${i < currentIndex ? 'text-emerald-400' : 'text-emerald-200/20'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProgressionCard;
