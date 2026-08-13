import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, Infinity as InfinityIcon } from 'lucide-react';
import {
  IOT_AI_QUOTAS, useResetIotAiUsage, useSetIotAiAccess, type IotPartnerRow,
} from '@/hooks/iot/useIotPartnerAdmin';

const monthLabel = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

/**
 * Crédits d'IA de Jardin accordés à un partenaire : interrupteur, paliers de
 * messages (5 · 10 · 50 · 100 · illimité), jauge de consommation du mois et
 * recharge immédiate.
 */
export const AiCreditControl: React.FC<{ row: IotPartnerRow; compact?: boolean }> = ({ row, compact }) => {
  const setAccess = useSetIotAiAccess();
  const reset = useResetIotAiUsage();

  const unlimited = row.ai_quota < 0;
  const used = row.ai_used ?? 0;
  const ratio = unlimited || row.ai_quota === 0 ? 0 : Math.min(1, used / row.ai_quota);
  const remaining = unlimited ? -1 : Math.max(row.ai_quota - used, 0);
  const bar = ratio >= 1 ? 'bg-destructive' : ratio > 0.8 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs font-medium">IA de Jardin</span>
        <Switch
          className="ml-auto"
          checked={row.ai_enabled}
          onCheckedChange={(v) =>
            setAccess.mutate({
              id: row.id,
              ai_enabled: v,
              ...(v && row.ai_quota === 0 ? { ai_quota: 10 } : {}),
            })
          }
        />
      </div>

      {row.ai_enabled && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {IOT_AI_QUOTAS.map((q) => (
              <button
                key={q}
                onClick={() => setAccess.mutate({ id: row.id, ai_quota: q })}
                className={`rounded-full px-2.5 py-0.5 text-[11px] transition ${
                  row.ai_quota === q
                    ? 'bg-emerald-600 text-white'
                    : 'border border-border/70 text-muted-foreground hover:border-emerald-500/60'
                }`}
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => setAccess.mutate({ id: row.id, ai_quota: -1 })}
              title="Illimité"
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] transition ${
                unlimited
                  ? 'bg-emerald-600 text-white'
                  : 'border border-border/70 text-muted-foreground hover:border-emerald-500/60'
              }`}
            >
              <InfinityIcon className="h-3 w-3" />
            </button>
            <span className="ml-1 text-[10px] text-muted-foreground">messages / mois</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
              <div className={`h-full ${bar} transition-all`} style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {unlimited ? `${used} envoyés · illimité` : `${used} / ${row.ai_quota} · ${remaining} restants`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => reset.mutate(row.id)}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Recharger
            </Button>
          </div>

          {!compact && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Renouvellement automatique le {monthLabel()}.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AiCreditControl;
