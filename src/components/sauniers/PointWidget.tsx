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
  Pencil,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import useIdeesArret, { type GroupeIdee, type IdeeEnregistree } from '@/hooks/sauniers/useIdeesAnimation';
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
  /** Une génération de tout le parcours est en cours : on bloque l'action unitaire. */
  generationGlobale?: boolean;
  placementActif: boolean;
  peutAnnuler: boolean;
  onPlacement: () => void;
  onAnnuler: () => void;
  onSegment: () => void;
  onClose: () => void;
}

/* --------------------------------- idée ---------------------------------- */

const IdeeCard: React.FC<{
  idee: IdeeEnregistree;
  index: number;
  ton: GroupeIdee;
  editable: boolean;
  onModifier: (champs: Partial<IdeeEnregistree>) => void;
  onSupprimer: () => void;
}> = ({ idee, index, ton, editable, onModifier, onSupprimer }) => {
  const [edition, setEdition] = React.useState(false);
  const [brouillon, setBrouillon] = React.useState(idee);

  React.useEffect(() => setBrouillon(idee), [idee]);

  const champ =
    'w-full rounded-lg border border-border/40 bg-background/60 px-2 py-1 text-[12px] text-foreground outline-none focus:border-emerald-400/50';

  return (
    <div
      className={`animate-fade-in rounded-2xl border p-3 backdrop-blur-sm ${
        ton === 'lieu' ? 'border-amber-400/25 bg-amber-500/5' : 'border-emerald-400/25 bg-emerald-500/5'
      }`}
      style={{ animationDelay: `${index * 90}ms`, animationFillMode: 'both' }}
    >
      {edition ? (
        <div className="space-y-1.5">
          <input
            className={champ}
            value={brouillon.titre}
            onChange={(e) => setBrouillon({ ...brouillon, titre: e.target.value })}
            placeholder="Titre"
          />
          <textarea
            className={`${champ} min-h-[64px] resize-y`}
            value={brouillon.description}
            onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
            placeholder="Description"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              className={champ}
              value={brouillon.duree}
              onChange={(e) => setBrouillon({ ...brouillon, duree: e.target.value })}
              placeholder="Durée"
            />
            <input
              className={champ}
              value={brouillon.materiel}
              onChange={(e) => setBrouillon({ ...brouillon, materiel: e.target.value })}
              placeholder="Matériel"
            />
          </div>
          <div className="flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onModifier({
                  titre: brouillon.titre,
                  description: brouillon.description,
                  duree: brouillon.duree,
                  materiel: brouillon.materiel,
                });
                setEdition(false);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
            >
              <Check className="h-3 w-3" /> Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setBrouillon(idee);
                setEdition(false);
              }}
              className="rounded-full border border-border/40 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div
              className={`min-w-0 flex-1 text-[13px] font-semibold ${
                ton === 'lieu' ? 'text-amber-200' : 'text-emerald-200'
              }`}
            >
              {idee.titre}
            </div>
            {editable && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEdition(true)}
                  aria-label="Modifier cette idée"
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onSupprimer}
                  aria-label="Supprimer cette idée"
                  className="text-muted-foreground/70 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {idee.description && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {idee.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/80">
            {idee.duree && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {idee.duree}
              </span>
            )}
            {idee.materiel && (
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" /> {idee.materiel}
              </span>
            )}
            {idee.source === 'humain' && (
              <span className="rounded-full border border-border/40 px-1.5 py-0.5">
                ajoutée à la main
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* -------------------------------- widget --------------------------------- */

const PointWidget: React.FC<Props> = ({
  point,
  numero,
  distancePrecedent,
  editable,
  generationGlobale = false,
  placementActif,
  peutAnnuler,
  onPlacement,
  onAnnuler,
  onSegment,
  onClose,
}) => {
  const [ouvertIdees, setOuvertIdees] = React.useState(false);
  const [confirmRegen, setConfirmRegen] = React.useState(false);
  const {
    idees,
    lieu,
    vivant,
    chargement,
    derniereGeneration,
    generer,
    modifier,
    supprimer,
    ajouter,
  } = useIdeesArret(point.id);

  const occupe = generer.isPending || generationGlobale;

  const dateGeneration = derniereGeneration
    ? new Date(derniereGeneration).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  React.useEffect(() => {
    setOuvertIdees(false);
    setConfirmRegen(false);
  }, [point.id]);

  React.useEffect(() => {
    if (idees.length > 0) setOuvertIdees(true);
  }, [idees.length]);

  const contexte = {
    nom: point.nom,
    sous: point.sous,
    texte: point.texte,
    segment: point.segment,
  };

  const lancer = (remplacer: boolean) => {
    setOuvertIdees(true);
    generer.mutate(
      { point: contexte, remplacer },
      {
        onSuccess: ({ secours }) =>
          secours
            ? toast.warning('Assistant indisponible : six idées de secours ont été enregistrées.')
            : toast.success('Six idées enregistrées pour cet arrêt.'),
        onError: (e: any) => toast.error(e?.message ?? 'Enregistrement des idées impossible.'),
      },
    );
    setConfirmRegen(false);
  };

  const section = (groupe: GroupeIdee, liste: IdeeEnregistree[]) => (
    <section>
      <h4
        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
          groupe === 'lieu' ? 'text-amber-300/90' : 'text-emerald-300/90'
        }`}
      >
        {groupe === 'lieu' ? (
          <>
            <Landmark className="h-3.5 w-3.5" /> Ce lieu
          </>
        ) : (
          <>
            <Leaf className="h-3.5 w-3.5" /> Esprit Marches du Vivant
          </>
        )}
      </h4>
      <div className="mt-2 space-y-2">
        {liste.map((i, n) => (
          <IdeeCard
            key={i.id}
            idee={i}
            index={n}
            ton={groupe}
            editable={editable}
            onModifier={(champs) =>
              modifier.mutate(
                { id: i.id, champs },
                { onError: (e: any) => toast.error(e?.message ?? 'Modification impossible.') },
              )
            }
            onSupprimer={() =>
              supprimer.mutate(i.id, {
                onError: (e: any) => toast.error(e?.message ?? 'Suppression impossible.'),
              })
            }
          />
        ))}
        {editable && (
          <button
            type="button"
            onClick={() =>
              ajouter.mutate(groupe, {
                onError: (e: any) => toast.error(e?.message ?? 'Ajout impossible.'),
              })
            }
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter une idée
          </button>
        )}
      </div>
    </section>
  );

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
          {idees.length > 0 && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
              <Sparkles className="h-3 w-3" />
              {idees.length} idée{idees.length > 1 ? 's' : ''}
              {dateGeneration ? ` · ${dateGeneration}` : ''}
            </div>
          )}
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

      {editable && idees.length === 0 && (
        <button
          type="button"
          onClick={() => lancer(false)}
          disabled={occupe}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-sky-600 px-4 py-2.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {occupe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generationGlobale ? 'Génération en cours…' : '6 idées de l’Assistant'}
        </button>
      )}

      {(ouvertIdees || idees.length > 0) && (
        <div className="mt-3 space-y-3">
          {(generer.isPending || chargement) && idees.length === 0 && (
            <p className="text-[12px] text-muted-foreground">
              L’Assistant compose six propositions pour cet arrêt…
            </p>
          )}

          {idees.length === 0 && !generer.isPending && !chargement && !editable && (
            <p className="text-[12px] text-muted-foreground">
              Aucune idée d’animation enregistrée pour cet arrêt.
            </p>
          )}

          {idees.length > 0 && (
            <>
              {section('lieu', lieu)}
              {section('vivant', vivant)}

              {editable &&
                (confirmRegen ? (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-3">
                    <p className="text-[11px] leading-relaxed text-amber-100/90">
                      Les idées proposées par l’Assistant seront remplacées. Celles que vous avez
                      ajoutées à la main sont conservées.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => lancer(true)}
                        className="flex-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        Régénérer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRegen(false)}
                        className="rounded-full border border-border/40 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRegen(true)}
                   disabled={occupe}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border/40 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {occupe ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Régénérer avec l’Assistant
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PointWidget;
