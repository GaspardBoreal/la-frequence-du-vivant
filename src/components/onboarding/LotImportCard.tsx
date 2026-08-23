/**
 * Carte d'import d'un lot ZIP d'exemples de jardin (Admin → Onboarding).
 *
 * Assistant en deux temps, sans aucune écriture avant validation :
 *   1. « Choisir un ZIP » → analyse du manifeste (type détecté, exemples, images) ;
 *   2. choix du type associé (rattachement à un type existant — présélectionné
 *      quand le manifeste le désigne — ou création d'un nouveau type) ;
 *   3. « Lancer l'import » → upload des images telles quelles, upsert par
 *      identifiant stable, rapport détaillé.
 *
 * Relançable sans doublon : les exemples sont mis à jour par identifiant stable.
 */
import { useRef, useState } from 'react';
import { CheckCircle2, FileArchive, Loader2, TriangleAlert, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  analyzeGardenLot,
  importGardenLot,
  type LotAnalysis,
  type LotReport,
} from '@/lib/onboarding/importGardenLot';

interface Props {
  onDone: () => void;
}

const NEW_TYPE = '__new__';

export default function LotImportCard({ onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LotAnalysis | null>(null);
  const [target, setTarget] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [report, setReport] = useState<LotReport | null>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const cancel = () => {
    setAnalysis(null);
    setTarget('');
    resetInput();
  };

  /** Étape 1 : lecture et validation du ZIP, sans écriture. */
  const analyze = async (file: File) => {
    setAnalyzing(true);
    setReport(null);
    try {
      const a = await analyzeGardenLot(file);
      setAnalysis(a);
      // Le type désigné par le manifeste est présélectionné ; sinon l'admin choisit.
      setTarget(a.matchedTypeId ?? '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ZIP illisible.');
      resetInput();
    } finally {
      setAnalyzing(false);
    }
  };

  /** Étape 2 : import effectif, rattaché au type choisi. */
  const run = async () => {
    if (!analysis || !target) return;
    setRunning(true);
    setReport(null);
    setSteps([]);
    try {
      const r = await importGardenLot(
        analysis.file,
        (m) => setSteps((s) => [...s, m]),
        { targetTypeId: target === NEW_TYPE ? null : target },
      );
      setReport(r);
      const ko = r.images.filter((i) => !i.ok).length;
      if (r.errors.length === 0) {
        toast.success(`Import terminé : ${r.exemples.length} exemples, ${r.images.length} images.`);
      } else {
        toast.warning(`Import terminé avec ${r.errors.length} avertissement(s) (${ko} image(s) en échec).`);
      }
      setAnalysis(null);
      setTarget('');
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import impossible.');
    } finally {
      setRunning(false);
      resetInput();
    }
  };

  const chosenCandidate = analysis?.candidates.find((c) => c.id === target);
  const divergentStableId =
    analysis && chosenCandidate?.stable_id && chosenCandidate.stable_id !== analysis.manifest.garden_type.id
      ? chosenCandidate.stable_id
      : null;

  return (
    <section className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="flex items-start gap-3">
        <FileArchive className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Importer un lot (ZIP)</h3>
          <p className="text-xs text-muted-foreground">
            Manifeste JSON + images calibrées (grands + vignettes). Relançable sans doublon :
            les exemples sont mis à jour par identifiant stable.
          </p>
        </div>
        {!analysis && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={analyzing || running}
            onClick={() => inputRef.current?.click()}
          >
            {analyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {analyzing ? 'Analyse…' : 'Choisir un ZIP'}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void analyze(f);
          }}
        />
      </div>

      {analysis && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs">
              <p className="font-medium">
                Lot détecté : {analysis.manifest.garden_type.label}{' '}
                <span className="font-mono text-muted-foreground">
                  ({analysis.manifest.garden_type.id})
                </span>
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {analysis.manifest.examples.length} exemples ·{' '}
                {analysis.manifest.examples.length * 2} images · aucune écriture avant lancement
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={cancel} aria-label="Annuler">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lot-target-type" className="text-xs">
              Type associé à cet import
            </Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="lot-target-type" className="h-9 text-xs">
                <SelectValue placeholder="Choisir le type à enrichir…" />
              </SelectTrigger>
              <SelectContent>
                {analysis.candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.titre} <span className="text-muted-foreground">· {c.slug} · {c.exemplesCount} ex.</span>
                    {c.id === analysis.matchedTypeId ? ' ✓ détecté' : ''}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_TYPE} className="text-xs font-medium">
                  ＋ Créer un nouveau type « {analysis.manifest.garden_type.label} »
                </SelectItem>
              </SelectContent>
            </Select>
            {divergentStableId && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Ce type est déjà rattaché au lot « {divergentStableId} » : l'import le re-pointera
                vers « {analysis.manifest.garden_type.id} ».
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={running}>
              Annuler
            </Button>
            <Button type="button" size="sm" onClick={() => void run()} disabled={!target || running}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {running ? 'Import…' : "Lancer l'import"}
            </Button>
          </div>
        </div>
      )}

      {running && steps.length > 0 && (
        <ol className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg bg-muted/50 p-2 font-mono text-[11px] text-muted-foreground">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}

      {report && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-xs">
          <p className="font-medium">
            Type « {report.typeStableId} » {report.typeAction} — {report.exemples.length} exemples,{' '}
            {report.images.filter((i) => i.ok).length}/{report.images.length} images téléversées.
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {report.exemples.map((e) => (
              <li key={e.stable_id} className="flex items-center gap-1.5">
                {e.imagesOk === e.imagesTotal ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
                <span className="truncate">
                  {e.titre} <span className="text-muted-foreground">({e.action}, {e.imagesOk}/{e.imagesTotal} images)</span>
                </span>
              </li>
            ))}
          </ul>
          {report.errors.length > 0 && (
            <ul className="space-y-0.5 border-t pt-2 text-[11px] text-destructive">
              {report.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
