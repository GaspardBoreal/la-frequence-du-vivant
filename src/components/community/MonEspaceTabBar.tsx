import React from 'react';
import { motion } from 'framer-motion';
import { Home, Map, BookHeart, Compass, Globe, Lock } from 'lucide-react';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';


export type TabKey = 'accueil' | 'marches' | 'carnet' | 'outils' | 'territoire';

const TAB_META: Record<TabKey, { label: string; icon: React.ElementType }> = {
  accueil: { label: 'Accueil', icon: Home },
  marches: { label: 'Marches', icon: Map },
  carnet: { label: 'Carnet', icon: BookHeart },
  outils: { label: 'Outils', icon: Compass },
  territoire: { label: 'Territoire', icon: Globe },
};

const TABS_BY_ROLE: Record<CommunityRoleKey, TabKey[]> = {
  marcheur_en_devenir: ['accueil', 'marches', 'carnet', 'outils'],
  marcheur: ['accueil', 'marches', 'carnet', 'outils'],
  eclaireur: ['accueil', 'marches', 'carnet', 'outils'],
  ambassadeur: ['accueil', 'marches', 'carnet', 'outils'],
  sentinelle: ['accueil', 'marches', 'carnet', 'outils', 'territoire'],
};

interface MonEspaceTabBarProps {
  role: CommunityRoleKey;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  lockedTabs?: TabKey[];
  lockedHint?: string;
}

const MonEspaceTabBar: React.FC<MonEspaceTabBarProps> = ({ role, activeTab, onTabChange, lockedTabs = [], lockedHint }) => {
  const tabs = TABS_BY_ROLE[role];
  const isMobile = useIsMobile();
  const lockedSet = new Set(lockedTabs);

  const handleClick = (key: TabKey) => {
    if (lockedSet.has(key)) {
      toast.info(lockedHint || 'Disponible après votre première marche');
      return;
    }
    onTabChange(key);
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((key) => {
            const { label, icon: Icon } = TAB_META[key];
            const isActive = key === activeTab;
            const locked = lockedSet.has(key);
            return (
                <button
                key={key}
                onClick={() => handleClick(key)}
                aria-disabled={locked}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors relative ${
                  locked ? 'text-muted-foreground/40' : isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {isActive && !locked && (
                  <motion.div
                    layoutId="tab-indicator-mobile"
                    className="absolute -top-1.5 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {locked && <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1.5 text-muted-foreground/60" />}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Desktop: horizontal tabs below header
  return (
    <nav className="sticky top-[52px] z-30 bg-background/60 backdrop-blur-md border-b border-border/20">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((key) => {
          const { label, icon: Icon } = TAB_META[key];
          const isActive = key === activeTab;
          const locked = lockedSet.has(key);
          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              aria-disabled={locked}
              title={locked ? (lockedHint || 'Disponible après votre première marche') : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  locked ? 'text-muted-foreground/40' : isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {locked && <Lock className="w-3 h-3" />}
              {isActive && !locked && (
                <motion.div
                  layoutId="tab-indicator-desktop"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MonEspaceTabBar;

