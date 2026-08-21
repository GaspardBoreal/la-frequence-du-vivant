import React from 'react';
import { ChevronDown, LineChart, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RuleConstellation from '@/components/iot/alerts/RuleConstellation';
import AnomalySparkline from '@/components/iot/alerts/AnomalySparkline';
import SensorObservatory from '@/components/iot/SensorObservatory';
import { useIotAnomalies, type AnomalyFilters } from '@/hooks/iot/useIotAnomalies';
import { useAllCapteursGeo } from '@/hooks/iot/useIotTelemetry';
import { fenetreObservatoire, GRAVITE_LABEL, regleMeta, type IotAlerte, type RegleKey } from '@/lib/iot/anomalies';

const PARIS = 'Europe/Paris';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    timeZone: PARIS, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

const tonDe = (g: IotAlerte['gravite']) =>
  g === 'critique' ? 'bg-destructive' : g === 'surveiller' ? 'bg-primary' : 'bg-muted-foreground';

/** Onglet « Alertes » : les valeurs réellement bizarres de la période. */
export const AlertsPanel: React.FC<AnomalyFilters & { periodeLabel: string }> = ({ periodeLabel, ...filtres }) => {
  const { data, isFetching } = useIotAnomalies(filtres);
  const { data: capteursGeo = [] } = useAllCapteursGeo();

  const [regle, setRegle] = React.useState<RegleKey | null>(null);
  const [ouvert, setOuvert] = React.useState<string | null>(null);
  const [observatoire, setObservatoire] = React.useState<{ capteur: any; from: string; to: string } | null>(null);

  const alertes = data?.alertes ?? [];
  const visibles = regle ? alertes.filter((a) => a.regle === regle) : alertes;

  /** Seuil concret par règle, tiré de la première alerte rencontrée. */
  const exemples = React.useMemo(() => {
    const out: Partial<Record<RegleKey, string>> = {};
    alertes.forEach((a) => { if (!out[a.regle]) out[a.regle] = a.seuil; });
    return out;
  }, [alertes]);

  const controles = data?.controles ?? 0;
  const signales = data?.signales ?? 0;
  const partSaine = controles ? Math.max(0, 100 - (signales / controles) * 100) : 100;

  const ouvrirObservatoire = (a: IotAlerte) => {
    const capteur = capteursGeo.find((c: any) => c.id === a.capteurId);
    if (!capteur) return;
    const { from, to } = fenetreObservatoire(a);
    setObservatoire({ capteur, from, to });
  };

  const counts = data?.parRegle ?? ({} as Record<RegleKey, number>);

  return (
    <section className="space-y-3">
      {/* Constellation des veilles */}
      <RuleConstellation counts={counts} actif={regle} onToggle={setRegle} exemples={exemples} />

      {/* Les règles, lisibles sans chercher */}
      <RulesLegend ouvert={legende} onToggle={setLegende} counts={counts} exemples={exemples} />

      {/* Bande de contrôle */}
      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{controles.toLocaleString('fr-FR')}</span> relevés contrôlés ·
          <span className="tabular-nums">{data?.sondes ?? 0}</span> sonde{(data?.sondes ?? 0) > 1 ? 's' : ''} ·
          <span>{periodeLabel}</span> · {REGLES.length} règles appliquées
          {isFetching && <span className="italic">· analyse en cours…</span>}
          {data?.truncated && <span className="italic">· lecture plafonnée sur les sondes les plus bavardes</span>}
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-primary/70" style={{ width: `${partSaine}%` }} />
          <div className="bg-destructive/70" style={{ width: `${100 - partSaine}%` }} />
        </div>
      </div>

      {/* Liste */}
      {visibles.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">
              {regle ? `Aucune alerte « ${regleMeta(regle).nom} » sur la période.` : 'Aucune valeur suspecte sur la période.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Toutes les valeurs de la période tiennent dans leur domaine — {controles.toLocaleString('fr-FR')} relevés contrôlés.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {visibles.map((a) => {
            const meta = regleMeta(a.regle);
            const open = ouvert === a.id;
            return (
              <div key={a.id} className="text-sm">
                <button
                  onClick={() => setOuvert(open ? null : a.id)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-muted/40"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tonDe(a.gravite))} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{a.capteurNom}</span>
                      <span className="text-xs text-muted-foreground">{a.grandeurLabel}</span>
                      <Badge variant="secondary" className="h-5 text-[10px] font-normal">{meta.nom}</Badge>
                      {a.maintenance && <Badge variant="outline" className="h-5 text-[10px] font-normal">sonde en maintenance</Badge>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {fmt(a.debut)} → {fmt(a.fin)} · <span className="font-medium text-foreground">{a.valeur}</span>
                      {a.occurrences > 1 ? ` · ${a.occurrences} occurrences` : ''}
                    </span>
                  </span>
                  <AnomalySparkline
                    serie={a.serie}
                    tone={a.gravite === 'critique' ? 'destructive' : 'warning'}
                    className="hidden h-[34px] w-[110px] shrink-0 sm:block"
                  />
                  <ChevronDown className={cn('mt-1 h-3.5 w-3.5 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="space-y-2 border-t border-border bg-muted/20 px-3 py-3">
                    <AnomalySparkline
                      serie={a.serie}
                      tone={a.gravite === 'critique' ? 'destructive' : 'warning'}
                      className="h-[44px] w-full sm:hidden"
                    />
                    <p className="text-xs leading-relaxed">{a.commentaire}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {GRAVITE_LABEL[a.gravite]} · {a.seuil}
                    </p>
                    {a.capteurId && (
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => ouvrirObservatoire(a)}>
                        <LineChart className="mr-1.5 h-3.5 w-3.5" /> Voir dans l'Observatoire
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {observatoire && (
        <SensorObservatory
          capteur={observatoire.capteur}
          initialFrom={observatoire.from}
          initialTo={observatoire.to}
          onClose={() => setObservatoire(null)}
        />
      )}
    </section>
  );
};

export default AlertsPanel;
