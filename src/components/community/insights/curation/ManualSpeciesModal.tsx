import React, { useEffect, useState } from 'react';
import { Camera, Search, MapPin, Check, X, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGbifTaxonSearch, type GbifTaxonResult } from '@/hooks/useGbifTaxonSearch';
import { useCreateManualSpecies } from '@/hooks/useExplorationManualSpecies';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  open: boolean;
  onClose: () => void;
  explorationId: string;
  marcheEventId?: string | null;
  marcheLabel?: string;
}

type Step = 'photo' | 'identify' | 'context';

const ManualSpeciesModal: React.FC<Props> = ({
  open,
  onClose,
  explorationId,
  marcheEventId,
  marcheLabel,
}) => {
  const [step, setStep] = useState<Step>('photo');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [exifLat, setExifLat] = useState<number | null>(null);
  const [exifLng, setExifLng] = useState<number | null>(null);
  const [exifDate, setExifDate] = useState<string | null>(null);

  const [mode, setMode] = useState<'gbif' | 'free'>('gbif');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data: gbifResults = [], isLoading: gbifLoading } = useGbifTaxonSearch(debounced);
  const [selected, setSelected] = useState<GbifTaxonResult | null>(null);
  const [freeName, setFreeName] = useState('');
  const [freeSci, setFreeSci] = useState('');

  const [comment, setComment] = useState('');
  const create = useCreateManualSpecies();

  useEffect(() => {
    if (!open) {
      setStep('photo');
      setPhotoFile(null);
      setPhotoPreview(null);
      setExifLat(null);
      setExifLng(null);
      setExifDate(null);
      setSearch('');
      setSelected(null);
      setFreeName('');
      setFreeSci('');
      setComment('');
      setMode('gbif');
    }
  }, [open]);

  const onPhoto = async (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    // Try parse EXIF
    try {
      const exifr = await import('exifr');
      const meta = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal']);
      if (meta?.latitude) setExifLat(meta.latitude);
      if (meta?.longitude) setExifLng(meta.longitude);
      if (meta?.DateTimeOriginal) setExifDate(new Date(meta.DateTimeOriginal).toISOString());
    } catch {
      /* exifr optional */
    }
  };

  const canIdentify = !!photoFile;
  const canContext = mode === 'gbif' ? !!selected : freeName.trim().length > 1;
  const canSubmit = canIdentify && canContext;

  const handleSubmit = async () => {
    if (!photoFile) return;
    try {
      await create.mutateAsync({
        exploration_id: explorationId,
        marche_event_id: marcheEventId || null,
        scientific_name: mode === 'gbif' ? selected?.scientificName ?? null : freeSci || null,
        common_name: mode === 'gbif' ? selected?.commonName || selected?.canonicalName || '' : freeName,
        gbif_taxon_key: mode === 'gbif' ? selected?.key ?? null : null,
        group_taxon: mode === 'gbif' ? selected?.kingdom ?? null : null,
        photo_file: photoFile,
        photo_lat: exifLat,
        photo_lng: exifLng,
        observed_at: exifDate || new Date().toISOString(),
        comment: comment || null,
        source_mode: mode,
      });
      onClose();
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Espèce vue sur le terrain
            {marcheLabel && (
              <span className="text-xs font-normal text-muted-foreground ml-2">— {marcheLabel}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 text-xs">
          {(['photo', 'identify', 'context'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 ${
                  step === s ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === s ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="capitalize">{s === 'photo' ? 'Photo' : s === 'identify' ? 'Identifier' : 'Contexte'}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 */}
        {step === 'photo' && (
          <div className="space-y-3">
            <Label>Photo terrain (obligatoire)</Label>
            <label className="block aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer relative overflow-hidden bg-muted/30">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Choisir / prendre une photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && onPhoto(e.target.files[0])}
              />
            </label>
            {(exifLat || exifDate) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {exifLat && exifLng ? `${exifLat.toFixed(4)}, ${exifLng.toFixed(4)}` : ''}
                {exifDate && ` · ${new Date(exifDate).toLocaleDateString('fr-FR')}`}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep('identify')} disabled={!canIdentify}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 'identify' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'gbif' ? 'default' : 'outline'}
                onClick={() => setMode('gbif')}
                className="flex-1"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Recherche GBIF
              </Button>
              <Button
                size="sm"
                variant={mode === 'free' ? 'default' : 'outline'}
                onClick={() => setMode('free')}
                className="flex-1"
              >
                Saisie libre
              </Button>
            </div>

            {mode === 'gbif' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Nom commun ou scientifique…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {gbifLoading && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                      Recherche…
                    </div>
                  )}
                  {gbifResults.map(r => (
                    <button
                      key={r.key}
                      onClick={() => setSelected(r)}
                      className={`w-full text-left p-2 rounded-lg border flex gap-3 items-center transition ${
                        selected?.key === r.key
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.commonName || r.canonicalName}
                        </p>
                        <p className="text-xs text-muted-foreground italic truncate">
                          {r.scientificName} {r.family ? `· ${r.family}` : ''}
                        </p>
                      </div>
                      {selected?.key === r.key && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                  {!gbifLoading && debounced.length >= 2 && gbifResults.length === 0 && (
                    <p className="text-center py-4 text-xs text-muted-foreground">
                      Aucun résultat. Essaie « saisie libre ».
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="free-name">Nom commun *</Label>
                  <Input
                    id="free-name"
                    autoFocus
                    value={freeName}
                    onChange={e => setFreeName(e.target.value)}
                    placeholder="Ex: Bergeronnette des ruisseaux"
                  />
                </div>
                <div>
                  <Label htmlFor="free-sci">Nom scientifique (optionnel)</Label>
                  <Input
                    id="free-sci"
                    value={freeSci}
                    onChange={e => setFreeSci(e.target.value)}
                    placeholder="Ex: Motacilla cinerea"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('photo')}>
                Retour
              </Button>
              <Button onClick={() => setStep('context')} disabled={!canContext}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 'context' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3 flex gap-3">
              {photoPreview && (
                <img src={photoPreview} alt="" className="w-16 h-16 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {mode === 'gbif' ? selected?.commonName || selected?.canonicalName : freeName}
                </p>
                <p className="text-xs italic text-muted-foreground">
                  {mode === 'gbif' ? selected?.scientificName : freeSci || 'Sans nom scientifique'}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Note de terrain (optionnelle)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Comportement observé, biotope, anecdote…"
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('identify')}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || create.isPending}>
                {create.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualSpeciesModal;
