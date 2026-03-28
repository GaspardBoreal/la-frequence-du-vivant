import React from 'react';
import { motion } from 'framer-motion';
import { Home, Map, BookHeart, Compass, Globe } from 'lucide-react';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

const MonEspaceTabBar: React.FC<MonEspaceTabBarProps> = ({ role, activeTab, onTabChange }) => {
  const tabs = TABS_BY_ROLE[role];
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-950/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map((key) => {
            const { label, icon: Icon } = TAB_META[key];
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors relative ${
                  isActive ? 'text-emerald-300' : 'text-white/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator-mobile"
                    className="absolute -top-1.5 w-5 h-0.5 rounded-full bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5" />
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
    <nav className="sticky top-[88px] z-30 bg-emerald-950/60 backdrop-blur-md border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((key) => {
          const { label, icon: Icon } = TAB_META[key];
          const isActive = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-emerald-300' : 'text-white/50 hover:text-white/70'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator-desktop"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white/80"
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
