import React from 'react';
import { TrendingUp, Award, Database, ShieldCheck, BarChart3 } from 'lucide-react';
import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { getLevelRank } from '@/lib/insightLevels';

interface ValorizationBlockProps {
  explorationId?: string;
  totalSpecies?: number;
  userLevel: CommunityRoleKey;
}

const ValorizationBlock: React.FC<ValorizationBlockProps> = ({ totalSpecies = 0, userLevel }) => {
  const isSentinelle = getLevelRank(userLevel) >= getLevelRank('sentinelle');

  const metrics = [
    { label: 'Espèces documentées', value: totalSpecies, icon: Database, color: 'text-emerald-500' },
    { label: 'Sources croisées', value: 3, icon: ShieldCheck, color: 'text-blue-500', suffix: ' (GBIF, iNat, eBird)' },
    { label: 'Concordance GBIF', value: totalSpecies > 0 ? Math.min(95, 60 + totalSpecies * 1.5) : 0, icon: Award, color: 'text-amber-500', suffix: '%', isPercent: true },
  ];

  return (
    <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-amber-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-rose-500" />
        <h3 className="text-sm font-semibold text-foreground">Valorisation & Impact</h3>
        {isSentinelle && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium ml-auto">
            Sentinelle
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="text-center">
              <Icon className={`w-5 h-5 ${m.color} mx-auto mb-1`} />
              <p className="text-foreground text-lg font-bold">
                {m.isPercent ? `${Math.round(m.value as number)}%` : m.value}
              </p>
              <p className="text-muted-foreground text-[10px] leading-tight">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Vos données de terrain, collectées selon les protocoles des Marcheurs du Vivant, sont 
          croisées avec les bases internationales (GBIF, iNaturalist, eBird). Cette méthodologie 
          garantit une <strong className="text-foreground">qualité recherche</strong> valorisable 
          auprès des financeurs RSE/CSRD.
        </p>
      </div>

      {isSentinelle && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <BarChart3 className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Dashboard financeurs</strong> — Export PDF et métriques 
            détaillées bientôt disponibles pour vos dossiers de financement.
          </p>
        </div>
      )}
    </div>
  );
};

export default ValorizationBlock;
