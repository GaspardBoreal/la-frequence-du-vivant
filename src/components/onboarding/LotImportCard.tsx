/**
 * Carte d'import d'un lot ZIP d'exemples de jardin (Admin → Onboarding).
 *
 * Le ZIP éditorial (manifeste JSON + images calibrées) est validé, les images
 * sont téléversées telles quelles dans `onboarding-gallery`, puis le type et
 * les exemples sont upserts par identifiant stable. Un rapport détaillé est
 * affiché à la fin, avec les erreurs éventuelles par fichier.
 */
import { useRef, useState } from 'react';
import { CheckCircle2, FileArchive, Loader2, TriangleAlert, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { importGardenLot, type LotReport } from '@/lib/onboarding/importGardenLot';

interface Props {
  onDone: () => void;
}

export default function LotImportCard({ onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [report, setReport] = useState<LotReport | null>(null);

  const run = async (file: File) => {
    setRunning(true);
    setReport(null);
    setSteps([]);
    try {
      const r = await importGardenLot(file, (m) => setSteps((s) => [...s, m]));
      setReport(r);
      const ko = r.images.filter((i) => !i.ok).length;
      if (r.errors.length === 0) {
        toast.success(`Import terminé : ${r.exemples.length} exemples, ${r.images.length} images.`);
      } else {
        toast.warning(`Import terminé avec ${r.errors.length} avertissement(s) (${ko} image(s) en échec).`);
      }
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      setRunning(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={running}
          onClick={() => inputRef.current?.click()}
        >
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {running ? 'Import…' : 'Choisir un ZIP'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void run(f);
          }}
        />
      </div>

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
