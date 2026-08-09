import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Stethoscope, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  useCreateConsultation,
  useSaveDiagnostic,
  useAddConsultationMedia,
  useDiagnoseDisease,
  type PathogenKbEntry,
} from '@/hooks/propriete/useGardenClinique';

const ORGANS = ['Feuille', 'Jeune pousse', 'Fleur', 'Fruit', 'Rameau', 'Écorce', 'Collet', 'Racine'];
const ONSETS = ['Depuis quelques jours', 'Depuis deux à trois semaines', 'Depuis ce printemps', 'Depuis plusieurs saisons'];
const SEVERITIES = ['À peine visible', 'Quelques organes', 'Une bonne moitié', 'Presque tout le sujet', 'Le sujet décline'];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export const NewConsultationDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proprieteId: string;
  speciesOptions: Array<{ scientificName: string; commonName: string }>;
  soil: Record<string, unknown> | null;
  weather: { tempMean?: number; tempMax?: number; precipSum?: number; humidityMean?: number } | null;
  kb: PathogenKbEntry[];
  onCreated?: (consultationId: string) => void;
}> = ({ open, onOpenChange, proprieteId, speciesOptions, soil, weather, kb, onCreated }) => {
  const [subject, setSubject] = React.useState('');
  const [scientific, setScientific] = React.useState<string | null>(null);
  const [organ, setOrgan] = React.useState<string>(ORGANS[0]);
  const [aspect, setAspect] = React.useState('');
  const [onset, setOnset] = React.useState<string>(ONSETS[0]);
  const [severity, setSeverity] = React.useState(2);
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [step, setStep] = React.useState<'form' | 'thinking'>('form');

  const create = useCreateConsultation(proprieteId);
  const saveDiag = useSaveDiagnostic(proprieteId);
  const addMedia = useAddConsultationMedia(proprieteId);
  const diagnose = useDiagnoseDisease();

  const reset = () => {
    setSubject(''); setScientific(null); setOrgan(ORGANS[0]); setAspect('');
    setOnset(ONSETS[0]); setSeverity(2); setFiles([]); setPreviews([]); setStep('form');
  };

  const suggestions = React.useMemo(() => {
    const q = subject.trim().toLowerCase();
    if (q.length < 2) return [];
    return speciesOptions
      .filter((s) => s.commonName?.toLowerCase().includes(q) || s.scientificName?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [subject, speciesOptions]);

  const onPick = async (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).slice(0, 4);
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!subject.trim()) { toast.error('Nommez le sujet observé.'); return; }
    setStep('thinking');
    try {
      const consultation = await create.mutateAsync({
        subject_label: subject.trim(),
        subject_scientific_name: scientific,
        subject_source: scientific ? 'inaturalist' : 'manuel',
        organ,
        aspect: aspect.trim() || null,
        onset,
        severity,
        status: 'observation',
      } as any);

      // Médias horodatés d'abord : ils constituent la première page du journal.
      for (const f of files) {
        const type = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'photo';
        await addMedia.mutateAsync({
          consultationId: consultation.id,
          file: f,
          mediaType: type as 'photo' | 'video' | 'audio',
          severity,
        });
      }

      const images = await Promise.all(
        files.filter((f) => f.type.startsWith('image')).slice(0, 3).map(fileToDataUrl),
      );

      const relevantKb = kb
        .filter((e) =>
          (e.hosts || []).some((h) => subject.toLowerCase().includes(h.toLowerCase())) ||
          (e.organs || []).some((o) => o.toLowerCase() === organ.toLowerCase()),
        )
        .slice(0, 10);

      const result = await diagnose.mutateAsync({
        subject: subject.trim(),
        organ,
        aspect,
        onset,
        images,
        soil,
        weather,
        kb: relevantKb.length ? relevantKb : kb.slice(0, 10),
        month: new Date().getMonth() + 1,
      });

      await saveDiag.mutateAsync({
        consultationId: consultation.id,
        hypotheses: (result.hypotheses || []).map((h) => ({
          common_name: h.common_name ?? 'Hypothèse',
          scientific_name: h.scientific_name ?? null,
          kind: h.kind ?? null,
          confidence: typeof h.confidence === 'number' ? h.confidence : 0.5,
          what_you_see: h.what_you_see ?? null,
          confusions: h.confusions ?? null,
          gravity: h.gravity ?? null,
          terrain_reading: h.terrain_reading ?? null,
        })),
        actions: (result.actions || []).map((a) => ({
          volet: (a.volet === 'preventif' ? 'preventif' : 'curatif') as 'curatif' | 'preventif',
          intensity: Math.max(1, Math.min(5, Number(a.intensity) || 1)),
          label: a.label ?? 'Geste',
          detail: a.detail ?? null,
          frequency: a.frequency ?? null,
          weather_caution: a.weather_caution ?? null,
        })),
      });

      toast.success('Consultation ouverte · le jardin a répondu');
      onCreated?.(consultation.id);
      onOpenChange(false);
      reset();
    } catch {
      setStep('form');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-[hsl(var(--ds-cream))] border-[hsl(var(--ds-line))]">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
            Ouvrir une consultation
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--ds-forest))]/75">
            Une photo, trois questions : le jardin raconte d'abord, le diagnostic vient ensuite.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'thinking' ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-14 text-center"
            >
              <Loader2 className="h-7 w-7 animate-spin text-[hsl(var(--ds-forest))]" />
              <p className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]">
                Le médecin du jardin observe…
              </p>
              <p className="max-w-sm text-xs text-[hsl(var(--ds-forest))]/70">
                Il croise vos images avec le registre du sol, la météo des trente derniers jours
                et la base des maladies connues.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Sujet */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                  Le sujet observé
                </label>
                <Input
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setScientific(null); }}
                  placeholder="Groseillier, marronnier d'Inde, cerisier…"
                  className="mt-1.5 bg-white/70 text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest-deep))]/45"
                />
                {suggestions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s.scientificName}
                        type="button"
                        onClick={() => { setSubject(s.commonName || s.scientificName); setScientific(s.scientificName); }}
                        className="rounded-full border border-[hsl(var(--ds-line))] bg-white px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
                      >
                        {s.commonName || s.scientificName}
                        <span className="ml-1 italic opacity-60">{s.scientificName}</span>
                      </button>
                    ))}
                  </div>
                )}
                {scientific && (
                  <p className="mt-1 text-[11px] italic text-[hsl(var(--ds-forest))]/70">
                    Rattaché aux Observations du site : {scientific}
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                  Les preuves (jusqu'à 4 médias)
                </label>
                <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-white/50 py-6 text-sm text-[hsl(var(--ds-forest))]/80 transition hover:bg-white/80">
                  <Camera className="h-4 w-4" />
                  Photo de près, photo d'ensemble, vidéo ou vocal
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    className="hidden"
                    onChange={(e) => onPick(e.target.files)}
                  />
                </label>
                {previews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previews.map((p, i) => (
                      <div key={p} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[hsl(var(--ds-line))]">
                        {files[i]?.type.startsWith('image') ? (
                          <img src={p} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/70 text-[10px]">
                            {files[i]?.type.startsWith('video') ? 'Vidéo' : 'Vocal'}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFiles((f) => f.filter((_, j) => j !== i));
                            setPreviews((f) => f.filter((_, j) => j !== i));
                          }}
                          className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white"
                          aria-label="Retirer ce média"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trois questions */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                    Où cela se voit-il ?
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ORGANS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOrgan(o)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          organ === o
                            ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                            : 'border-[hsl(var(--ds-line))] bg-white text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                    Depuis quand ?
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ONSETS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOnset(o)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          onset === o
                            ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                            : 'border-[hsl(var(--ds-line))] bg-white text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                  Jusqu'où cela s'étend-il ?
                </label>
                <div className="mt-1.5 grid grid-cols-5 gap-1">
                  {SEVERITIES.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(i + 1)}
                      className={`rounded-lg border px-1 py-2 text-[10px] leading-tight transition ${
                        severity === i + 1
                          ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                          : 'border-[hsl(var(--ds-line))] bg-white text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                  Ce que vous voyez, avec vos mots
                </label>
                <Textarea
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value)}
                  rows={3}
                  placeholder="Taches brunes anguleuses, feuilles qui tombent, poudre blanche au revers…"
                  className="mt-1.5 bg-white/70 text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest-deep))]/45"
                />
              </div>

              <button
                type="button"
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-4 py-3 text-sm font-medium text-[hsl(var(--ds-cream))] transition hover:brightness-110"
              >
                <Stethoscope className="h-4 w-4 text-[hsl(var(--ds-gold))]" />
                Consulter le médecin du jardin
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default NewConsultationDialog;
