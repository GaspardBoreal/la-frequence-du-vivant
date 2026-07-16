import React from 'react';
import { Footprints, Eye, Heart, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { ROLE_CONFIG, CommunityRoleKey } from '@/hooks/useCommunityProfile';
import RoleBadge from './RoleBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const ICONS = { Footprints, Eye, Heart, Shield };

const ALL_ROLES: CommunityRoleKey[] = ['marcheur_en_devenir', 'marcheur', 'eclaireur', 'ambassadeur', 'sentinelle'];

interface ProgressionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: CommunityRoleKey;
  marchesCount: number;
  formationValidee: boolean;
  certificationValidee: boolean;
  pendingCount?: number;
}

const ProgressionSheet: React.FC<ProgressionSheetProps> = ({
  open,
  onOpenChange,
  role,
  marchesCount,
  formationValidee,
  certificationValidee,
  pendingCount = 0,
}) => {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
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

export default ProgressionSheet;
