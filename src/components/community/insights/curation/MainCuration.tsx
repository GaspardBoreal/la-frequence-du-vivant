import React, { useEffect, useMemo, useState } from 'react';
import { Hand, Plus, Pencil, Trash2, Image as ImageIcon, Play, Mic } from 'lucide-react';
import {
  useExplorationCurations,
  useUpsertCuration,
  useDeleteCuration,
  type ExplorationCuration,
} from '@/hooks/useExplorationCurations';
import {
  useExplorationAllMedia,
  buildMediaIndex,
  normalizeMediaKey,
  type MediaItem,
} from '@/hooks/useExplorationAllMedia';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MediaPickerSheet from './MediaPickerSheet';
import MediaLightbox from './MediaLightbox';

interface Props {
  explorationId: string;
  isCurator: boolean;
}

interface EditorState {
  open: boolean;
  editing?: ExplorationCuration;
  title: string;
  description: string;
  mediaKeys: string[];
}

const emptyEditor: EditorState = {
  open: false,
  editing: undefined,
  title: '',
  description: '',
  mediaKeys: [],
};

const MainCuration: React.FC<Props> = ({ explorationId, isCurator }) => {
  const { data: entries = [], isLoading } = useExplorationCurations(explorationId, 'main');
  const { data: allMedia } = useExplorationAllMedia(explorationId);
  const upsert = useUpsertCuration();
  const del = useDeleteCuration();

  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null);

  const mediaIndex = useMemo(() => buildMediaIndex(allMedia), [allMedia]);

  // Lock body scroll while picker is open (mobile)
  useEffect(() => {
    if (pickerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [pickerOpen]);

  const openCreate = () => {
    setEditor({ open: true, editing: undefined, title: '', description: '', mediaKeys: [] });
  };

  const openEdit = (entry: ExplorationCuration) => {
    setEditor({
      open: true,
      editing: entry,
      title: entry.title || '',
      description: entry.description || '',
      mediaKeys: (entry.media_ids || []).map(normalizeMediaKey),
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
      media_ids: editor.mediaKeys,
    });
    close();
  };

  const remove = async (entry: ExplorationCuration) => {
    if (!window.confirm('Supprimer cette pratique éditoriale ?')) return;
    await del.mutateAsync({ id: entry.id, exploration_id: explorationId });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const renderThumb = (item: MediaItem, sizeClass: string) => (
    <div className={`relative bg-muted ${sizeClass}`}>
      {item.type === 'video' ? (
        <>
          <video
            src={`${item.url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
            <Play className="w-2.5 h-2.5 fill-white" /> vidéo
          </div>
        </>
      ) : item.type === 'audio' ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-amber-500/10 px-2 text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mb-1 shadow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] leading-tight font-medium text-emerald-900 dark:text-emerald-100 line-clamp-2">
            {item.titre || 'Audio'}
          </span>
        </div>
      ) : (
        <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
    </div>
  );

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
              ? 'Créez votre première pratique : un titre, un récit, et une sélection de médias issus des marches ou du mur Convivialité.'
              : 'L\'ambassadeur n\'a pas encore documenté de pratiques pour cette exploration.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const items = (entry.media_ids || [])
              .map(normalizeMediaKey)
              .map(k => mediaIndex.get(k))
              .filter(Boolean) as MediaItem[];
            return (
              <article
                key={entry.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {items.length > 0 && (
                  <div className={`grid gap-0.5 ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {items.slice(0, 6).map((it, i) => (
                      <button
                        type="button"
                        key={it.key}
                        onClick={() => setLightbox({ items, index: i })}
                        className="relative block focus:outline-none focus:ring-2 focus:ring-primary/60"
                        aria-label={`Ouvrir ${it.titre || 'le média'} en grand`}
                      >
                        {renderThumb(
                          it,
                          items.length === 1 ? 'aspect-[16/9]' : 'aspect-square'
                        )}
                        {i === 5 && items.length > 6 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-sm">
                            +{items.length - 6}
                          </div>
                        )}
                      </button>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Médias ({editor.mediaKeys.length})
                </label>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  {editor.mediaKeys.length === 0 ? 'Choisir des médias' : 'Modifier la sélection'}
                </button>
              </div>

              {editor.mediaKeys.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full rounded-lg border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition px-3 py-6 text-center"
                >
                  <ImageIcon className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    Parcourir toutes les marches & le mur Convivialité
                  </p>
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {editor.mediaKeys.slice(0, 8).map(key => {
                    const it = mediaIndex.get(key);
                    if (!it) {
                      return (
                        <div
                          key={key}
                          className="aspect-square rounded-md bg-muted/40 border border-dashed border-border flex items-center justify-center"
                        >
                          <span className="text-[9px] text-muted-foreground">indisponible</span>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="aspect-square rounded-md overflow-hidden border border-border">
                        {renderThumb(it, 'w-full h-full')}
                      </div>
                    );
                  })}
                  {editor.mediaKeys.length > 8 && (
                    <div className="aspect-square rounded-md bg-muted/40 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{editor.mediaKeys.length - 8}
                    </div>
                  )}
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

      <MediaPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        explorationId={explorationId}
        selectedKeys={editor.mediaKeys}
        onConfirm={(keys) => setEditor(s => ({ ...s, mediaKeys: keys }))}
      />

      <MediaLightbox
        open={!!lightbox}
        onOpenChange={(v) => { if (!v) setLightbox(null); }}
        items={lightbox?.items || []}
        startIndex={lightbox?.index ?? 0}
        marcheEvents={allMedia.events}
      />
    </div>
  );
};

export default MainCuration;
