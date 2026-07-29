import React from 'react';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { fmtArea, fmtEuro, fmtLength, measureFor } from './geoMetrics';

export interface PlanBalance {
  desimpermeabiliseM2: number;
  retentionL: number;
  nourricierM2: number;
  couvertureM2: number;
  lineaireMl: number;
  coutConv: number;
  coutVivant: number;
  entretienConv: number;
  entretienVivant: number;
  objets: number;
}

export const computeBalance = (objets: ProprieteObjet[]): PlanBalance => {
  const b: PlanBalance = {
    desimpermeabiliseM2: 0,
    retentionL: 0,
    nourricierM2: 0,
    couvertureM2: 0,
    lineaireMl: 0,
    coutConv: 0,
    coutVivant: 0,
    entretienConv: 0,
    entretienVivant: 0,
    objets: objets.length,
  };
  for (const o of objets) {
    const t = TOOL_BY_KEY[o.outil_key];
    if (!t) continue;
    const q = t.unit === 'u' ? 1 : measureFor(t.unit, o.geometry);
    const im = t.impact || {};
    if (t.unit === 'ml') b.lineaireMl += q;
    if (im.desimpermeabilise && t.unit === 'm2') b.desimpermeabiliseM2 += q;
    if (im.nourricier && t.unit === 'm2') b.nourricierM2 += q;
    if (im.couverture && t.unit === 'm2') b.couvertureM2 += q;
    if (im.retentionLpU) b.retentionL += im.retentionLpU * q;
    if (im.coutConventionnel) b.coutConv += im.coutConventionnel * q;
    if (im.coutSolVivant) b.coutVivant += im.coutSolVivant * q;
    if (im.entretienConventionnel) b.entretienConv += im.entretienConventionnel * q;
    if (im.entretienSolVivant) b.entretienVivant += im.entretienSolVivant * q;
  }
  return b;
};

const Stat: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}> = ({ label, value, sub, accent = 'hsl(var(--ds-forest))' }) => (
  <div className="rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/55 px-2.5 py-2">
    <p className="text-[9px] uppercase tracking-[0.16em] opacity-55">{label}</p>
    <p className="font-serif text-[17px] leading-tight" style={{ color: accent }}>
      {value}
    </p>
    {sub && <p className="text-[9.5px] italic opacity-55">{sub}</p>}
  </div>
);

