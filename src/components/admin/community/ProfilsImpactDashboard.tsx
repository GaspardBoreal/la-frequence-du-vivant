import React from 'react';
import { Card } from '@/components/ui/card';
import { useCommunityImpactAggregates } from '@/hooks/useCommunityImpactAggregates';
import { Users, MapPinned, Sprout, HeartHandshake, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ProfilsWidgets from '@/components/community/profils/ProfilsWidgets';

const Counter: React.FC<{ value: number; label: string; icon: React.ElementType; color: string }> = ({ value, label, icon: Icon, color }) => (
  <Card className="p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
    <div className="relative flex items-start gap-3">
      <div className="rounded-lg p-2" style={{ backgroundColor: `${color}20`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <motion.p
          className="text-3xl font-bold text-foreground tabular-nums"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {value.toLocaleString('fr-FR')}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  </Card>
);

interface ProfilsImpactDashboardProps {
  /** Restreint les agrégats aux participant·e·s d'un événement précis. */
  eventId?: string | null;
}

export const ProfilsImpactDashboard: React.FC<ProfilsImpactDashboardProps> = ({ eventId }) => {
  const { data, isLoading } = useCommunityImpactAggregates(eventId ?? null);

  if (isLoading || !data) {
    return <div className="text-muted-foreground text-sm">Chargement des indicateurs d'impact…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compteurs animés */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Counter value={data.total} label="Marcheur·euse·s" icon={Users} color="hsl(160 60% 45%)" />
        <Counter value={data.territories_count} label="Territoires touchés" icon={MapPinned} color="hsl(40 70% 55%)" />
        <Counter value={data.with_csp} label="Activités renseignées" icon={Sprout} color="hsl(120 45% 45%)" />
        <Counter value={data.with_gender} label="Genres renseignés" icon={HeartHandshake} color="hsl(340 60% 60%)" />
        <Counter value={data.with_birthdate} label="Âges renseignés" icon={Sparkles} color="hsl(280 50% 55%)" />
      </div>

      {/* Widgets factorisés (mêmes 3 cartes utilisées côté communauté) */}
      <ProfilsWidgets data={data} />
    </div>
  );
};

export default ProfilsImpactDashboard;
