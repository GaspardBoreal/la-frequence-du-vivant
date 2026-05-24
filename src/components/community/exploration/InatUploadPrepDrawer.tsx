import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Upload, Download, MapPin, AlertTriangle, Loader2, X as XIcon, Check, Maximize2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMarcheurUnidentifiedPhotos, type UnidentifiedPhotoCandidate } from '@/hooks/useMarcheurUnidentifiedPhotos';
import InatUploadFullscreen from './InatUploadFullscreen';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  marcheurPrenom: string;
  marcheurNom: string;
  marcheurSlug: string;
  crewId: string | null;
  resolvedUserId: string | null;
  explorationId?: string;
  explorationMarcheIds: string[];
  /** ids des `marche_events` de l'exploration (référentiel des medias) */
  explorationEventIds: string[];
  /** URLs déjà rattachées à une espèce identifiée (à exclure). */
  identifiedPhotoUrls: Set<string>;
}

interface MarcheLite {
  id: string;
  title: string;
  date_marche: string | null;
  latitude: number | null;
  longitude: number | null;
}

const csvEscape = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const isoDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
};

const extFromUrl = (url: string): string => {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : 'jpg';
  } catch { return 'jpg'; }
};

const InatUploadPrepDrawer: React.FC<Props> = ({
  open, onOpenChange,
  marcheurPrenom, marcheurNom, marcheurSlug,
  crewId, resolvedUserId, explorationId, explorationMarcheIds, explorationEventIds,
  identifiedPhotoUrls,
}) => {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [useMarcheGpsFallback, setUseMarcheGpsFallback] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const { data: candidates = [], isLoading } = useMarcheurUnidentifiedPhotos({
    crewId, resolvedUserId, explorationMarcheIds, explorationEventIds, identifiedPhotoUrls,
    explorationId, enabled: open,
  });

  const { data: marches = [] } = useQuery({
    queryKey: ['inat-prep-marches', explorationEventIds.slice().sort().join(',')],
    queryFn: async (): Promise<MarcheLite[]> => {
      if (!explorationEventIds.length) return [];
      const { data } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, latitude, longitude')
        .in('id', explorationEventIds);
      return (data || []) as MarcheLite[];
    },
    enabled: open && explorationEventIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const marcheById = useMemo(() => {
    const m = new Map<string, MarcheLite>();
    marches.forEach(x => m.set(x.id, x));
    return m;
  }, [marches]);

  const selected = useMemo(
    () => candidates.filter(c => !excluded.has(c.id)),
    [candidates, excluded],
  );

  const stats = useMemo(() => {
    let exif = 0, fallback = 0, none = 0;
    candidates.forEach(c => {
      if (c.gps) { exif++; return; }
      const m = marcheById.get(c.marcheEventId);
      if (m?.latitude && m?.longitude) fallback++;
      else none++;
    });
    return { exif, fallback, none, total: candidates.length };
  }, [candidates, marcheById]);

  useEffect(() => { if (!open) { setExcluded(new Set()); setProgress(null); } }, [open]);

  const toggleExclude = (id: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const buildCsvRow = (c: UnidentifiedPhotoCandidate, filename: string): string[] => {
    const marche = marcheById.get(c.marcheEventId);
    const date = isoDate(c.dateTaken) || isoDate(marche?.date_marche || null);
    let lat: number | null = c.gps?.latitude ?? null;
    let lng: number | null = c.gps?.longitude ?? null;
    if ((lat === null || lng === null) && useMarcheGpsFallback && marche?.latitude && marche?.longitude) {
      lat = marche.latitude;
      lng = marche.longitude;
    }
    const description = `Observation Les Marches du Vivant — ${marche?.title || ''}`;
    const tags = `observateur:${marcheurSlug},marches-du-vivant`;
    return [
      filename,
      date,
      lat !== null ? String(lat) : '',
      lng !== null ? String(lng) : '',
      '', // positional_accuracy
      description,
      tags,
    ].map(csvEscape);
  };

  const handleGenerate = async () => {
    if (!selected.length) return;
    setBusy(true);
    setProgress({ done: 0, total: selected.length });
    try {
      const zip = new JSZip();
      const photosFolder = zip.folder('photos')!;
      const csvLines: string[] = [
        ['image', 'observed_on', 'latitude', 'longitude', 'positional_accuracy', 'description', 'tag_list'].join(','),
      ];

      let i = 0;
      for (const c of selected) {
        i++;
        try {
          const ext = extFromUrl(c.url);
          const filename = `IMG_${String(i).padStart(3, '0')}.${ext}`;
          const res = await fetch(c.url);
          if (!res.ok) throw new Error(`fetch ${res.status}`);
          const blob = await res.blob();
          photosFolder.file(filename, blob);
          csvLines.push(buildCsvRow(c, `photos/${filename}`).join(','));
        } catch (err) {
          console.warn('[InatPrep] skip', c.url, err);
        }
        setProgress({ done: i, total: selected.length });
      }

      zip.file('observations.csv', csvLines.join('\n'));
      zip.file(
        'README.txt',
        [
          'Pack iNaturalist — Les Marches du Vivant',
          '',
          `Marcheur : ${marcheurPrenom} ${marcheurNom}`,
          `Tag d'attribution : observateur:${marcheurSlug}`,
          '',
          'Comment importer :',
          '  1. Connectez-vous au compte « Les Marches du Vivant » sur iNaturalist.',
          '  2. Allez sur https://www.inaturalist.org/observations/upload',
          '  3. Glissez le dossier "photos/" dans la zone d\'upload (ou les fichiers).',
          '  4. iNat propose une identification automatique (Computer Vision).',
          '  5. Recopiez la date, latitude, longitude depuis observations.csv si nécessaire.',
          '  6. Vérifiez que la description / tags contiennent bien le tag observateur.',
          '',
          'Le tag observateur permet à l\'app de ré-attribuer automatiquement',
          'l\'observation au marcheur lors du prochain sync.',
        ].join('\n'),
      );

      const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
        // progression de compression (optionnel)
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inat-upload-${marcheurSlug}-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(`ZIP généré : ${selected.length} photo${selected.length > 1 ? 's' : ''}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error('[InatPrep] zip error', err);
      toast.error('Erreur lors de la génération du ZIP');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-2">
          <SheetTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-500" />
            Préparer upload iNaturalist
          </SheetTitle>
          <SheetDescription>
            Pack ZIP des photos perso de <strong>{marcheurPrenom} {marcheurNom}</strong> non encore identifiées,
            prêt à glisser sur iNaturalist.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Aucune photo à identifier</p>
            <p className="text-xs text-muted-foreground mt-1">
              Toutes les photos perso de ce marcheur sont déjà rattachées à une espèce.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-500/10 px-2 py-2">
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.exif}</div>
                <div className="text-[10px] text-muted-foreground">GPS EXIF ✅</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 px-2 py-2">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.fallback}</div>
                <div className="text-[10px] text-muted-foreground">GPS marche ⚠️</div>
              </div>
              <div className="rounded-lg bg-rose-500/10 px-2 py-2">
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{stats.none}</div>
                <div className="text-[10px] text-muted-foreground">Sans GPS 🔴</div>
              </div>
            </div>

            {/* Options */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Hériter du GPS de la marche</p>
                  <p className="text-[10px] text-muted-foreground">
                    Si une photo n'a pas d'EXIF GPS, utiliser les coords de la marche.
                  </p>
                </div>
                <Switch checked={useMarcheGpsFallback} onCheckedChange={setUseMarcheGpsFallback} />
              </div>
              <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
                Tag d'attribution iNat : <code className="bg-muted px-1 py-0.5 rounded">observateur:{marcheurSlug}</code>
              </div>
            </div>

            {/* Liste */}
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
              {candidates.map((c) => {
                const isExcluded = excluded.has(c.id);
                const marche = marcheById.get(c.marcheEventId);
                const hasGps = !!c.gps;
                const hasFallback = !hasGps && !!(marche?.latitude && marche?.longitude);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-opacity ${
                      isExcluded ? 'opacity-40 border-dashed border-muted' : 'border-border bg-card'
                    }`}
                  >
                    <img
                      src={c.url}
                      alt=""
                      loading="lazy"
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {marche?.title || '—'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {hasGps && <span className="text-emerald-600 dark:text-emerald-400">✅ GPS EXIF</span>}
                        {hasFallback && useMarcheGpsFallback && <span className="text-amber-600 dark:text-amber-400">⚠️ GPS marche</span>}
                        {!hasGps && !hasFallback && <span className="text-rose-600 dark:text-rose-400">🔴 sans GPS</span>}
                        {(c.dateTaken || marche?.date_marche) && (
                          <span>· {isoDate(c.dateTaken) || isoDate(marche?.date_marche || null)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExclude(c.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      aria-label={isExcluded ? 'Inclure' : 'Exclure'}
                    >
                      {isExcluded ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border space-y-2">
              {stats.none > 0 && (
                <p className="flex items-start gap-1.5 text-[10px] text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {stats.none} photo{stats.none > 1 ? 's' : ''} sans GPS — iNat acceptera l'import mais sans localisation.
                </p>
              )}
              <Button
                onClick={handleGenerate}
                disabled={busy || selected.length === 0}
                className="w-full"
                variant="default"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {progress ? `${progress.done}/${progress.total}` : 'Génération…'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le ZIP ({selected.length} photo{selected.length > 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default InatUploadPrepDrawer;
