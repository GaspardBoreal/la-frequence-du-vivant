import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Inbox, MoonStar, Radio, Send, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import HourMesuresWidget from '@/components/iot/HourMesuresWidget';
import DeliveryJournal from '@/components/iot/DeliveryJournal';
import {
  useAllCapteurs, useTelemetryCounters, useTelemetryDeliveries, useTelemetryLive, useTelemetryPings, useTestDelivery,
} from '@/hooks/iot/useIotTelemetry';
import { useIotConsole } from '@/components/iot/console/IotConsoleContext';


const fmtAgo = (iso?: string | null) => {
  if (!iso) return 'jamais';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
};

const Tile: React.FC<{ icon: React.ReactNode; value: number | string; label: string; tone?: string }> = ({ icon, value, label, tone = 'text-emerald-700' }) => (
  <div className="rounded-xl border border-border bg-card px-3 py-2.5">
    <div className={`flex items-center gap-1.5 text-xs ${tone}`}>{icon}<span className="truncate">{label}</span></div>
    <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
  </div>
);

/** Poste de contrôle : voir à l'œil que la télémétrie arrive vraiment. */
export const TelemetryControl: React.FC = () => {
  const { capabilities, label: scopeLabel, chrome } = useIotConsole();
  const { data: capteurs = [] } = useAllCapteurs();
  const { data: deliveries = [] } = useTelemetryDeliveries(200);
  const capteurIds = React.useMemo(() => capteurs.map((c: any) => c.id), [capteurs]);
  const { data: pings = [] } = useTelemetryPings(48, capteurIds);
  const { lastLiveAt, live } = useTelemetryLive();
  const counters = useTelemetryCounters(deliveries, capteurs);
  const test = useTestDelivery();


  const pingsByCapteur = React.useMemo(() => {
    const m: Record<string, string[]> = {};
    pings.forEach((p) => { (m[p.capteur_id] ??= []).push(p.mesure_at); });
    return m;
  }, [pings]);

  return (
    <div className="space-y-6">
      {/* Bandeau direct */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950 px-5 py-4 text-emerald-50">
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative flex h-3 w-3">
            {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${live ? 'bg-emerald-300' : 'bg-emerald-700'}`} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              {live ? 'Signal reçu en direct' : 'En écoute de la passerelle'}
            </div>
            <div className="text-xs text-emerald-200/80">
              {lastLiveAt ? `Dernier signal ${fmtAgo(new Date(lastLiveAt).toISOString())}` : 'Aucune trame depuis l’ouverture de cette page'}
              {' · '}{capteurs.length} sonde{capteurs.length > 1 ? 's' : ''} déclarée{capteurs.length > 1 ? 's' : ''}
              {chrome !== 'admin' && ` · ${scopeLabel}`}
            </div>

          </div>
          <Radio className="ml-auto h-5 w-5 text-emerald-300" />
        </div>
      </div>

      {/* Compteurs 24 h */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Tile icon={<CheckCircle2 className="h-3.5 w-3.5" />} value={counters.acceptees} label="Avec relevé · 24 h" />
        <Tile icon={<Inbox className="h-3.5 w-3.5" />} value={counters.vides} label="Sans relevé · 24 h" tone="text-amber-600" />
        <Tile icon={<ShieldX className="h-3.5 w-3.5" />} value={counters.refusees} label="Signatures refusées · 24 h" tone="text-red-600" />
        <Tile icon={<AlertTriangle className="h-3.5 w-3.5" />} value={counters.erreurs} label="Erreurs de traitement · 24 h" tone="text-amber-600" />
        <Tile icon={<MoonStar className="h-3.5 w-3.5" />} value={counters.silencieux} label="Sondes silencieuses" tone="text-slate-600" />
      </div>

      <p className="-mt-4 text-[11px] text-muted-foreground">
        Ces cinq compteurs portent toujours sur les 24 dernières heures : ils ne suivent pas les filtres du journal.
      </p>

      {/* Vitalité par sonde */}
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-emerald-600" /> Vitalité des sondes · 48 dernières heures</h3>
        <div className="grid gap-2">
          {capteurs.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.nom}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.serial_number} · {c.type?.modele ?? '—'} · vue {fmtAgo(c.last_seen_at)}
                  </div>
                </div>
                {capabilities.testDelivery && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={test.isPending}
                    onClick={() => test.mutate(c.id)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" /> Trame de test
                  </Button>
                )}

              </div>
              <VitalityStrip
                timestamps={pingsByCapteur[c.id] ?? []}
                hours={48}
                showScale
                selectedIndex={openHour?.capteurId === c.id ? openHour.index : null}
                onSelectHour={(index, from, to) =>
                  setOpenHour((prev) =>
                    prev && prev.capteurId === c.id && prev.index === index
                      ? null
                      : { capteurId: c.id, index, from, to })
                }
              />
              {openHour?.capteurId === c.id && (
                <HourMesuresWidget
                  capteurId={c.id}
                  capteurNom={c.nom}
                  from={openHour.from}
                  to={openHour.to}
                  onClose={() => setOpenHour(null)}
                />
              )}
            </div>
          ))}

          {capteurs.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Aucune sonde déclarée pour l’instant.</p>
          )}
        </div>
      </section>

      <DeliveryJournal />

    </div>
  );
};

export default TelemetryControl;

