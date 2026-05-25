import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Plus, Pencil, Trash2, Image as ImageIcon, Play, Mic, ArrowDownAZ, GripVertical, Check, Upload, Loader2, FolderOpen, ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { stripHtml } from '@/utils/textUtils';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { sanitizeHtml } from '@/utils/htmlSanitizer';
import MediaPickerSheet from './MediaPickerSheet';
import MediaLightbox from './MediaLightbox';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import PratiqueMarcheursPicker from './PratiqueMarcheursPicker';
import { useChatTabSnapshot } from '@/hooks/useChatPageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUploadConvivialitePhotos } from '@/hooks/useConvivialitePhotos';

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
  const { data: marcheurs = [] } = useExplorationMarcheurs(explorationId);
  const upsert = useUpsertCuration();
  const del = useDeleteCuration();
  const qc = useQueryClient();

  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null);
  const [sortMode, setSortMode] = useState<'alpha' | 'manual'>('alpha');
  const [reorderMode, setReorderMode] = useState(false);
  const [manualOrder, setManualOrder] = useState<ExplorationCuration[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Expanded state (accordion) — persisted in localStorage per exploration
  const lsKey = `main-curation-expanded:${explorationId}`;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.ids) && Date.now() - (parsed.ts || 0) < 7 * 24 * 3600 * 1000) {
          return new Set(parsed.ids);
        }
      }
    } catch {}
    return new Set();
  });
  const [hasHydratedDefault, setHasHydratedDefault] = useState(false);
  const [readMoreIds, setReadMoreIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(lsKey, JSON.stringify({ ids: Array.from(expandedIds), ts: Date.now() }));
    } catch {}
  }, [expandedIds, lsKey]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const mediaIndex = useMemo(() => buildMediaIndex(allMedia), [allMedia]);

  // Upload direct depuis appareil (smartphone / tablette / PC) — réutilise le mur Convivialité
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const { mutate: uploadPhotos, isPending: uploading } = useUploadConvivialitePhotos(
    explorationId,
    user?.id,
    (p) => setUploadStage(`${p.fileIndex + 1}/${p.total} · ${p.stage}`),
  );

  const handlePickFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list).filter((f) => {
      if (f.type.startsWith('image/')) return true;
      const n = f.name.toLowerCase();
      return n.endsWith('.heic') || n.endsWith('.heif');
    });
    if (files.length === 0) {
      toast.error('Aucune image valide sélectionnée');
      return;
    }
    uploadPhotos(files, {
      onSuccess: ({ results }) => {
        if (results.length > 0) {
          const newKeys = results.map((r) => `conv:${r.id}`);
          setEditor((s) => ({ ...s, mediaKeys: [...s.mediaKeys, ...newKeys] }));
          qc.invalidateQueries({ queryKey: ['exploration-all-media', explorationId] });
        }
      },
      onSettled: () => setUploadStage(null),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sortedEntries = useMemo(() => {
    if (sortMode === 'alpha') {
      return [...entries].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' })
      );
    }
    return entries;
  }, [entries, sortMode]);

  useEffect(() => {
    if (reorderMode) setManualOrder(sortedEntries);
  }, [reorderMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setManualOrder(items => {
      const oldIdx = items.findIndex(i => i.id === active.id);
      const newIdx = items.findIndex(i => i.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return items;
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const results = await Promise.all(
        manualOrder.map((entry, idx) =>
          supabase
            .from('exploration_curations')
            .update({ display_order: idx })
            .eq('id', entry.id)
        )
      );
      const firstError = results.find(r => r.error);
      if (firstError?.error) throw firstError.error;
      qc.invalidateQueries({ queryKey: ['exploration-curations', explorationId] });
      toast.success('Ordre enregistré');
      setReorderMode(false);
      setSortMode('manual');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingOrder(false);
    }
  };

  // Snapshot des pratiques visibles pour le ChatBot IA contextuel
  useChatTabSnapshot(
    'apprendre.main.pratiques',
    {
      count: entries.length,
      items: entries.slice(0, 20).map(e => ({
        id: e.id,
        title: e.title,
        description: e.description ? String(e.description).slice(0, 280) : null,
        media_count: (e.media_ids || []).length,
      })),
    },
  );

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

  // Sortable row for reorder mode
  const SortableRow: React.FC<{ entry: ExplorationCuration }> = ({ entry }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
      >
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Glisser pour réordonner"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{entry.title}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {(entry.media_ids || []).length} média{(entry.media_ids || []).length > 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Hand className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-foreground">Pratiques emblématiques</h3>
          <span className="text-xs text-muted-foreground">({entries.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!reorderMode && entries.length > 1 && (
            <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
              <button
                onClick={() => setSortMode('alpha')}
                className={`px-2 py-1 text-[11px] font-medium inline-flex items-center gap-1 transition-colors ${sortMode === 'alpha' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Tri alphabétique"
              >
                <ArrowDownAZ className="w-3 h-3" /> A→Z
              </button>
              <button
                onClick={() => setSortMode('manual')}
                className={`px-2 py-1 text-[11px] font-medium inline-flex items-center gap-1 transition-colors border-l border-border ${sortMode === 'manual' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Ordre manuel défini par le curateur"
              >
                <GripVertical className="w-3 h-3" /> Manuel
              </button>
            </div>
          )}
          {isCurator && entries.length > 1 && !reorderMode && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setReorderMode(true)}
              title="Réordonner manuellement"
            >
              <GripVertical className="w-3.5 h-3.5 mr-1" />
              Réordonner
            </Button>
          )}
          {isCurator && reorderMode && (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setReorderMode(false)} disabled={savingOrder}>
                Annuler
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={saveOrder} disabled={savingOrder}>
                <Check className="w-3.5 h-3.5 mr-1" />
                {savingOrder ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </>
          )}
          {isCurator && !reorderMode && (
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
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
      ) : reorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={manualOrder.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {manualOrder.map(entry => (
                <SortableRow key={entry.id} entry={entry} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map(entry => {
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
                    <div
                      className="text-xs text-muted-foreground max-w-none whitespace-pre-line [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1.5 [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.description) }}
                    />
                  )}
                  <PratiqueMarcheursPicker
                    curationId={entry.id}
                    explorationId={explorationId}
                    isCurator={isCurator}
                  />
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
              <RichTextEditor
                value={editor.description}
                onChange={(html) => setEditor(s => ({ ...s, description: html }))}
                placeholder="Racontez le geste, le savoir-faire, le contexte…"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Médias ({editor.mediaKeys.length})
              </label>

              {/* Double entrée : upload direct + bibliothèque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !user?.id}
                  className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition px-3 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Importer des photos depuis l'appareil"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? 'Envoi…' : 'Importer depuis l\'appareil'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition px-3 py-2.5 text-xs font-medium text-foreground"
                  aria-label="Choisir dans la bibliothèque de l'exploration"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Choisir dans la bibliothèque</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif,.HEIC,.HEIF"
                multiple
                hidden
                onChange={(e) => handlePickFiles(e.target.files)}
              />

              {uploading && uploadStage && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                  Traitement en cours · {uploadStage}
                </div>
              )}

              {editor.mediaKeys.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic text-center pt-1">
                  Aucun média sélectionné — importez une photo ou piochez dans la bibliothèque de l'exploration.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
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
        canReattribute={isCurator}
        marcheurs={marcheurs}
        explorationId={explorationId}
      />
    </div>
  );
};

export default MainCuration;
