import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock,
  Database,
  Printer,
  Scale,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type CategoryKey = 'works' | 'observations' | 'activity' | 'snapshots' | 'personal' | 'iot';

interface DataCategory {
  key: CategoryKey;
  label: string;
  total: number;
  gaspard: number;
  association: number;
  others: number;
  unattributed: number;
  third_party: number;
}

interface DataAssetStats {
  categories: DataCategory[];
  computed_at: string;
  top_marcheurs?: { nom: string; total: number; role: string }[];
  top_base?: number;
  snapshot_attributions?: number;
  snapshot_third_party_attributions?: number;
  snapshots_with_third_party?: number;
}

const fmt = (value: number) => value.toLocaleString('fr-FR');
const pct = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '0 %';

const categoryReading = (category: DataCategory) => {
  switch (category.key) {
    case 'works':
      return `Auteur identifié : G. Boréal ${fmt(category.gaspard)} ; compte association ${fmt(category.association)} ; autres auteurs ${fmt(category.others)}. Auteur non enregistré : ${fmt(category.unattributed)}.`;
    case 'observations':
      return `Compte G. Boréal ${fmt(category.gaspard)} ; compte association ${fmt(category.association)} ; autres contributeurs ${fmt(category.others)}. Données factuelles, sans présomption de droit d’auteur.`;
    case 'activity':
      return 'Activité structurée dans le cadre des Marches du Vivant ; les participations peuvent contenir des données personnelles.';
    case 'snapshots':
      return 'Agrégats construits à partir de sources ouvertes ; exclus de toute revendication de propriété sur les observations sources.';
    case 'personal':
      return 'Données de tiers ou données personnelles ; hors actif appropriable.';
    case 'iot':
      return 'Mesures techniques ; elles documentent la base mais ne constituent pas des œuvres.';
  }
};

