import React from 'react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_FAMILIES, type ToolFamilyKey } from '@/lib/paysageTools';
import { toolByKey } from '@/lib/ouvrageRecoKb';
import { computeBalance } from '@/components/propriete/palette/studio/PlanBalanceSheet';
import {
  fmtArea,
  fmtEuro,
  fmtLength,
  fmtMeasure,
  measureFor,
} from '@/components/propriete/palette/studio/geoMetrics';

interface ZoneLite {
  id: string;
  nom: string | null;
}

interface Props {
  objets: ProprieteObjet[];
  zones: ZoneLite[];
  propertyName?: string;
  /** notes générales de l'atelier (bloc « notes » de l'étape 5) */
  notes?: string | null;
}

const Stat: React.FC<{ label: string; value: string; sub?: string; ink?: string }> = ({
  label,
  value,
  sub,
  ink = '#2f5d3a',
}) => (
  <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 print-exact print-avoid-break">
    <p className="text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ds-forest-deep))]/55">{label}</p>
    <p className="font-serif text-[19px] leading-tight" style={{ color: ink }}>
      {value}
    </p>
    {sub && <p className="text-[9.5px] italic text-[hsl(var(--ds-forest-deep))]/55">{sub}</p>}
  </div>
);

/**
 * « La table de l'Atelier » — bilan chiffré du plan et registre imprimé des
 * ouvrages dessinés (type, métré, rattachement, coût, note de chantier).
 */
export const AtelierTablePrint: React.FC<Props> = ({ objets, zones, propertyName, notes }) => {
  const balance = React.useMemo(() => computeBalance(objets), [objets]);

  const grouped = React.useMemo(() => {
    const map = new Map<ToolFamilyKey, ProprieteObjet[]>();
    objets.forEach((o) => {
      const fam = (toolByKey(o.outil_key)?.family ?? 'usage') as ToolFamilyKey;
      map.set(fam, [...(map.get(fam) ?? []), o]);
    });
    return TOOL_FAMILIES.filter((f) => map.has(f.key)).map((f) => ({
      family: f,
      items: map.get(f.key)!,
    }));
  }, [objets]);

  const zoneName = (id: string | null) =>
    zones.find((z) => z.id === id)?.nom || (id ? 'Emplacement' : '—');

  const numById = new Map(objets.map((o, i) => [o.id, i + 1]));
  const economie = balance.entretienConv - balance.entretienVivant;

  return (
    <section className="palette-atelier text-[hsl(var(--ds-forest-deep))]">
      <header className="mb-3">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
          Étape 5 · L’Atelier
        </span>
        <h3 className="mt-1 font-serif italic text-3xl leading-tight text-[hsl(var(--ds-forest-deep))]">
          La table des ouvrages
        </h3>
        <p className="mt-1 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/70">
          Ce que le plan engage réellement : métrés, coûts comparés et bilan écologique du dessin.
        </p>
      </header>

      {/* Bilan du plan */}
      <div className="grid grid-cols-4 gap-2.5">
        <Stat label="Ouvrages" value={String(balance.objets)} sub="dessinés dans l’Atelier" />
        <Stat label="Désimperméabilisé" value={fmtArea(balance.desimpermeabiliseM2)} sub="surfaces rendues perméables" ink="#3b7ea1" />
        <Stat label="Rétention d’eau" value={`${Math.round(balance.retentionL).toLocaleString('fr-FR')} L`} sub="par épisode pluvieux" ink="#3b7ea1" />
        <Stat label="Linéaire" value={fmtLength(balance.lineaireMl)} sub="haies, noues, cheminements" ink="#7a5c3b" />
        <Stat label="Surface nourricière" value={fmtArea(balance.nourricierM2)} sub="fruits, aromates, potager" ink="#2f7d4f" />
        <Stat label="Couverture du sol" value={fmtArea(balance.couvertureM2)} sub="sol jamais nu (MSV)" ink="#8a6d3b" />
        <Stat label="Investissement" value={fmtEuro(balance.coutVivant)} sub={`conventionnel : ${fmtEuro(balance.coutConv)}`} ink="#8a6d3b" />
        <Stat
          label="Entretien annuel"
          value={fmtEuro(balance.entretienVivant)}
          sub={economie > 0 ? `soit ${fmtEuro(economie)} / an économisés` : `conventionnel : ${fmtEuro(balance.entretienConv)}`}
          ink="#2f7d4f"
        />
      </div>

      {/* Registre imprimé */}
      <div className="mt-4 space-y-3">
        {grouped.map(({ family, items }) => (
          <div key={family.key} className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-3 print-exact print-avoid-break">
            <p className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: family.color }}>
                {family.label}
              </span>
              <span className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55">{family.tagline}</span>
            </p>

            <table className="mt-2 w-full border-collapse text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/55">
                  <th className="w-6 text-left font-semibold">N°</th>
                  <th className="text-left font-semibold">Ouvrage</th>
                  <th className="text-left font-semibold">Type</th>
                  <th className="text-left font-semibold">Emplacement</th>
                  <th className="text-right font-semibold">Métré</th>
                  <th className="text-right font-semibold">Qté</th>
                  <th className="text-right font-semibold">Coût</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => {
                  const tool = toolByKey(o.outil_key);
                  const unit = tool?.unit ?? 'u';
                  const measure = measureFor(unit, o.geometry);
                  const cout =
                    o.meta?.cout ?? (tool?.impact?.coutSolVivant ? tool.impact.coutSolVivant * measure : null);
                  const color = (o.style?.color as string) || tool?.color || family.color;
                  return (
                    <React.Fragment key={o.id}>
                      <tr className="border-t border-[hsl(var(--ds-line))]/60 align-baseline">
                        <td className="py-1">
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8.5px] font-bold text-white print-exact"
                            style={{ backgroundColor: color }}
                          >
                            {numById.get(o.id)}
                          </span>
                        </td>
                        <td className="py-1 font-semibold">{o.nom || tool?.label || 'Ouvrage'}</td>
                        <td className="py-1 opacity-70">
                          {tool?.glyph ?? '•'} {tool?.label ?? o.outil_key}
                        </td>
                        <td className="py-1 opacity-70">{zoneName(o.zone_id)}</td>
                        <td className="py-1 text-right">{fmtMeasure(unit, measure)}</td>
                        <td className="py-1 text-right opacity-70">{o.meta?.quantite ?? '—'}</td>
                        <td className="py-1 text-right">{cout != null ? fmtEuro(cout) : '—'}</td>
                      </tr>
                      {o.meta?.note && (
                        <tr>
                          <td />
                          <td colSpan={6} className="pb-1.5 text-[10.5px] italic text-[hsl(var(--ds-forest-deep))]/70">
                            Note de chantier — {o.meta.note}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {objets.length === 0 && (
          <p className="text-[12px] italic text-[hsl(var(--ds-forest-deep))]/60">
            Aucun ouvrage n’a encore été dessiné dans l’Atelier.
          </p>
        )}
      </div>

      {notes?.trim() && (
        <div className="mt-4 rounded-xl border border-[hsl(var(--ds-gold))]/45 bg-[#fdf8ec] p-3 print-exact print-avoid-break">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6d3b]">
            Notes de l’Atelier
          </p>
          <p className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]">
            {notes}
          </p>
        </div>
      )}

      <p className="mt-3 text-[9.5px] italic text-[hsl(var(--ds-forest-deep))]/50">
        Coûts indicatifs · {propertyName ?? 'Propriété'} — comparaison conventionnel / sol vivant issue du
        registre des outils paysagers (MSV, GIEP, ZAN).
      </p>
    </section>
  );
};

export default AtelierTablePrint;
