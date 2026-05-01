import React, { useMemo, useState } from 'react';
import { Hand, Plus, Pencil, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import {
  useExplorationCurations,
  useUpsertCuration,
  useDeleteCuration,
  type ExplorationCuration,
} from '@/hooks/useExplorationCurations';
import { useConvivialitePhotos } from '@/hooks/useConvivialitePhotos';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  explorationId: string;
  isCurator: boolean;
}

interface EditorState {
  open: boolean;
  editing?: ExplorationCuration;
  title: string;
  description: string;
  mediaIds: string[];
}

const emptyEditor: EditorState = {
  open: false,
  editing: undefined,
  title: '',
  description: '',
  mediaIds: [],
};

const MainCuration: React.FC<Props> = ({ explorationId, isCurator }) => {
  const { data: entries = [], isLoading } = useExplorationCurations(explorationId, 'main');
  const { data: convivPhotos = [] } = useConvivialitePhotos(explorationId);
  const upsert = useUpsertCuration();
  const del = useDeleteCuration();

  const [editor, setEditor] = useState<EditorState>(emptyEditor);

  const photoById = useMemo(() => {
    const m = new Map<string, typeof convivPhotos[number]>();
    convivPhotos.forEach(p => m.set(p.id, p));
    return m;
  }, [convivPhotos]);

  const openCreate = () => {
    setEditor({ open: true, editing: undefined, title: '', description: '', mediaIds: [] });
  };

  const openEdit = (entry: ExplorationCuration) => {
    setEditor({
      open: true,
      editing: entry,
      title: entry.title || '',
      description: entry.description || '',
      mediaIds: entry.media_ids || [],
    });
  };

  const close = () => setEditor(emptyEditor);

  const save = async () => {
    if (!editor.title.trim()) return;
    await upsert.mutateAsync({
      id: editor.editing?.id,
      exploration_id: explorationId,
      sense: 'main',
      entity_type: 'media',
      title: editor.title.trim(),
      description: editor.description.trim() || null,
      media_ids: editor.mediaIds,
    });
    close();
  };

  const remove = async (entry: ExplorationCuration) => {
    if (!window.confirm('Supprimer cette pratique éditoriale ?')) return;
    await del.mutateAsync({ id: entry.id, exploration_id: explorationId });
  };

  const toggleMedia = (id: string) => {
    setEditor(s =>
      s.mediaIds.includes(id)
        ? { ...s, mediaIds: s.mediaIds.filter(x => x !== id) }
        : { ...s, mediaIds: [...s.mediaIds, id] }
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Hand className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-foreground">Pratiques emblématiques</h3>
          <span className="text-xs text-muted-foreground">({entries.length})</span>
        </div>
        {isCurator && (
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Hand className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            {isCurator
              ? 'Créez votre première pratique : un titre, un récit, et une sélection d\'images de la marche.'
              : 'L\'ambassadeur n\'a pas encore documenté de pratiques pour cette exploration.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const photos = (entry.media_ids || []).map(id => photoById.get(id)).filter(Boolean) as typeof convivPhotos;
            return (
              <article
                key={entry.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Galerie médias */}
                {photos.length > 0 && (
                  <div className={`grid gap-0.5 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {photos.slice(0, 6).map((p, i) => (
                      <div
                        key={p.id}
                        className={`relative bg-muted ${
                          photos.length === 1 ? 'aspect-[16/9]' : 'aspect-square'
                        }`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {i === 5 && photos.length > 6 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-sm">
                            +{photos.length - 6}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground flex-1">{entry.title}</h4>
                    {isCurator && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => remove(entry)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {entry.description}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={editor.open} onOpenChange={v => !v && close()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editor.editing ? 'Modifier la pratique' : 'Nouvelle pratique éditoriale'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Titre</label>
              <Input
                value={editor.title}
                onChange={e => setEditor(s => ({ ...s, title: e.target.value }))}
                placeholder="Ex: Tressage de l'osier au bord de la rivière"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Récit / description</label>
              <Textarea
                value={editor.description}
                onChange={e => setEditor(s => ({ ...s, description: e.target.value }))}
                placeholder="Racontez le geste, le savoir-faire, le contexte…"
                rows={5}
                maxLength={2000}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Médias ({editor.mediaIds.length})
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Source : mur Convivialité
                </span>
              </div>
              {convivPhotos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2 py-3 bg-muted/30 rounded-lg">
                  Aucune photo dans le mur Convivialité pour cette exploration.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1">
                  {convivPhotos.map(p => {
                    const selected = editor.mediaIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleMedia(p.id)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition ${
                          selected ? 'border-emerald-500' : 'border-transparent hover:border-border'
                        }`}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {selected && (
                          <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={close}>Annuler</Button>
            <Button onClick={save} disabled={!editor.title.trim() || upsert.isPending}>
              {upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainCuration;
