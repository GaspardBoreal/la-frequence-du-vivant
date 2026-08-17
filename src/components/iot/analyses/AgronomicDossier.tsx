import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { moistureLayers, type SensorAnalysis } from '@/lib/iot/analyses';
import type { PaletteFit } from '@/hooks/iot/useIotAnalyses';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const Block: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
    <div className="text-sm font-medium">{title}</div>
    {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    <div className="mt-3">{children}</div>
  </div>
);

/** Niveau 3 — le dossier agronomique : croisements, seuils, concordance palette. */
const AgronomicDossier: React.FC<{
  analysis: SensorAnalysis;
  fit: PaletteFit | null;
}> = ({ analysis, fit }) => {
  const { surface, deep } = moistureLayers(analysis.series);
  const w = analysis.water;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Block
          title="Sol mesuré × sol analysé"
          hint="Les mesures de la sonde mises en regard du registre de sol de la propriété (lecture seule)."
        >
          {fit ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                {(['eau', 'texture', 'nutrition', 'ph', 'lumiere'] as const).map((axis) => (
                  <div key={axis} className="rounded-xl border border-border/60 bg-background/60 p-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{axis}</div>
                    <div className="text-sm font-semibold">
                      {fit.profile.known[axis] ? (fit.profile as any)[axis].toFixed(1) : '—'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {fit.profile.known[axis] ? 'documenté' : 'inconnu'}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Profil bâti sur : {fit.basis.length ? fit.basis.join(' · ') : 'aucune donnée exploitable'}.
                {fit.missing.length > 0 ? ` Manque : ${fit.missing.join(' · ')}.` : ''}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Aucune propriété rattachée à cette sonde.</p>
          )}
        </Block>

        <Block title="Signature hydrique" hint="Comment cette parcelle se vide et se recharge.">
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Humidité de surface (moy / min / max)</dt>
              <dd>{surface ? `${surface.mean} / ${surface.min} / ${surface.max} %` : 'non transmise'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Humidité de fond</dt>
              <dd>{deep ? `${deep.mean} / ${deep.min} / ${deep.max} %` : 'une seule profondeur transmise'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ressuyage médian</dt>
              <dd>{w.dryingPerDay != null ? `${w.dryingPerDay} pt/jour` : 'non calculable'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Front d’humectation</dt>
              <dd>
                {surface && deep
                  ? deep.mean > surface.mean
                    ? 'le fond reste plus humide : réserve profonde active'
                    : 'la surface reste plus humide : les pluies ne descendent pas'
                  : 'deux profondeurs nécessaires'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Degrés-jours (base 6 °C)</dt>
              <dd>
                {analysis.gdd
                  ? `${analysis.gdd.total} °C·j sur ${analysis.gdd.days} j (${analysis.gdd.source})`
                  : 'température non transmise'}
              </dd>
            </div>
          </dl>
        </Block>
      </div>

      <Block
        title="Fenêtres de plantation observées"
        hint="Créneaux où humidité (12–38 %) et température du sol (≥ 8 °C) étaient simultanément favorables."
      >
        {analysis.windows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune fenêtre favorable détectée sur la période — ou données insuffisantes pour en juger.
          </p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {analysis.windows.map((win) => (
              <li key={win.start} className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                  {fmtDate(win.start)} → {fmtDate(win.end)}
                </span>
                <span className="text-muted-foreground">{win.days} j · {win.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block
        title="Concordance palette végétale"
        hint="Chaque espèce du référentiel notée sur la niche mesurée autour de cette sonde ; l’axe le plus contraignant est nommé."
      >
        {!fit ? (
          <p className="text-xs text-muted-foreground">Propriété inconnue : concordance impossible.</p>
        ) : fit.profile.confidence === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun axe documenté : ni la sonde ni le registre de sol ne permettent de noter les espèces.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="py-1.5 pr-2">Espèce</th>
                  <th className="py-1.5 pr-2">Strate</th>
                  <th className="py-1.5 pr-2">Score</th>
                  <th className="py-1.5 pr-2">Axe le plus contraignant</th>
                  <th className="py-1.5">Service rendu</th>
                </tr>
              </thead>
              <tbody>
                {fit.rows.slice(0, 14).map((r) => (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="py-1.5 pr-2">
                      <div className="font-medium">{r.fr}</div>
                      <div className="text-[10px] italic text-muted-foreground">{r.latin}</div>
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{r.strate.replace('_', ' ')}</td>
                    <td className="py-1.5 pr-2">
                      <span
                        className="rounded-full px-2 py-0.5 font-medium"
                        style={{
                          backgroundColor: r.score >= 75 ? 'rgba(63,127,82,0.14)' : r.score >= 55 ? 'rgba(201,162,74,0.16)' : 'rgba(180,85,58,0.14)',
                          color: r.score >= 75 ? '#3f7f52' : r.score >= 55 ? '#a3801f' : '#b4553a',
                        }}
                      >
                        {r.score}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{r.worstLabel}</td>
                    <td className="py-1.5 text-muted-foreground">{r.service}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Confiance du profil : {Math.round(fit.profile.confidence * 100)} % des axes documentés.
              {fit.missing.length > 0 ? ` Les axes manquants sont exclus du calcul : ${fit.missing.join(' · ')}.` : ''}
            </p>
          </div>
        )}
      </Block>

      <Block title="Qualité de la donnée" hint="Toute lecture avancée annonce sa fiabilité.">
        <ul className="space-y-1.5 text-xs">
          {analysis.quality.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2">
              {n.level === 'bad' ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : n.level === 'warn' ? (
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              )}
              <span className="text-muted-foreground">{n.text}</span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
};

export default AgronomicDossier;
