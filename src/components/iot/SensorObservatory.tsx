import React from 'react';
import {
  CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Download, FileText, Sparkles, X } from 'lucide-react';
import { openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { VitalityStrip } from '@/components/iot/VitalityStrip';
import { useMesureSeriesRange } from '@/hooks/iot/useIotTelemetry';
import { grandeurMeta, fmtProfondeur, fmtHorodatage, compareGrandeurs } from '@/lib/iot/grandeurs';
import { fullscreenSurfaces } from '@/lib/uiOverlayLevel';


type PresetKey = '24h' | '7j' | '30j' | '90j' | '1an' | 'perso';

const PRESETS: { key: PresetKey; label: string; hours?: number }[] = [
  { key: '24h', label: '24 h', hours: 24 },
  { key: '7j', label: '7 jours', hours: 24 * 7 },
  { key: '30j', label: '30 jours', hours: 24 * 30 },
  { key: '90j', label: '90 jours', hours: 24 * 90 },
  { key: '1an', label: '1 an', hours: 24 * 365 },
  { key: 'perso', label: 'Plage libre' },
];

/** Bandes de confort agronomique par grandeur (lecture de terrain). */
const COMFORT: Record<string, [number, number]> = {
  soil_moisture: [20, 38],
  soil_temperature: [8, 28],
  air_humidity: [40, 80],
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

interface Props {
  capteur: any;
  onClose: () => void;
  /**
   * Fenêtre imposée à l'ouverture (ISO) : l'observatoire démarre en plage
   * libre, calé sur l'anomalie à observer. Sans ces props, comportement
   * historique (7 jours glissants).
   */
  initialFrom?: string;
  initialTo?: string;
}

/** Observatoire d'une sonde : tous les graphes, période libre, exports. */
export const SensorObservatory: React.FC<Props> = ({ capteur, onClose, initialFrom, initialTo }) => {
  const cale = !!initialFrom && !!initialTo;
  const [preset, setPreset] = React.useState<PresetKey>(cale ? 'perso' : '7j');
  const [customFrom, setCustomFrom] = React.useState(
    dayKey(new Date(initialFrom ?? Date.now() - 7 * 86_400_000)),
  );
  const [customTo, setCustomTo] = React.useState(dayKey(new Date(initialTo ?? Date.now())));

  // Surface plein écran (z-3000) : le chatbot doit passer devant, sinon
  // « IA de Jardin » ouvre une fenêtre invisible derrière l'observatoire.
  React.useEffect(() => {
    fullscreenSurfaces.push();
    return () => fullscreenSurfaces.pop();
  }, []);


  const { from, to } = React.useMemo(() => {
    if (preset === 'perso') {
      return {
        from: new Date(`${customFrom}T00:00:00`).toISOString(),
        to: new Date(`${customTo}T23:59:59`).toISOString(),
      };
    }
    const h = PRESETS.find((p) => p.key === preset)?.hours ?? 168;
    return { from: new Date(Date.now() - h * 3_600_000).toISOString(), to: new Date().toISOString() };
  }, [preset, customFrom, customTo]);

  const { data: serie, isLoading } = useMesureSeriesRange(capteur?.id, from, to);
  const rows = serie?.rows ?? [];
  const truncated = serie?.truncated ?? false;


  const hoursSpan = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 3_600_000));

  /** Une carte par grandeur ; une courbe par profondeur. */
  const charts = React.useMemo(() => {
    const byGrandeur = new Map<string, any[]>();
    rows.forEach((r: any) => {
      const arr = byGrandeur.get(r.grandeur) ?? [];
      arr.push(r);
      byGrandeur.set(r.grandeur, arr);
    });

    return [...byGrandeur.entries()]
      .sort((a, b) => compareGrandeurs({ grandeur: a[0] }, { grandeur: b[0] }))
      .map(([grandeur, list]) => {
        const depths = Array.from(new Set(list.map((r: any) => r.profondeur_m ?? -1))).sort((a, b) => a - b);
        const byTime = new Map<number, any>();
        list.forEach((r: any) => {
          const t = new Date(r.mesure_at).getTime();
          const point = byTime.get(t) ?? { t };
          point[`d${r.profondeur_m ?? -1}`] = r.valeur;
          byTime.set(t, point);
        });
        const data = [...byTime.values()].sort((a, b) => a.t - b.t);
        const values = list.map((r: any) => r.valeur);
        return {
          grandeur,
          meta: grandeurMeta(grandeur),
          depths,
          data,
          count: list.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((s: number, v: number) => s + v, 0) / values.length,
        };
      });
  }, [rows]);

  const timestamps = React.useMemo(
    () => Array.from(new Set(rows.map((r: any) => r.mesure_at))) as string[],
    [rows],
  );

  const fmtT = (t: number) =>
    new Date(t).toLocaleString('fr-FR',
      hoursSpan <= 48
        ? { hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit' });

  const exportCsv = () => {
    const lines = ['horodatage;grandeur;profondeur_m;valeur;unite'];
    rows.forEach((r: any) =>
      lines.push(`${r.mesure_at};${r.grandeur};${r.profondeur_m ?? ''};${r.valeur};${r.unite ?? ''}`),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sonde-${capteur.serial_number}-${from.slice(0, 10)}_${to.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyMarkdown = async () => {
    const md = [
      `# Sonde ${capteur.nom} (${capteur.serial_number})`,
      `Propriété : ${capteur.propriete?.nom ?? '—'} · Modèle : ${capteur.type?.modele ?? '—'}`,
      `Période : ${fmtHorodatage(from)} → ${fmtHorodatage(to)} · ${rows.length} relevés`,
      '',
      '| Grandeur | Profondeurs | Min | Moyenne | Max | Relevés |',
      '| --- | --- | --- | --- | --- | --- |',
      ...charts.map(
        (c) =>
          `| ${c.meta.label} | ${c.depths.map((d) => (d < 0 ? 'surface' : fmtProfondeur(d))).join(', ')} | ${c.min.toFixed(c.meta.digits)} ${c.meta.unite} | ${c.avg.toFixed(c.meta.digits)} ${c.meta.unite} | ${c.max.toFixed(c.meta.digits)} ${c.meta.unite} | ${c.count} |`,
      ),
    ].join('\n');
    await navigator.clipboard.writeText(md);
    toast.success('Synthèse Markdown copiée — prête pour l’IA de Jardin');
  };

  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-emerald-950 text-emerald-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Observatoire · {capteur.nom}</div>
            <div className="truncate text-xs text-emerald-200/80">
              {capteur.serial_number} · {capteur.type?.modele ?? '—'} · {capteur.propriete?.nom ?? 'propriété inconnue'}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-800"
              onClick={() =>
                openIotAi({
                  capteurId: capteur.id,
                  proprieteId: capteur.propriete_id,
                  prefill: `Lis les séries de la sonde « ${capteur.nom} » : que faut-il en retenir, et qu'est-ce qui n'est pas fiable ?`,
                })
              }
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" /> IA de Jardin
            </Button>
            <Button size="sm" variant="outline" className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-800" onClick={copyMarkdown}>
              <FileText className="mr-1 h-3.5 w-3.5" /> Markdown
            </Button>
            <Button size="sm" variant="outline" className="border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-800" onClick={exportCsv}>
              <Download className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="ghost" className="text-emerald-100 hover:bg-emerald-800" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-5 py-6">
        {/* Période */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                preset === p.key
                  ? 'border-emerald-600 bg-emerald-600 text-emerald-50'
                  : 'border-border bg-card text-muted-foreground hover:border-emerald-500/50'
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === 'perso' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-[150px]" />
              <span className="text-xs text-muted-foreground">→</span>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-[150px]" />
            </div>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} relevés · {charts.length} grandeur{charts.length > 1 ? 's' : ''}
            {truncated ? ' · lecture plafonnée : les relevés les plus anciens ne sont pas pris en compte' : ''}
          </span>

        </div>

        {/* Vitalité de transmission */}
        <section className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Vitalité de transmission · {Math.min(hoursSpan, 168)} dernières heures
          </div>
          <VitalityStrip timestamps={timestamps} hours={Math.min(hoursSpan, 168)} showScale />
        </section>

        {isLoading && <div className="h-64 animate-pulse rounded-xl bg-muted" />}

        {!isLoading && charts.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucun relevé sur cette période.
          </p>
        )}

        {/* Un graphe par grandeur */}
        <div className="grid gap-4 lg:grid-cols-2">
          {charts.map((c) => {
            const comfort = COMFORT[c.grandeur];
            return (
              <section key={c.grandeur} className="rounded-2xl border border-border bg-card p-4">
                <header className="mb-2 flex flex-wrap items-baseline gap-2">
                  <h3 className="text-sm font-semibold">{c.meta.label}</h3>
                  <span className="text-xs text-muted-foreground">{c.meta.unite}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                    min {c.min.toFixed(c.meta.digits)} · moy {c.avg.toFixed(c.meta.digits)} · max {c.max.toFixed(c.meta.digits)} · {c.count} relevés
                  </span>
                </header>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.data} syncId="observatoire" margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      {comfort && (
                        <ReferenceArea y1={comfort[0]} y2={comfort[1]} fill="#3f7f52" fillOpacity={0.08} />
                      )}
                      <XAxis
                        dataKey="t"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={fmtT}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                        width={44}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelFormatter={(t: any) => new Date(t).toLocaleString('fr-FR')}
                        formatter={(v: any, name: any) => [`${Number(v).toFixed(c.meta.digits)} ${c.meta.unite}`, name]}
                      />
                      {c.depths.map((d, i) => (
                        <Line
                          key={d}
                          type="monotone"
                          dataKey={`d${d}`}
                          name={d < 0 ? 'surface' : (fmtProfondeur(d) as string)}
                          stroke={c.meta.color}
                          strokeOpacity={1 - i * 0.35}
                          strokeWidth={1.8}
                          strokeDasharray={i === 0 ? undefined : '4 3'}
                          dot={false}
                          connectNulls
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {c.depths.map((d, i) => (
                    <span key={d} className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-0.5 w-4"
                        style={{ background: c.meta.color, opacity: 1 - i * 0.35 }}
                      />
                      {d < 0 ? 'surface / air' : fmtProfondeur(d)}
                    </span>
                  ))}
                  {comfort && <span className="ml-auto">Bande verte : plage de confort</span>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SensorObservatory;
