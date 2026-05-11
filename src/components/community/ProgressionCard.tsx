import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Eye, Heart, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { ROLE_CONFIG, CommunityRoleKey } from '@/hooks/useCommunityProfile';
import RoleBadge from './RoleBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const ICONS = { Footprints, Eye, Heart, Shield };

interface ProgressionCardProps {
  role: CommunityRoleKey;
  marchesCount: number;
  formationValidee: boolean;
  certificationValidee: boolean;
  pendingCount?: number;
}

const ALL_ROLES: CommunityRoleKey[] = ['marcheur_en_devenir', 'marcheur', 'eclaireur', 'ambassadeur', 'sentinelle'];

const ProgressionCard: React.FC<ProgressionCardProps> = ({
  role,
  marchesCount,
  formationValidee,
  certificationValidee,
  pendingCount = 0,
}) => {
  const [open, setOpen] = useState(false);
  const config = ROLE_CONFIG[role];
  const currentIndex = ALL_ROLES.indexOf(role);

  let progressPercent = 100;
  let progressLabel = '';
  if (config.nextRole && config.nextThreshold) {
    const needed = config.nextThreshold;
    progressPercent = Math.min(100, Math.round((marchesCount / needed) * 100));
    progressLabel = `${marchesCount}/${needed} marches`;
    if (config.nextRole === 'ambassadeur' && !formationValidee) progressLabel += ' • Formation requise';
    if (config.nextRole === 'sentinelle' && !certificationValidee) progressLabel += ' • Certification requise';
  }

  const encouragement =
    role === 'marcheur_en_devenir' && pendingCount === 1
      ? "Bravo, votre première marche vous attend ! Chaque pas compte — explorez d'autres sentiers pour enrichir votre parcours."
      : role === 'marcheur_en_devenir' && pendingCount > 1
      ? `Magnifique, ${pendingCount} marches vous attendent ! Vous êtes déjà sur le chemin du Vivant.`
      : pendingCount > 0 && config.nextRole
      ? `${pendingCount} marche${pendingCount > 1 ? 's' : ''} en approche — continuez sur cette belle lancée !`
      : config.description;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="w-full text-left rounded-2xl border border-border bg-card hover:bg-accent/40 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] dark:border-white/15 backdrop-blur-md p-4 transition-colors"
          aria-label="Voir le détail de votre progression"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium shrink-0">
                Rôle
              </span>
              <RoleBadge role={role} size="sm" darkMode />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              {config.nextRole && <span className="font-semibold text-foreground/80">{progressPercent}%</span>}
              {config.nextRole && (
                <span className="hidden sm:inline-flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  {ROLE_CONFIG[config.nextRole].label}
                </span>
              )}
            </div>
          </div>

          {config.nextRole && (
            <div className="relative">
              <div className="h-1 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              {/* Milestone dots */}
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {ALL_ROLES.map((_, i) => {
                  const reached = i <= currentIndex;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ring-2 ${
                        reached
                          ? 'bg-emerald-500 ring-card dark:ring-background'
                          : 'bg-muted-foreground/30 ring-card dark:ring-background'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {progressLabel && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{progressLabel}</span>
              <span className="opacity-60">Voir le détail →</span>
            </div>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Votre progression</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Rôle actuel</p>
              <RoleBadge role={role} size="lg" darkMode />
            </div>
            <div className="text-4xl font-bold text-primary">{marchesCount}</div>
          </div>

          <p className="text-sm text-muted-foreground italic">{encouragement}</p>

          {config.nextRole && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progressLabel}</span>
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  {ROLE_CONFIG[config.nextRole].label}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {ALL_ROLES.map((r, i) => {
              const rConfig = ROLE_CONFIG[r];
              const Icon = ICONS[rConfig.icon];
              const isActive = i <= currentIndex;
              return (
                <React.Fragment key={r}>
                  <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-400/30' : 'bg-muted border-border'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] text-center leading-tight whitespace-nowrap ${r === role ? 'font-bold' : 'font-medium'}`}>
                      {rConfig.label}
                    </span>
                  </div>
                  {i < ALL_ROLES.length - 1 && (
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 ${i < currentIndex ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProgressionCard;
