import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Plus, Battery, MapPin, AlertTriangle, CheckCircle2, Wifi, Send, Sparkles } from 'lucide-react';
import { useIotCapteurs, useLatestMesures, useWebhookDeliveries, type IotCapteur } from '@/hooks/iot/useIot';
import { sensorHealth, HEALTH_COLOR, fmtHorodatage, fmtMesure, fmtProfondeur, grandeurMeta } from '@/lib/iot/grandeurs';
import SensorFormDialog from './SensorFormDialog';
import SensorDrawer from './SensorDrawer';
import { useCapteurCovers } from '@/hooks/iot/useCapteurPhotos';
import { useTelemetryLive, useTelemetryPings } from '@/hooks/iot/useIotTelemetry';
import { VitalityStrip } from '@/components/iot/VitalityStrip';

interface Props {
  proprieteId: string;
  proprieteNom?: string;
}

/**
 * « Capteurs et sondes » : le poste de veille de la propriété.
 * Un bandeau de santé, une carte par capteur, la fiche détaillée au clic.
 */
export const SensorsSection: React.FC<Props> = ({ proprieteId, proprieteNom }) => {
  const { data: capteurs = [], isLoading } = useIotCapteurs(proprieteId);
  const ids = React.useMemo(() => capteurs.map((c) => c.id), [capteurs]);
  const { data: latest = {} } = useLatestMesures(ids);
  const { data: deliveries = [] } = useWebhookDeliveries(ids);
  const { data: covers = {} } = useCapteurCovers(ids);
  const { live } = useTelemetryLive();
  const { data: pings = [] } = useTelemetryPings(24, ids);
  const pingsByCapteur = React.useMemo(() => {
    const m: Record<string, string[]> = {};
    pings.forEach((p) => { (m[p.capteur_id] ??= []).push(p.mesure_at); });
    return m;
  }, [pings]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IotCapteur | null>(null);
  const [openCapteur, setOpenCapteur] = React.useState<IotCapteur | null>(null);

  const healths = capteurs.map((c) => ({ c, h: sensorHealth(c) }));
  const counts = {
    green: healths.filter((x) => x.h.status === 'green').length,
    amber: healths.filter((x) => x.h.status === 'amber').length,
    red: healths.filter((x) => x.h.status === 'red').length,
    unknown: healths.filter((x) => x.h.status === 'unknown').length,
  };
  const alerts = healths.filter((x) => x.h.status === 'amber' || x.h.status === 'red');
  const toPlace = capteurs.filter((c) => c.lat == null || c.lng == null);

  const openAtelier = () => window.dispatchEvent(new CustomEvent('propriete:open-atelier', { detail: { layer: 'capteurs', returnTab: 'capteurs' } }));

  return (
    <div className="space-y-5">
      {/* Bandeau de veille */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
            <Radio className="h-3 w-3" /> Veille des capteurs
            {live && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#3f7f52]/15 px-2 py-0.5 text-[9px] tracking-normal text-[#2f6340]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3f7f52] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3f7f52]" />
                </span>
                en direct
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-[hsl(var(--ds-forest-deep))]">
            <Dot color={HEALTH_COLOR.green} n={counts.green} label="en veille" />
            <Dot color={HEALTH_COLOR.amber} n={counts.amber} label="à surveiller" />
            <Dot color={HEALTH_COLOR.red} n={counts.red} label="en défaut" />
            {counts.unknown > 0 && <Dot color={HEALTH_COLOR.unknown} n={counts.unknown} label="sans nouvelle" />}
          </div>
        </div>

        <p className="mt-2 text-xs text-[hsl(var(--ds-forest))]/75">
          Les mesures arrivent en continu depuis les passerelles des fournisseurs et sont stockées normalisées
          (°C, %, Pa, lx, mm). Dernière réception&nbsp;: {fmtHorodatage(deliveries[0]?.created_at)}.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-xs text-[hsl(var(--ds-cream))] hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" /> Ajouter un capteur
          </button>
          <button
            type="button"
            onClick={openAtelier}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-3 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))]"
          >
            <MapPin className="h-3.5 w-3.5" /> Positionner sur le plan
            {toPlace.length > 0 && <span className="rounded-full bg-[hsl(var(--ds-gold))]/30 px-1.5">{toPlace.length} à situer</span>}
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {alerts.map(({ c, h }) => (
              <div
                key={c.id}
                className="flex items-start gap-2 rounded-2xl border px-3 py-2 text-[11px]"
                style={{ borderColor: `${HEALTH_COLOR[h.status]}55`, backgroundColor: `${HEALTH_COLOR[h.status]}12` }}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: HEALTH_COLOR[h.status] }} />
                <span className="text-[hsl(var(--ds-forest-deep))]">
                  <strong>{c.nom}</strong> — {h.reasons.join(' · ')}
                </span>
              </div>
            ))}
          </div>
        )}
        {alerts.length === 0 && capteurs.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3f7f52]/12 px-3 py-1 text-[11px] text-[#3f7f52]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tous les capteurs répondent normalement.
          </div>
        )}
      </div>

      {/* Cartes capteurs */}
      {isLoading && <p className="text-sm italic opacity-60">Lecture des capteurs…</p>}
      {!isLoading && capteurs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[hsl(var(--ds-line))] p-8 text-center">
          <Radio className="mx-auto h-6 w-6 text-[hsl(var(--ds-forest))]/50" />
          <p className="mt-2 text-sm text-[hsl(var(--ds-forest-deep))]">Aucun capteur déclaré sur cette propriété.</p>
          <p className="mt-1 text-xs opacity-60">Ajoutez une sonde pour recevoir ses mesures en continu.</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {capteurs.map((c, i) => {
          const h = sensorHealth(c);
          const rows = latest[c.id] ?? [];
          return (
            <motion.button
              key={c.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setOpenCapteur(c)}
              className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4 text-left transition hover:shadow-[0_10px_30px_-18px_rgba(20,30,15,.6)]"
            >
              <div className="flex items-center gap-2">
                {covers[c.id]?.url ? (
                  <span className="relative shrink-0">
                    <img
                      src={covers[c.id]!.url}
                      alt={`${c.nom} en situation`}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover"
                      style={{ border: `2px solid ${HEALTH_COLOR[h.status]}` }}
                    />
                    {(covers[c.id]!.count ?? 0) > 1 && (
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-[hsl(var(--ds-forest-deep))] px-1.5 text-[9px] font-bold text-[hsl(var(--ds-cream))]">
                        {covers[c.id]!.count}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: HEALTH_COLOR[h.status] }} />
                )}
                <span className="flex-1 truncate font-serif text-lg text-[hsl(var(--ds-forest-deep))]">{c.nom}</span>
                {c.battery_pct != null && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--ds-forest))]/70">
                    <Battery className="h-3 w-3" /> {Math.round(c.battery_pct)} %
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/60">
                {c.type?.modele} · {c.type?.fournisseur?.nom}
                {c.lat == null && <span className="ml-1 text-[hsl(var(--ds-gold))]">· à situer</span>}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {rows.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]"
                    title={grandeurMeta(m.grandeur).label}
                  >
                    {fmtProfondeur(m.profondeur_m) ? `${fmtProfondeur(m.profondeur_m)} · ` : ''}
                    {fmtMesure(m.valeur, m.grandeur, m.unite)}
                  </span>
                ))}
                {rows.length === 0 && <span className="text-[10px] italic opacity-55">Aucune mesure encore reçue</span>}
              </div>

              <VitalityStrip
                timestamps={pingsByCapteur[c.id] ?? []}
                hours={24}
                className="mt-2 opacity-90"
                color="63 127 82"
              />

              <div className="mt-2 flex items-center gap-1 text-[10px] text-[hsl(var(--ds-forest))]/60">
                <Wifi className="h-3 w-3" /> {fmtHorodatage(c.last_seen_at)} · 24 h de réceptions
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Journal des livraisons */}
      {deliveries.length > 0 && (
        <details className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]">
            <Send className="mr-1 inline h-3 w-3" /> Journal des réceptions ({deliveries.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[11px] text-[hsl(var(--ds-forest-deep))]">
            {deliveries.map((d: any) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.error ? HEALTH_COLOR.red : HEALTH_COLOR.green }} />
                <span className="opacity-70">{fmtHorodatage(d.created_at)}</span>
                <span className="truncate">
                  {d.serial_number ?? '—'} · {d.mesures_count ?? 0} mesures {d.error ? `· ${d.error}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="flex items-center gap-1.5 text-[11px] italic text-[hsl(var(--ds-forest))]/70">
        <Sparkles className="h-3 w-3 text-[hsl(var(--ds-gold))]" />
        Les mesures nourrissent l'IA de Jardin : ouvrez une fiche capteur pour lui demander une lecture.
      </p>

      <SensorFormDialog open={formOpen} onOpenChange={setFormOpen} proprieteId={proprieteId} capteur={editing} />
      <SensorDrawer
        capteur={openCapteur}
        latest={openCapteur ? latest[openCapteur.id] ?? [] : []}
        onClose={() => setOpenCapteur(null)}
        onLocate={() => { setOpenCapteur(null); openAtelier(); }}
        proprieteId={proprieteId}
        proprieteNom={proprieteNom}
      />
    </div>
  );
};

const Dot: React.FC<{ color: string; n: number; label: string }> = ({ color, n, label }) => (
  <span className="inline-flex items-center gap-1">
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {n} <span className="opacity-60">{label}</span>
  </span>
);

export default SensorsSection;
