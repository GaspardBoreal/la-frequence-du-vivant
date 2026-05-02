import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Image as ImageIcon, Film, Sparkles, Layers, Play, Mic, Pause } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useExplorationAllMedia, type MediaItem } from '@/hooks/useExplorationAllMedia';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  explorationId: string;
  selectedKeys: string[];
  onConfirm: (keys: string[]) => void;
}

type TypeFilter = 'all' | 'photo' | 'video' | 'audio' | 'conv';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

const formatDuration = (sec?: number | null) => {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const MediaPickerSheet: React.FC<Props> = ({
  open, onOpenChange, explorationId, selectedKeys, onConfirm,
}) => {
  const { data, isLoading } = useExplorationAllMedia(explorationId);
  const [draft, setDraft] = useState<Set<string>>(new Set(selectedKeys));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [marcheFilter, setMarcheFilter] = useState<string>('all');
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  // Reset draft when reopening with new selection
  useEffect(() => {
    if (open) setDraft(new Set(selectedKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (key: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const sections = useMemo(() => {
    const out: Array<{
      id: string;
      kind: 'event' | 'conv';
      title: string;
      subtitle?: string;
      items: MediaItem[];
    }> = [];

    const showConv = typeFilter === 'all' || typeFilter === 'conv' || typeFilter === 'photo';
    const showEvents = typeFilter !== 'conv';
    // audio filter: convivialité (photos only) doesn't apply

    if (showEvents) {
      data.events.forEach(ev => {
        if (marcheFilter !== 'all' && marcheFilter !== ev.id) return;
        let items = ev.items;
        if (typeFilter === 'photo') items = items.filter(i => i.type === 'photo');
        else if (typeFilter === 'video') items = items.filter(i => i.type === 'video');
        else if (typeFilter === 'audio') items = items.filter(i => i.type === 'audio');
        out.push({
          id: ev.id,
          kind: 'event',
          title: ev.title,
          subtitle: [formatDate(ev.date), ev.lieu].filter(Boolean).join(' · '),
          items,
        });
      });
    }

    if (showConv && marcheFilter === 'all') {
      out.push({
        id: 'convivialite',
        kind: 'conv',
        title: 'Convivialité',
        subtitle: 'Mur partagé de l\'exploration',
        items: data.convivialite,
      });
    }
    return out;
  }, [data, typeFilter, marcheFilter]);

  const totalShown = sections.reduce((s, sec) => s + sec.items.length, 0);
  const selectedCount = draft.size;

  const chips: { id: TypeFilter; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Tous', icon: Layers },
    { id: 'photo', label: 'Photos', icon: ImageIcon },
    { id: 'video', label: 'Vidéos', icon: Film },
    { id: 'audio', label: 'Audios', icon: Mic },
    { id: 'conv', label: 'Convivialité', icon: Sparkles },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[88vh] p-0 flex flex-col gap-0 sm:max-w-3xl sm:mx-auto sm:rounded-t-2xl"
      >
        {/* Header */}
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground leading-tight">
                Choisir les médias
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedCount > 0
                  ? `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}`
                  : 'Toutes les marches & le mur Convivialité'}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="shrink-0 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type chips */}
          <div
            className="mt-3 -mx-4 px-4 flex items-center gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {chips.map(c => {
              const Icon = c.icon;
              const active = typeFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setTypeFilter(c.id)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    active
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Marche selector */}
          {data.events.length > 1 && (
            <div className="mt-2.5">
              <Select value={marcheFilter} onValueChange={setMarcheFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Toutes les marches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marches</SelectItem>
                  {data.events.map(ev => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {formatDate(ev.date)} — {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-12">Chargement des médias…</div>
          ) : totalShown === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              Aucun média ne correspond à ces filtres.
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map(section => (
                <section key={section.id}>
                  <header className="sticky top-0 z-[1] -mx-3 sm:-mx-4 px-3 sm:px-4 py-1.5 bg-background/95 backdrop-blur-sm border-b border-border/40">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                          {section.kind === 'conv' && <Sparkles className="w-3 h-3 text-emerald-500" />}
                          {section.title}
                        </h3>
                        {section.subtitle && (
                          <p className="text-[10px] text-muted-foreground truncate">{section.subtitle}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {section.items.length}
                      </span>
                    </div>
                  </header>

                  {section.items.length === 0 ? (
                    <p className="text-[11px] italic text-muted-foreground/70 px-1 py-3">
                      Aucun média pour cette marche.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                      {section.items.map(item => {
                        const selected = draft.has(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggle(item.key)}
                            className={cn(
                              'relative aspect-square rounded-lg overflow-hidden border-2 transition group',
                              selected ? 'border-emerald-500' : 'border-transparent hover:border-border'
                            )}
                          >
                            {item.type === 'video' ? (
                              <>
                                <video
                                  src={`${item.url}#t=0.1`}
                                  preload="metadata"
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover bg-muted"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <div className="absolute bottom-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  {formatDuration(item.durationSec) || 'vidéo'}
                                </div>
                              </>
                            ) : (
                              <img
                                src={item.url}
                                alt={item.titre || ''}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover bg-muted"
                              />
                            )}
                            {selected && (
                              <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className="shrink-0 px-4 py-3 border-t border-border bg-background/95 backdrop-blur-sm flex items-center gap-2"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { onConfirm(Array.from(draft)); onOpenChange(false); }}
          >
            Valider {selectedCount > 0 && `· ${selectedCount}`}
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
};

export default MediaPickerSheet;
