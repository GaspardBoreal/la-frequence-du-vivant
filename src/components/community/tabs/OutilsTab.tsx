import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, Brain, Volume2, Flower2, Compass, CloudSun, Lock } from 'lucide-react';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import ZonesTab from './ZonesTab';
import QuizTab from './QuizTab';
import PlaceholderTab from './PlaceholderTab';

const ROLE_RANK: Record<CommunityRoleKey, number> = {
  marcheur_en_devenir: 0,
  marcheur: 1,
  eclaireur: 2,
  ambassadeur: 3,
  sentinelle: 4,
};

interface ToolDef {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  minRole?: CommunityRoleKey;
  comingSoon?: boolean;
}

const TOOLS: ToolDef[] = [
  { id: 'zones', label: 'Zones', description: 'Cartographie des zones de marche', icon: Radar },
  { id: 'quiz', label: 'Quiz', description: 'Testez vos connaissances', icon: Brain },
  { id: 'sons', label: 'Sons', description: 'Écoute bioacoustique', icon: Volume2, minRole: 'eclaireur' },
  { id: 'kigo', label: 'Kigo', description: 'Mots de saison japonais', icon: Flower2, minRole: 'ambassadeur' },
  { id: 'boussole', label: 'Boussole', description: 'Orientation terrain', icon: Compass, comingSoon: true },
  { id: 'meteo', label: 'Météo', description: 'Conditions & phénologie', icon: CloudSun, comingSoon: true },
];

interface OutilsTabProps {
  role: CommunityRoleKey;
  userId: string;
}

const OutilsTab: React.FC<OutilsTabProps> = ({ role, userId }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const userRank = ROLE_RANK[role];

  if (activeTool) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveTool(null)}
          className="text-sm text-emerald-700 dark:text-emerald-300/70 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          ← Retour aux outils
        </button>
        {activeTool === 'zones' && <ZonesTab />}
        {activeTool === 'quiz' && <QuizTab role={role} userId={userId} />}
        {(activeTool === 'sons' || activeTool === 'kigo') && <PlaceholderTab type={activeTool as any} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Mes outils
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Instruments pédagogiques et pratiques du marcheur</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map((tool) => {
          const locked = tool.comingSoon || (tool.minRole && userRank < ROLE_RANK[tool.minRole]);
          const Icon = tool.icon;

          return (
            <motion.button
              key={tool.id}
              whileTap={locked ? undefined : { scale: 0.97 }}
              onClick={() => !locked && setActiveTool(tool.id)}
              className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border text-center transition-all ${
                locked
                  ? 'bg-gray-50 border-gray-200 dark:bg-white/[0.04] dark:border-white/5 opacity-40 cursor-not-allowed'
                  : 'bg-card border-border hover:bg-emerald-50 hover:border-emerald-300 dark:bg-white/[0.08] dark:border-white/10 dark:hover:bg-white/[0.12] dark:hover:border-emerald-400/20 cursor-pointer'
              }`}
            >
              {locked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                locked ? 'bg-gray-100 dark:bg-white/5' : 'bg-emerald-100 dark:bg-emerald-400/10'
              }`}>
                <Icon className={`w-5 h-5 ${locked ? 'text-gray-400 dark:text-white/30' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${locked ? 'text-gray-400 dark:text-white/30' : 'text-foreground'}`}>{tool.label}</p>
                <p className={`text-[11px] mt-0.5 ${locked ? 'text-gray-300 dark:text-white/20' : 'text-muted-foreground'}`}>
                  {tool.comingSoon ? 'Bientôt disponible' : tool.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default OutilsTab;
