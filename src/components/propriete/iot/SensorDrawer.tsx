import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Battery, Radio, Signal, MapPin, Sparkles, History, Trash2, Pencil, Check, X } from 'lucide-react';
import type { IotCapteur, IotMesure } from '@/hooks/iot/useIot';
import { useMesureSeries, useCapteurMutation } from '@/hooks/iot/useIot';
import { sensorHealth, HEALTH_COLOR, fmtHorodatage, grandeurMeta, fmtProfondeur, moistureVerdict } from '@/lib/iot/grandeurs';
import MesureTile from './MesureTile';
import SensorPhotoStrip from './SensorPhotoStrip';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Courbe minimaliste d'une série (SVG, sans dépendance). */
const Spark: React.FC<{ rows: IotMesure[]; color: string }> = ({ rows, color }) => {
  if (rows.length < 2) return null;
  const vs = rows.map((r) => r.valeur);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const pts = rows
    .map((r, i) => `${(i / (rows.length - 1)) * 100},${28 - ((r.valeur - min) / span) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

interface Props {
  capteur: IotCapteur | null;
  latest: IotMesure[];
  onClose: () => void;
  onLocate?: (c: IotCapteur) => void;
  proprieteId: string;
  proprieteNom?: string;
  /** Ouverte depuis un écran plein (Atelier du jardin) : passe au-dessus. */
  elevated?: boolean;
}

/** Fiche capteur : dernières mesures, tendance 30 jours, lecture et IA de Jardin. */
export const SensorDrawer: React.FC<Props> = ({ capteur, latest, onClose, onLocate, proprieteId, proprieteNom, elevated }) => {
  const { data: series = [] } = useMesureSeries(capteur?.id, 30);
  const mut = useCapteurMutation(proprieteId);
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setRenaming(false);
    setDraft(capteur?.nom ?? '');
  }, [capteur?.id, capteur?.nom]);

  if (!capteur) return null;
  const health = sensorHealth(capteur);

  /** Séries groupées par grandeur + profondeur. */
  const groups = new Map<string, IotMesure[]>();
  series.forEach((m) => {
    const k = `${m.grandeur}|${m.profondeur_m ?? ''}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(m);
  });

  const soil = latest.filter((m) => m.grandeur === 'soil_moisture').sort((a, b) => (a.profondeur_m ?? 0) - (b.profondeur_m ?? 0));
  const lecture = soil.length
    ? soil.map((m) => `${fmtProfondeur(m.profondeur_m) ?? 'surface'} : ${moistureVerdict(m.valeur).label.toLowerCase()}`).join(' · ')
    : null;
  const conseil = soil.length ? moistureVerdict(soil[0].valeur).conseil : null;

  const askIa = () => {
    const q = `À propos de la sonde « ${capteur.nom} »${proprieteNom ? ` (${proprieteNom})` : ''} : ${latest
      .map((m) => `${grandeurMeta(m.grandeur).label}${fmtProfondeur(m.profondeur_m) ? ` à ${fmtProfondeur(m.profondeur_m)}` : ''} = ${m.valeur} ${m.unite}`)
      .join(' ; ')}. Que me conseilles-tu au jardin dans les jours qui viennent ?`;
    window.dispatchEvent(new CustomEvent('frequence:open-chatbot', { detail: { question: q } }));
  };

  return (
    <Sheet open={!!capteur} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        overlayClassName={elevated ? 'z-[3200]' : undefined}
        className={`w-full overflow-y-auto bg-[hsl(var(--ds-cream))] sm:max-w-lg ${elevated ? 'z-[3210]' : ''}`}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[hsl(var(--ds-forest-deep))]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HEALTH_COLOR[health.status] }} />
            {renaming ? (
              <span className="flex flex-1 items-center gap-1">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 bg-white/70" autoFocus />
                <button
                  type="button"
                  onClick={() => {
                    if (draft.trim()) mut.mutate({ action: 'update', id: capteur.id, values: { nom: draft.trim() } });
                    setRenaming(false);
                  }}
                  className="rounded-full bg-[hsl(var(--ds-forest-deep))] p-1.5 text-[hsl(var(--ds-cream))]"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setRenaming(false)} className="rounded-full border p-1.5">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <>
                <span className="flex-1 truncate font-serif">{capteur.nom}</span>
                <button type="button" onClick={() => setRenaming(true)} aria-label="Renommer" className="opacity-60 hover:opacity-100">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Supprimer" className="text-red-600/70 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        <p className="mt-1 text-[11px] text-[hsl(var(--ds-forest))]/70">
          {capteur.type?.modele} · {capteur.type?.fournisseur?.nom} · n° {capteur.serial_number}
          {capteur.emplacement ? ` · ${capteur.emplacement}` : ''}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <Badge icon={Radio} label={health.label} color={HEALTH_COLOR[health.status]} />
          <Badge icon={Battery} label={capteur.battery_pct != null ? `${Math.round(capteur.battery_pct)} %` : '—'} />
          <Badge icon={Signal} label={capteur.rssi != null ? `${capteur.rssi} dBm` : '—'} />
          <Badge icon={History} label={fmtHorodatage(capteur.last_seen_at)} />
          <Badge
            icon={MapPin}
            label={capteur.lat != null ? `${capteur.lat.toFixed(5)}, ${capteur.lng?.toFixed(5)}` : 'À situer'}
          />
        </div>
        {health.reasons.length > 0 && health.status !== 'green' && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-[hsl(var(--ds-forest))]/80">
            {health.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        )}

        <SensorPhotoStrip
          capteurId={capteur.id}
          proprieteId={proprieteId}
          healthColor={HEALTH_COLOR[health.status]}
        />

        <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]">Dernières mesures</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {latest.length === 0 && <p className="text-xs italic opacity-60">Aucune mesure reçue.</p>}
          {latest.map((m, i) => (
            <MesureTile key={m.id} m={m} index={i} />
          ))}
        </div>

        {lecture && (
          <div className="mt-4 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]">Lecture</div>
            <p className="mt-1 text-sm text-[hsl(var(--ds-forest-deep))]">{lecture}</p>
            {conseil && <p className="mt-1 text-xs italic text-[hsl(var(--ds-forest))]/80">{conseil}</p>}
          </div>
        )}

        <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]">30 derniers jours</h3>
        <div className="mt-2 space-y-2">
          {[...groups.entries()].map(([k, rows]) => {
            const meta = grandeurMeta(rows[0].grandeur);
            const prof = fmtProfondeur(rows[0].profondeur_m);
            return (
              <div key={k} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-2.5">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/70">
                  <span>{meta.label}{prof ? ` · ${prof}` : ''}</span>
                  <span>{rows.length} relevés</span>
                </div>
                <Spark rows={rows} color={meta.color} />
              </div>
            );
          })}
          {groups.size === 0 && <p className="text-xs italic opacity-60">Pas d'historique sur la période.</p>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={askIa}
            className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-xs text-[hsl(var(--ds-cream))] hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" /> Demander à l'IA de Jardin
          </button>
          {onLocate && (
            <button
              type="button"
              onClick={() => onLocate(capteur)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-3 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))]"
            >
              <MapPin className="h-3.5 w-3.5" /> {capteur.lat == null ? 'Situer sur le plan' : 'Voir sur le plan'}
            </button>
          )}
        </div>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer « {capteur.nom} » ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le capteur et toutes ses mesures seront définitivement supprimés de cette propriété.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  mut.mutate({ action: 'delete', id: capteur.id });
                  onClose();
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};

const Badge: React.FC<{ icon: React.ElementType; label: string; color?: string }> = ({ icon: Icon, label, color }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-2 py-1 font-medium text-[hsl(var(--ds-forest-deep))]"
    style={color ? { color, borderColor: `${color}66`, backgroundColor: `${color}14` } : undefined}
  >
    <Icon className="h-3 w-3 shrink-0" /> {label}
  </span>
);


export default SensorDrawer;