/** Lecture agrégée de la floraison du site, tous massifs confondus. */
const FloraisonBlock: React.FC<{ objets: ProprieteObjet[] }> = ({ objets }) => {
  const massifs = objets.filter((o) => isChromaticTool(o.outil_key));
  const lecture = React.useMemo(
    () => lireFloraison(massifs.map((o) => floraisonOf(o.meta))),
    [massifs],
  );
  const teintesSite = React.useMemo(() => {
    const set = new Set<string>();
    for (const o of massifs) for (const t of teintesOf(o.meta)) set.add(t);
    return Array.from(set);
  }, [massifs]);

  if (massifs.length === 0) return null;

  return (
    <div className="rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/55 px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-[0.16em] opacity-55">Continuité florale</p>
      <div className="mt-1.5 flex gap-[3px]">
        {MOIS.map((m, i) => {
          const on = lecture.couverts.includes(i + 1);
          return (
            <span
              key={i}
              title={MOIS_LONG[i]}
              className={`flex h-5 flex-1 items-center justify-center rounded text-[8.5px] ${
                on
                  ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                  : 'bg-[hsl(var(--ds-line))]/35 opacity-55'
              }`}
            >
              {m}
            </span>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] leading-snug">{lecture.phrase}</p>
      {teintesSite.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[9px] opacity-55">Nuancier du site</span>
          <span className="flex gap-[2px]">
            {teintesSite.map((t) => (
              <span
                key={t}
                title={labelOf(t)}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: hexOf(t) }}
              />
            ))}
          </span>
          <span className="text-[9px] opacity-55">
            · {massifs.length} massif{massifs.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export const PlanBalanceSheet: React.FC<{ objets: ProprieteObjet[] }> = ({ objets }) => {
  const b = React.useMemo(() => computeBalance(objets), [objets]);
  const gainInstall = b.coutConv - b.coutVivant;
  const gainEntretien = b.entretienConv - b.entretienVivant;
  const pluie = b.retentionL > 0 ? Math.round(b.retentionL / 1000) : 0;

  if (objets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[hsl(var(--ds-line))] px-3 py-4 text-center text-[11px] italic opacity-55">
        Posez vos premiers ouvrages : le bilan se calcule tout seul, mètre après mètre.
      </p>
    );
  }

  return (
    <div className="space-y-2.5 text-[hsl(var(--ds-forest-deep))]">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat
          label="Surface nourricière"
          value={fmtArea(b.nourricierM2)}
          sub={b.nourricierM2 > 0 ? `~${Math.round(b.nourricierM2 / 25)} personnes nourries` : undefined}
          accent="#7a9a3c"
        />
        <Stat
          label="Sol rendu perméable"
          value={fmtArea(b.desimpermeabiliseM2)}
          sub="objectif ZAN"
          accent="#3b7ea1"
        />
        <Stat
          label="Eau retenue sur site"
          value={`${Math.round(b.retentionL).toLocaleString('fr-FR')} L`}
          sub={pluie ? `${pluie} m³ à chaque orage` : undefined}
          accent="#2f7d8f"
        />
        <Stat
          label="Sol couvert en permanence"
          value={fmtArea(b.couvertureM2)}
          sub="principe MSV"
          accent="#8a6d3b"
        />
      </div>

      <div className="rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/55 p-2.5">
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.16em] opacity-55">
          Comparatif conventionnel / sol vivant
        </p>
        <table className="w-full text-[10.5px]">
          <thead>
            <tr className="opacity-55">
              <th />
              <th className="text-right font-normal">Conventionnel</th>
              <th className="text-right font-normal">Sol vivant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-0.5">Installation</td>
              <td className="text-right tabular-nums">{fmtEuro(b.coutConv)}</td>
              <td className="text-right tabular-nums font-semibold text-[hsl(var(--ds-forest))]">
                {fmtEuro(b.coutVivant)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5">Entretien / an</td>
              <td className="text-right tabular-nums">{fmtEuro(b.entretienConv)}</td>
              <td className="text-right tabular-nums font-semibold text-[hsl(var(--ds-forest))]">
                {fmtEuro(b.entretienVivant)}
              </td>
            </tr>
            <tr className="border-t border-[hsl(var(--ds-line))]/60">
              <td className="pt-1 font-semibold">Sur 10 ans</td>
              <td className="pt-1 text-right tabular-nums">
                {fmtEuro(b.coutConv + b.entretienConv * 10)}
              </td>
              <td className="pt-1 text-right tabular-nums font-semibold text-[hsl(var(--ds-forest))]">
                {fmtEuro(b.coutVivant + b.entretienVivant * 10)}
              </td>
            </tr>
          </tbody>
        </table>
        {(gainInstall > 0 || gainEntretien > 0) && (
          <p className="mt-1.5 text-[10px] italic text-[hsl(var(--ds-forest))]">
            Économie estimée : {fmtEuro(Math.max(0, gainInstall + gainEntretien * 10))} sur dix ans
            — l’essentiel se joue dans l’entretien, pas dans la plantation.
          </p>
        )}
      </div>

      <FloraisonBlock objets={objets} />

      <p className="text-[9px] leading-snug opacity-45">
        Ratios indicatifs (rétention GIEP, coûts moyens 2024). Ils servent à comparer deux partis
        d’aménagement, pas à chiffrer un marché. {b.objets} ouvrage
        {b.objets > 1 ? 's' : ''} · {fmtLength(b.lineaireMl)} de linéaire.
      </p>
    </div>
  );
};

export default PlanBalanceSheet;
