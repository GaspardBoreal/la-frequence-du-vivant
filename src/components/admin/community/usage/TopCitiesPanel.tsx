import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { UsageCity } from '@/hooks/useCommunityUsageDashboard';
import { motion } from 'framer-motion';

interface Props { cities: UsageCity[] }

export const TopCitiesPanel: React.FC<Props> = ({ cities }) => {
  const max = Math.max(...(cities?.map((c) => c.count) ?? [1]), 1);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Territoires touchés
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Top 12 villes des marcheur·euse·s.</p>
      <div className="space-y-1.5">
        {cities?.map((c, i) => (
          <motion.div
            key={c.ville}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-2"
          >
            <div className="w-32 text-xs truncate text-foreground">{c.ville}</div>
            <div className="flex-1 h-4 bg-muted/40 rounded-sm overflow-hidden">
              <div className="h-full rounded-sm" style={{ width: `${(c.count / max) * 100}%`, background: 'hsl(var(--primary))' }} />
            </div>
            <div className="w-8 text-xs text-right tabular-nums text-muted-foreground">{c.count}</div>
          </motion.div>
        ))}
        {(!cities || cities.length === 0) && (
          <p className="text-xs text-muted-foreground">Aucune ville renseignée.</p>
        )}
      </div>
    </Card>
  );
};

export default TopCitiesPanel;
