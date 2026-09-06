import React from 'react';
import { ArrowLeft, NotebookPen, Plus, Sparkles, Star, Sun, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TourStatusBadge from './TourStatusBadge';
import TourActionRow from './TourActionRow';
import CarnetTerrainDialog from './carnet/CarnetTerrainDialog';
import { useCarnetEnvois } from '@/hooks/propriete/useCarnetEnvoi';
import {
  TOUR_STATUTS,
  useTourActions,
  type ProprieteTour,
  type TourStatut,
} from '@/hooks/propriete/useProprieteTours';

interface Props {
  tour: ProprieteTour;
  proprieteId: string;
  proprieteNom: string;
  onBack: () => void;
  onUpdateTour: (id: string, patch: Partial<ProprieteTour>) => Promise<void> | void;
  onDeleteTour: (id: string) => Promise<void> | void;
  onEnrich: () => void;
  enriching?: boolean;
}

const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const TourDetail: React.FC<Props> = ({
  tour,
  proprieteId,
  proprieteNom,
  onBack,
  onUpdateTour,
  onDeleteTour,
  onEnrich,
  enriching,
}) => {
  const { actions, addAction, updateAction, removeAction, setAllRetenues, reorder } = useTourActions(tour.id);
  const { data: envois = [] } = useCarnetEnvois(tour.id);
  const [newTitle, setNewTitle] = React.useState('');
  const [carnetOpen, setCarnetOpen] = React.useState(false);
  const [notes, setNotes] = React.useState(tour.notes ?? '');

  const retenues = React.useMemo(() => actions.filter((a) => a.retenue), [actions]);

  React.useEffect(() => setNotes(tour.notes ?? ''), [tour.id, tour.notes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = actions.findIndex((a) => a.id === active.id);
    const newIndex = actions.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorder(arrayMove(actions, oldIndex, newIndex));
  };

  const doneCount = actions.filter((a) => a.done).length;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Tous les tours
      </button>

      {/* En-tête */}
      <header className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Input
              value={tour.titre}
              onChange={(e) => onUpdateTour(tour.id, { titre: e.target.value })}
              className="border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
            <p className="text-xs text-muted-foreground">
              {fmtDate(tour.date_tour)}
              {tour.duree_min ? ` · ${tour.duree_min} min` : ''}
              {tour.saison ? ` · ${tour.saison}` : ''}
              {` · ${doneCount}/${actions.length} action(s) faite(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TourStatusBadge statut={tour.statut} />
            <Select
              value={tour.statut}
              onValueChange={(v) => onUpdateTour(tour.id, { statut: v as TourStatut })}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-[100]">
                {TOUR_STATUTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer ce tour"
              onClick={() => onDeleteTour(tour.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {tour.intention && (
          <p className="text-sm text-foreground/85 italic">{tour.intention}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sun className="h-3.5 w-3.5" /> Ce qui va bien
            </h3>
            {tour.points_forts.length ? (
              <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
                {tour.points_forts.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">·</span>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Pas encore renseigné — demandez une proposition à l'IA de Jardin.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-muted/40 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Le potentiel
            </h3>
            {tour.potentiels.length ? (
              <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
                {tour.potentiels.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Rien de listé pour l'instant.
              </p>
            )}
          </section>
        </div>
      </header>

      {/* Actions */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Actions clés du tour</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={onEnrich} disabled={enriching}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {enriching ? 'L\u2019IA réfléchit…' : 'Enrichir avec l\u2019IA'}
            </Button>
            <Button size="sm" onClick={() => setCarnetOpen(true)} disabled={retenues.length === 0}>
              <NotebookPen className="h-3.5 w-3.5 mr-1.5" />
              Carnet de terrain
            </Button>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className={`h-3.5 w-3.5 ${retenues.length ? 'fill-current text-primary' : ''}`} />
              {retenues.length === 0
                ? 'Aucune action retenue pour le terrain'
                : `${retenues.length} action${retenues.length > 1 ? 's' : ''} retenue${retenues.length > 1 ? 's' : ''}`}
            </span>
            <span className="hidden sm:inline">·</span>
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setAllRetenues(true)}>
              Tout sélectionner
            </button>
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setAllRetenues(false)}>
              Aucune
            </button>
            {tour.carnet_edite_at && (
              <span className="basis-full text-[11px] text-muted-foreground/80">
                Carnet édité le {new Date(tour.carnet_edite_at).toLocaleDateString('fr-FR')} — pensez à reporter vos
                dates.
              </span>
            )}
          </div>
        )}

        {actions.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aucune action pour l'instant. Ajoutez la vôtre ci-dessous, ou demandez une proposition à l'IA de Jardin.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {actions.map((a) => (
                <TourActionRow
                  key={a.id}
                  action={a}
                  onUpdate={updateAction}
                  onRemove={removeAction}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim()) return;
            addAction({ titre: newTitle.trim() });
            setNewTitle('');
          }}
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ajouter une action…"
          />
          <Button type="submit" size="sm"><Plus className="h-4 w-4" /></Button>
        </form>
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Mes notes de terrain</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (tour.notes ?? '') && onUpdateTour(tour.id, { notes: notes || null })}
          rows={4}
          placeholder="Ce que j'ai vu, entendu, senti pendant le tour…"
        />
      </section>

      <CarnetTerrainDialog
        open={carnetOpen}
        onOpenChange={setCarnetOpen}
        tour={tour}
        actions={retenues}
        proprieteNom={proprieteNom}
        onEdited={() => onUpdateTour(tour.id, { carnet_edite_at: new Date().toISOString() })}
      />
    </div>
  );
};

export default TourDetail;