export default function AdminNoteDonnees() {
  const [showAllTop, setShowAllTop] = useState(false);
  const [exportMode, setExportMode] = useState<'simple' | 'complete'>('simple');
  const [printedAt, setPrintedAt] = useState<Date>(new Date());

  const { data, isLoading, error } = useQuery({
    queryKey: ['data-asset-stats-v2'],
    queryFn: async (): Promise<DataAssetStats> => {
      const { data: stats, error: statsError } = await supabase.rpc('get_data_asset_stats');
      if (statsError) throw statsError;
      return stats as unknown as DataAssetStats;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleExport = () => {
    setPrintedAt(new Date());
    setTimeout(() => window.print(), 100);
  };

  const visibleCategories = (data?.categories ?? []).filter(
    (category) => exportMode === 'complete' || category.key !== 'iot',
  );
  const works = visibleCategories.find((category) => category.key === 'works');
  const identifiedWorks = works
    ? works.gaspard + works.association + works.others
    : 0;
  const structuredData = visibleCategories
    .filter((category) => category.key !== 'works' && category.key !== 'personal')
    .reduce((sum, category) => sum + category.total, 0);
  const computedAt = data?.computed_at
    ? new Date(data.computed_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:py-4">
        <Link
          to="/admin/outils"
          className="mb-6 -ml-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux outils admin
        </Link>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:mb-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Association La Fréquence du Vivant — dossier statutaire
            </p>
            <h1 className="font-serif text-3xl font-semibold">Note de valorisation des données</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Réponse à la remarque : « les données des Marches du Vivant, seul actif dont votre propriété personnelle reste discutable ».
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              Version {exportMode === 'simple' ? 'Simple — hors mesures capteurs IoT' : 'Complète — toutes les catégories, mesures IoT comprises'}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-semibold print:mt-2 print:px-2.5 print:py-1 print:text-base">
              <Clock className="h-4 w-4 text-primary print:h-5 print:w-5" />
              Édition du{' '}
              {printedAt.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Europe/Paris',
              })}{' '}
              à {printedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 print:hidden">
            <div role="group" aria-label="Version de la note" className="inline-flex rounded-md border border-border bg-muted/50 p-0.5">
              <Button type="button" size="sm" variant={exportMode === 'simple' ? 'default' : 'ghost'} aria-pressed={exportMode === 'simple'} onClick={() => setExportMode('simple')} className="flex-1">
                Simple
              </Button>
              <Button type="button" size="sm" variant={exportMode === 'complete' ? 'default' : 'ghost'} aria-pressed={exportMode === 'complete'} onClick={() => setExportMode('complete')} className="flex-1">
                Complète
              </Button>
            </div>
            <Button type="button" onClick={handleExport}>
              <Printer className="h-4 w-4" />
              Exporter en PDF
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Mesure en cours…</p>}
        {error && <p className="text-sm text-destructive">Accès refusé ou erreur de mesure. Cette note est réservée aux administrateurs.</p>}

        {data && works && (
          <>
            <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed print:mb-3">
              <strong>Lecture corrigée.</strong> Cette note distingue la qualité d’auteur, l’activité du compte associatif, les données factuelles et les sources tierces. Elle ne présente plus leur addition comme une preuve de propriété personnelle.
            </div>

            <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
              <div className="rounded-lg border border-border p-4">
                <BookOpenCheck className="mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-semibold tabular-nums">{fmt(identifiedWorks)}</div>
                <div className="text-xs text-muted-foreground">œuvres avec auteur identifié sur {fmt(works.total)}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <CircleAlert className="mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-semibold tabular-nums">{fmt(works.unattributed)}</div>
                <div className="text-xs text-muted-foreground">œuvres sans auteur enregistré, à régulariser</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <Database className="mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-semibold tabular-nums">{fmt(structuredData)}</div>
                <div className="text-xs text-muted-foreground">enregistrements factuels, techniques ou d’activité structurés</div>
              </div>
            </div>

            <p className="mb-8 text-xs text-muted-foreground print:mb-4">
              Attribution issue des comptes et métadonnées enregistrés ; elle ne vaut pas preuve définitive de titularité.
            </p>

            <section className="mb-8 print:mb-4">
              <h2 className="mb-3 text-lg font-semibold">1. Répartition par nature de données</h2>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-4 py-2 font-medium">Nature</th>
                      <th className="px-4 py-2 text-right font-medium">Volume</th>
                      <th className="px-4 py-2 font-medium">Qualification démontrable aujourd’hui</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories.map((category) => (
                      <tr key={category.key} className="border-t border-border align-top">
                        <td className="px-4 py-2 font-medium">{category.label}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{fmt(category.total)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{categoryReading(category)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8 break-inside-avoid print:mb-4">
              <h2 className="mb-1 text-lg font-semibold">2. Répartition des œuvres et principaux marcheurs contributeurs</h2>
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4">
                {[
                  ['G. Boréal', works.gaspard],
                  ['Compte association', works.association],
                  ['Autres auteurs', works.others],
                  ['Auteur non enregistré', works.unattributed],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-border p-3">
                    <div className="text-lg font-semibold tabular-nums">{fmt(Number(value))}</div>
                    <div className="text-xs text-muted-foreground">{label} · {pct(Number(value), works.total)}</div>
                  </div>
                ))}
              </div>

              <p className="mb-4 text-xs text-muted-foreground">
                Contributions signées : observations, médias, textes et audios de marcheurs. Les 292 œuvres sans auteur enregistré sont exclues de ce classement.
              </p>
              <div className="space-y-2.5 [print-color-adjust:exact]">
                {(() => {
                  const base = data.top_base || 1;
                  const top = data.top_marcheurs ?? [];
                  const rest = Math.max(0, base - top.reduce((sum, person) => sum + person.total, 0));
                  const rows = [
                    ...top.map((person, index) => ({ ...person, rank: String(index + 1) })),
                    ...(rest > 0 ? [{ nom: 'Autres marcheurs', total: rest, role: 'reste', rank: '' }] : []),
                  ];
                  let cumulative = 0;
                  return (
                    <>
                      {rows.map((row, index) => {
                        const share = (row.total / base) * 100;
                        cumulative += share;
                        const hidden = !showAllTop && index >= 3;
                        const barClass = row.role === 'gaspard'
                          ? 'bg-primary'
                          : row.role === 'association'
                            ? 'bg-accent-foreground'
                            : row.role === 'reste'
                              ? 'bg-muted-foreground/30'
                              : 'bg-primary/45';
                        return (
                          <div key={`${row.nom}-${row.rank}`} className={`grid grid-cols-[1.25rem_8.5rem_1fr_9.5rem] items-center gap-2 text-sm sm:grid-cols-[1.5rem_11rem_1fr_11rem] ${hidden ? 'hidden' : ''}`}>
                            <span className="text-right tabular-nums text-muted-foreground">{row.rank}</span>
                            <span className={`truncate ${row.role === 'gaspard' || row.role === 'association' ? 'font-semibold' : ''}`}>{row.nom}</span>
                            <div className="h-5 overflow-hidden rounded bg-muted">
                              <div className={`h-full rounded ${barClass}`} style={{ width: `${Math.max(share, 0.8)}%` }} />
                            </div>
                            <span className="text-right tabular-nums">
                              <strong>{share.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</strong>
                              <span className="text-xs text-muted-foreground"> ({fmt(row.total)})</span>
                              <span className="block text-xs text-muted-foreground">cumul {cumulative.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</span>
                            </span>
                          </div>
                        );
                      })}
                      {rows.length > 3 && (
                        <Button type="button" variant="link" size="sm" onClick={() => setShowAllTop((current) => !current)} className="mt-1 h-auto px-0 text-xs print:hidden">
                          {showAllTop ? <><ChevronUp className="h-3.5 w-3.5" /> Réduire aux 3 premiers</> : <><ChevronDown className="h-3.5 w-3.5" /> Déplier les 10 premiers marcheurs</>}
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>
            </section>

            <div className={exportMode === 'simple' ? 'hidden' : ''}>
              <h2 className="mb-3 text-lg font-semibold">3. Éléments de traçabilité</h2>
              <div className="mb-8 space-y-3 text-sm leading-relaxed print:mb-4">
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-medium">Œuvres sans auteur enregistré</h3>
                  <p className="text-muted-foreground">
                    Les 241 photos et 51 audios de marches ne comportent aucun champ ni aucune métadonnée d’auteur exploitable. Ils constituent un chantier d’attribution prioritaire : leur publication sous la bannière MdV ne permet pas de présumer leur auteur.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-medium">Données tierces sous licences ouvertes</h3>
                  <p className="text-muted-foreground">
                    {fmt(data.snapshots_with_third_party ?? 0)} snapshots sur 403 contiennent au moins une attribution tierce. Sur {fmt(data.snapshot_attributions ?? 0)} mentions d’attribution analysées, {fmt(data.snapshot_third_party_attributions ?? 0)} relèvent de comptes autres que G. Boréal et Les marches du Vivant. Les observations sources iNaturalist, GBIF et INPN restent soumises à leurs licences.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-medium">Données factuelles et personnelles</h3>
                  <p className="text-muted-foreground">
                    Une observation d’espèce, un lieu, une date, une participation ou une mesure technique ne démontre pas en soi un droit d’auteur. Les profils et informations de participants restent protégés par le RGPD et hors actif appropriable.
                  </p>
                </div>
              </div>

              <h2 className="mb-3 text-lg font-semibold">4. Qualification juridique en deux fondements</h2>
              <div className="mb-8 space-y-3 text-sm leading-relaxed print:mb-4">
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-medium">Qualité d’auteur</h3>
                  <p className="text-muted-foreground">
                    Elle ne peut être soutenue que pour les œuvres dont l’auteur est identifiable. Les contenus des autres marcheurs demeurent ceux de leurs auteurs, sous réserve de la licence d’exploitation consentie à l’association.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-1 font-medium">Qualité de producteur de la base</h3>
                  <p className="text-muted-foreground">
                    La protection prévue à l’article L.341-1 du Code de la propriété intellectuelle repose sur un investissement substantiel dans la constitution, la vérification ou la présentation de la base. Elle doit être documentée par les financements, le temps consacré, la méthodologie, les contrôles et l’architecture — non par un pourcentage brut de lignes.
                  </p>
                </div>
              </div>

              <h2 className="mb-3 text-lg font-semibold">5. Formulation suggérée pour les statuts</h2>
              <blockquote className="mb-8 rounded-lg border-l-4 border-primary bg-muted/30 p-4 text-sm italic leading-relaxed print:mb-4">
                « L’association est productrice et exploitante de la base de données “Marches du Vivant”, sous réserve de la démonstration des investissements substantiels visés à l’article L.341-1 du Code de la propriété intellectuelle, sans préjudice des droits des auteurs, des droits des contributeurs, de la protection des données personnelles et des licences applicables aux sources tierces. »
              </blockquote>

              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Scale className="h-3 w-3" />
                Mesures au {computedAt}, recalculées en direct. Document interne — ne constitue pas un avis juridique.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}