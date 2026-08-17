import React from 'react';
import { Layers, Radio, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import { useIotAnalyses, usePaletteFit, WINDOWS } from '@/hooks/iot/useIotAnalyses';
import SimpleVerdictCard from './SimpleVerdictCard';
import RhythmPanel from './RhythmPanel';
import SensorCompare from './SensorCompare';
import AgronomicDossier from './AgronomicDossier';
import ClimateCard from './ClimateCard';
import type { SensorAnalysis } from '@/lib/iot/analyses';
import type { SensorSpan } from '@/hooks/iot/useIotTelemetry';

const LEVELS = [
  { key: 'simple', label: 'Simple', hint: 'Que planter ici, maintenant ?' },
  { key: 'intermediaire', label: 'Intermédiaire', hint: 'Comment ce coin respire' },
  { key: 'avance', label: 'Avancée', hint: 'Le dossier agronomique' },
] as const;
type LevelKey = (typeof LEVELS)[number]['key'];

/** Corps des niveaux 2 et 3 : isolé pour porter le hook de concordance palette. */
const SensorDeepRead: React.FC<{
  level: LevelKey;
  capteur: any;
  analysis: SensorAnalysis;
  capteurs: any[];
  byCapteur: Map<string, SensorAnalysis>;
  span?: SensorSpan | null;
}> = ({ level, capteur, analysis, capteurs, byCapteur, span }) => {
  const fit = usePaletteFit(capteur?.propriete_id ?? undefined, analysis);

  if (level === 'intermediaire') {
    return (
      <div className="space-y-4">
        <RhythmPanel analysis={analysis} />
        <SensorCompare capteurs={capteurs} byCapteur={byCapteur} />
      </div>
    );
  }
  if (analysis.profile.isWeather) {
    return (
      <div className="space-y-4">
        <ClimateCard capteur={capteur} analysis={analysis} span={span} />
        <RhythmPanel analysis={analysis} />
      </div>
    );
  }
  return <AgronomicDossier analysis={analysis} fit={fit} />;
};

/** Niveau 1 : une carte par sonde, avec ses trois espèces suggérées. */
const SimpleRow: React.FC<{ capteur: any; analysis: SensorAnalysis; span?: SensorSpan | null }> = ({
  capteur,
  analysis,
  span,
}) => {
  const fit = usePaletteFit(capteur?.propriete_id ?? undefined, analysis);
  if (analysis.profile.isWeather) return <ClimateCard capteur={capteur} analysis={analysis} span={span} />;
  return <SimpleVerdictCard capteur={capteur} analysis={analysis} suggestions={fit?.rows ?? []} span={span} />;
};

/**
 * Onglet « Analyses » de la console des sondes : trois niveaux de lecture d'une
 * même donnée, tous orientés vers une décision de plantation.
 */
const AnalysesTab: React.FC = () => {
  const [windowDays, setWindowDays] = React.useState<number>(30);
  const [level, setLevel] = React.useState<LevelKey>('simple');
  const [selected, setSelected] = React.useState<string | null>(null);

  const { capteurs, excluded, byCapteur, isLoading, mesureCount, spans, truncated } = useIotAnalyses(windowDays);

  const capteur = React.useMemo(
    () => capteurs.find((c) => c.id === selected) ?? capteurs[0] ?? null,
    [capteurs, selected],
  );
  const analysis = capteur ? byCapteur.get(capteur.id) ?? null : null;


  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-3">
        <Layers className="h-4 w-4 text-primary" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">Analyses</div>
          <p className="text-[11px] text-muted-foreground">
            {isLoading
              ? 'Lecture des mesures…'
              : `${capteurs.length} sonde${capteurs.length > 1 ? 's' : ''} · ${mesureCount} relevés sur ${windowDays} jours`}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border/60 bg-background p-1">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setWindowDays(w.days)}
                className={`rounded-full px-3 py-1 text-[11px] transition ${
                  windowDays === w.days ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-border/60 bg-background p-1">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLevel(l.key)}
                title={l.hint}
                className={`rounded-full px-3 py-1 text-[11px] transition ${
                  level === l.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {truncated && (
        <div className="rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/10 p-3 text-xs text-muted-foreground">
          Lecture partielle : {mesureCount} relevés lus sur cette fenêtre, les plus anciens ne sont pas pris en compte.
          Les verdicts portent sur la période effectivement lue, indiquée sous chaque sonde.
        </div>
      )}


      {excluded.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Sondes écartées des analyses
          </div>
          <ul className="mt-2 space-y-1">
            {excluded.map((e) => (
              <li key={e.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{e.nom}</span> — {e.label}
                {e.motif ? ` · ${e.motif}` : ''}
                {e.depuis ? ` · depuis le ${new Date(e.depuis).toLocaleDateString('fr-FR')}` : ''}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Leur silence est attendu : elles ne produisent ni verdict ni alerte tant qu’elles ne sont pas remises en
            service.
          </p>
        </div>
      )}

      {capteurs.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Aucune sonde dans ce périmètre.
        </div>
      )}

      {level === 'simple' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {capteurs.map((c) => {
            const a = byCapteur.get(c.id);
            return a ? <SimpleRow key={c.id} capteur={c} analysis={a} span={spans[c.id] ?? null} /> : null;
          })}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {capteurs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  capteur?.id === c.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Radio className="h-3 w-3" /> {c.nom}
              </button>
            ))}
          </div>

          {capteur && analysis ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold">{capteur.nom}</span>
                  <span className="text-muted-foreground"> · {capteur.propriete?.nom ?? 'propriété inconnue'}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() =>
                    openIotAi({
                      capteurId: capteur.id,
                      proprieteId: capteur.propriete_id,
                      prefill:
                        level === 'avance'
                          ? `Fais-moi une lecture agronomique des ${windowDays} derniers jours de la sonde « ${capteur.nom} » : réserve d'eau, température du sol, conséquences sur la palette végétale.`
                          : `Que disent les rythmes des ${windowDays} derniers jours de la sonde « ${capteur.nom} » ?`,
                    })
                  }
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Interroger l’IA de Jardin
                </Button>
              </div>

              <SensorDeepRead
                level={level}
                capteur={capteur}
                analysis={analysis}
                capteurs={capteurs}
                byCapteur={byCapteur}
                span={spans[capteur.id] ?? null}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AnalysesTab;
