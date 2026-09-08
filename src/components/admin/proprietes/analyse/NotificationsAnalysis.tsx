import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell } from 'lucide-react';
import type { NotificationRule } from '@/lib/onboardingSegments';

const VALEUR_STYLE: Record<NotificationRule['valeur'], string> = {
  utile: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  inspirant: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  rassurant: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
};

/** 3. Le système de notifications : utile, inspirant, jamais envahissant. */
const NotificationsAnalysis: React.FC<{
  rules: NotificationRule[];
  fragiles: string[];
}> = ({ rules, fragiles }) => (
  <div className="space-y-4">
    {fragiles.length > 0 && (
      <Card className="flex items-start gap-3 border-amber-500/40 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-muted-foreground">
          Attention à la sur-sollicitation pour <span className="font-medium text-foreground">{fragiles.join(', ')}</span> :
          deux heures par semaine ou moins. Une notification par semaine au maximum, et jamais deux le même jour.
        </p>
      </Card>
    )}
    <div className="grid gap-3 lg:grid-cols-2">
      {rules.map((r) => (
        <Card key={r.moment} className="p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <h4 className="text-sm font-semibold">{r.moment}</h4>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${VALEUR_STYLE[r.valeur]}`}>
              {r.valeur}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{r.signal}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
            <Badge variant="outline" className="font-normal">Donnée : {r.donnee}</Badge>
            <Badge variant="outline" className="font-normal">Fréquence : {r.frequence}</Badge>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Pour : {r.personae.join(' · ')}</p>
        </Card>
      ))}
    </div>
  </div>
);

export default NotificationsAnalysis;
