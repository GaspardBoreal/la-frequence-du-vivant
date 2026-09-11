import React from 'react';
import {
  Compass,
  Crosshair,
  Loader2,
  Move,
  Sparkles,
  Undo2,
  X,
  Leaf,
  Landmark,
  Clock,
  Package,
} from 'lucide-react';
import useAnimationIdeas from '@/hooks/sauniers/useAnimationIdeas';
import type { Idee } from '@/content/sauniers/animationsFallback';
import { SEGMENT_LABEL, type Segment } from '@/content/sauniers/parcoursPropose';

export interface WidgetPoint {
  id: string;
  nom: string;
  sous: string;
  texte: string;
  segment: Segment;
  lat: number;
  lng: number;
}

interface Props {
  point: WidgetPoint;
  numero: number | null;
  distancePrecedent: number | null;
  editable: boolean;
  placementActif: boolean;
  peutAnnuler: boolean;
  onPlacement: () => void;
  onAnnuler: () => void;
  onSegment: () => void;
  onClose: () => void;
}

const IdeeCard: React.FC<{ idee: Idee; index: number; ton: 'lieu' | 'vivant' }> = ({
  idee,
  index,
  ton,
}) => (
  <div
    className={`animate-fade-in rounded-2xl border p-3 backdrop-blur-sm ${
      ton === 'lieu'
        ? 'border-amber-400/25 bg-amber-500/5'
        : 'border-emerald-400/25 bg-emerald-500/5'
    }`}
    style={{ animationDelay: `${index * 110}ms`, animationFillMode: 'both' }}
  >
    <div
      className={`text-[13px] font-semibold ${ton === 'lieu' ? 'text-amber-200' : 'text-emerald-200'}`}
    >
      {idee.titre}
    </div>
    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{idee.description}</p>
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/80">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" /> {idee.duree}
      </span>
      <span className="inline-flex items-center gap-1">
        <Package className="h-3 w-3" /> {idee.materiel}
      </span>
    </div>
  </div>
);

const PointWidget: React.FC<Props> = ({
  point,
  numero,
  distancePrecedent,
  editable,
  placementActif,
  peutAnnuler,
  onPlacement,
  onAnnuler,
  onSegment,
  onClose,
}) => {
  const [ouvertIdees, setOuvertIdees] = React.useState(false);
  const { idees, loading, secours, generer } = useAnimationIdeas(point);

  React.useEffect(() => {
    setOuvertIdees(false);
  }, [point.id]);

  const lancer = () => {
    setOuvertIdees(true);
    void generer(false);
  };

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-[700] max-h-[72%] overflow-y-auto rounded-t-3xl border border-emerald-500/25 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:max-h-none sm:w-[340px] sm:rounded-3xl">
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${
            point.segment === 'amont' ? 'bg-emerald-600' : 'bg-sky-600'
          }`}
        >
          {numero ?? '–'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">{point.nom}</div>
          <div className="text-[11px] text-muted-foreground">{point.sous}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {point.texte && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{point.texte}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-border/40 bg-card/40 px-2.5 py-2">
          <div className="text-muted-foreground/70">Segment</div>
          <div className="font-medium text-foreground">{SEGMENT_LABEL[point.segment]}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/40 px-2.5 py-2">
          <div className="text-muted-foreground/70">Depuis l’arrêt précédent</div>
          <div className="font-medium text-foreground">
            {distancePrecedent == null ? 'Départ' : `${Math.round(distancePrecedent)} m`}
          </div>
        </div>
      </div>

      <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">
        {point.lat.toFixed(5)} / {point.lng.toFixed(5)}
      </div>

      {editable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPlacement}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold transition-colors ${
              placementActif
                ? 'bg-amber-500 text-slate-900'
                : 'border border-border/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {placementActif ? <Crosshair className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
            {placementActif ? 'Touchez la carte' : 'Placer ce point'}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            disabled={!peutAnnuler}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" /> Annuler
          </button>
          <button
            type="button"
            onClick={onSegment}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Compass className="h-3.5 w-3.5" />
            {point.segment === 'amont' ? 'Vers le marais' : 'Vers le village'}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={lancer}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-sky-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        6 idées d’animation
      </button>

      {ouvertIdees && (
        <div className="mt-3 space-y-3">
          {loading && !idees && (
            <p className="text-[12px] text-muted-foreground">
              L’IA compose six propositions pour cet arrêt…
            </p>
          )}

          {idees && (
            <>
              <section>
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300/90">
                  <Landmark className="h-3.5 w-3.5" /> Ce lieu
                </h4>
                <div className="mt-2 space-y-2">
                  {idees.lieu.map((i, n) => (
                    <IdeeCard key={i.titre + n} idee={i} index={n} ton="lieu" />
                  ))}
                </div>
              </section>

              <section>
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">
                  <Leaf className="h-3.5 w-3.5" /> Esprit Marches du Vivant
                </h4>
                <div className="mt-2 space-y-2">
                  {idees.vivant.map((i, n) => (
                    <IdeeCard key={i.titre + n} idee={i} index={n + 3} ton="vivant" />
                  ))}
                </div>
              </section>

              {secours && (
                <p className="text-[11px] text-amber-300/80">
                  Propositions de secours : l’assistant est momentanément indisponible.
                </p>
              )}

              <button
                type="button"
                onClick={() => void generer(true)}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border/40 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Régénérer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PointWidget;
