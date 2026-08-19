import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Battery, Signal, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import { useSetCapteurEtat } from '@/hooks/iot/useIot';
import type { IotMesure } from '@/hooks/iot/useIot';
import {
  CAPTEUR_ETATS, HEALTH_COLOR, capteurEtat, fmtHorodatage, fmtMesure, fmtProfondeur, sensorHealth,
} from '@/lib/iot/grandeurs';

export interface SensorCardCapabilities {
  proprieteLinks?: boolean;
  ai?: boolean;
}

interface Props {
  capteur: any;
  latest: IotMesure[];
  /** Horodatages des remontées 48 h de cette sonde. */
  pings: string[];
  coverUrl?: string;
  capabilities: SensorCardCapabilities;
  onObservatory?: (c: any) => void;
  onAskAi?: (c: any) => void;
  onClose?: () => void;
  /** Sans en-tête (le dialogue affiche déjà le titre). */
  hideHeader?: boolean;
}

/**
 * Corps de la fiche capteur : état de service, photo en situation, identité,
 * dernières mesures, vitalité 48 h et actions. Partagé entre le panneau de la
 * carte et la popup de l'accueil partenaire.
 */
export const SensorCardBody: React.FC<Props> = ({
  capteur, latest, pings, coverUrl, capabilities, onObservatory, onAskAi, onClose, hideHeader,
}) => {
  const setService = useSetCapteurEtat();
  const health = sensorHealth(capteur);

  return (
    <div>
      {!hideHeader && (
        <>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{capteur.nom}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {capteur.serial_number} · {capteur.type?.modele ?? '—'}
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} aria-label="Fermer la fiche" className="text-xs text-muted-foreground">
                ✕
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="rounded-full px-2 py-0.5 text-white" style={{ background: HEALTH_COLOR[health.status] }}>
              {health.label}
            </span>
            <span className="text-muted-foreground">{fmtHorodatage(capteur.last_seen_at)}</span>
          </div>
        </>
      )}

      <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Wrench className="h-3 w-3" /> État de service
        </div>
        <div className="flex flex-wrap gap-1">
          {CAPTEUR_ETATS.map((e) => {
            const active = capteurEtat(capteur) === e.key;
            return (
              <button
                key={e.key}
                type="button"
                title={e.hint}
                disabled={setService.isPending}
                onClick={() =>
                  setService.mutate({
                    id: capteur.id,
                    etat: e.key,
                    motif:
                      e.key === 'service'
                        ? null
                        : window.prompt(`Motif — ${e.label} (facultatif)`, capteur.etat_motif ?? '') ?? null,
                  })
                }
                className="min-h-9 rounded-full border px-3 py-0.5 text-[11px] transition disabled:opacity-50"
                style={
                  active
                    ? { background: e.color, borderColor: e.color, color: '#fff' }
                    : { borderColor: 'hsl(var(--border))' }
                }
              >
                {e.label}
              </button>
            );
          })}
        </div>
        {capteurEtat(capteur) !== 'service' && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {capteur.etat_motif || 'Sans motif renseigné'} — sonde écartée des alertes et des analyses.
          </p>
        )}
      </div>

      {coverUrl && (
        <img
          src={coverUrl}
          alt={`${capteur.nom} en situation`}
          decoding="async"
          fetchPriority="high"
          className="mt-3 h-28 w-full rounded-xl object-cover"
        />
      )}

      <dl className="mt-3 space-y-1 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Propriété</dt>
          <dd className="truncate">
            {capabilities.proprieteLinks ? (
              <Link to={`/jardin/${capteur.propriete_id}`} className="text-emerald-700 underline">
                {capteur.propriete?.nom ?? '—'}
              </Link>
            ) : (
              <span>{capteur.propriete?.nom ?? '—'}</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Emplacement</dt>
          <dd className="truncate">{capteur.emplacement ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Coordonnées</dt>
          <dd className="tabular-nums">
            {capteur.lat != null ? `${capteur.lat.toFixed(6)}, ${capteur.lng?.toFixed(6)}` : 'non posée'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground"><Battery className="mr-1 inline h-3 w-3" />Batterie</dt>
          <dd>{capteur.battery_pct ? `${Math.round(capteur.battery_pct)} %` : 'non transmise'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground"><Signal className="mr-1 inline h-3 w-3" />Réception</dt>
          <dd>
            {capteur.rssi != null ? `${capteur.rssi} dBm` : '—'}
            {capteur.snr != null ? ` · SNR ${capteur.snr}` : ''}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">Dernières mesures</div>
        <div className="flex flex-wrap gap-1">
          {latest.map((m: any) => (
            <span key={m.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {fmtProfondeur(m.profondeur_m) ? `${fmtProfondeur(m.profondeur_m)} · ` : ''}
              {fmtMesure(m.valeur, m.grandeur, m.unite)}
            </span>
          ))}
          {latest.length === 0 && <span className="text-[11px] italic text-muted-foreground">Aucune mesure</span>}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">Vitalité · 48 h</div>
        <VitalityStrip timestamps={pings} hours={48} showScale />
      </div>

      {onObservatory && (
        <Button size="sm" className="mt-3 w-full" onClick={() => onObservatory(capteur)}>
          <BarChart3 className="mr-1 h-3.5 w-3.5" /> Voir tous les graphes
        </Button>
      )}

      {capabilities.ai && onAskAi && (
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => onAskAi(capteur)}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Interroger l'IA de Jardin
        </Button>
      )}
    </div>
  );
};

export default SensorCardBody;
