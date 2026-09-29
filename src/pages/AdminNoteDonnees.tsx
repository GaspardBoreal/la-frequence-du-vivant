import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Printer, Database, Scale, ShieldCheck, Users, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface Famille {
  famille: string;
  total: number;
  attribue: number;
}

interface DataAssetStats {
  familles: Famille[];
  total_general: number;
  total_attribue: number;
  ratio_pct: number;
  computed_at: string;
  top_marcheurs?: { nom: string; total: number; role: string }[];
  top_base?: number;
}

const LABELS: Record<string, string> = {
  mesures_capteurs_iot: 'Mesures capteurs IoT',
  observations_marcheurs: 'Observations marcheurs',
  dont_observations_gaspard: '— dont signées G. Boréal',
  dont_observations_association: '— dont signées Les marches du Vivant',
  medias_marcheurs: 'Médias marcheurs',
  dont_medias_gaspard: '— dont signés G. Boréal',
  dont_medias_association: '— dont signés Les marches du Vivant',
  snapshots_biodiversite: 'Snapshots biodiversité',
  dont_snapshots_attr_total: '— observations iNaturalist attribuées dans les snapshots',
  dont_snapshots_gaspard: '— dont signées G. Boréal (@gaspardboreal)',
  dont_snapshots_association: '— dont signées Les marches du Vivant (@les-marches-du-vivant)',
  photos_marches: 'Photos de marches',
  dont_photos_association: '— dont Les marches du Vivant (contenu éditorial MdV, auteur non enregistré)',
  marches: 'Marches',
  evenements: 'Événements',
  dont_evenements_crees_gaspard: '— dont créés par G. Boréal',
  participations: 'Participations',
  dont_participations_gaspard: '— dont G. Boréal',
  waypoints_exploration: "Points d'étape (waypoints)",
  audios_marches: 'Audios de marches',
  dont_audios_association: '— dont Les marches du Vivant (contenu éditorial MdV, auteur non enregistré)',
  textes_marcheurs: 'Textes de marcheurs',
  profils_communaute_exclus: 'Profils communauté (exclus — RGPD)',
  proprietes: 'Propriétés documentées',
};

const ORDER = [
  'mesures_capteurs_iot',
  'observations_marcheurs',
  'dont_observations_gaspard',
  'dont_observations_association',
  'medias_marcheurs',
  'dont_medias_gaspard',
  'dont_medias_association',
  'snapshots_biodiversite',
  'dont_snapshots_attr_total',
  'dont_snapshots_gaspard',
  'dont_snapshots_association',
  'photos_marches',
  'dont_photos_association',
  'marches',
  'evenements',
  'dont_evenements_crees_gaspard',
  'participations',
  'dont_participations_gaspard',
  'waypoints_exploration',
  'audios_marches',
  'dont_audios_association',
  'textes_marcheurs',
  'proprietes',
  'profils_communaute_exclus',
];

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function AdminNoteDonnees() {
  const [showAllTop, setShowAllTop] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-asset-stats'],
    queryFn: async (): Promise<DataAssetStats> => {
      const { data, error } = await supabase.rpc('get_data_asset_stats');
      if (error) throw error;
      return data as unknown as DataAssetStats;
    },
    staleTime: 5 * 60 * 1000,
  });

  const familles = (data?.familles ?? [])
    .slice()
    .sort((a, b) => ORDER.indexOf(a.famille) - ORDER.indexOf(b.famille));

  const computedAt = data?.computed_at
    ? new Date(data.computed_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4 print:max-w-none">
        <Link
          to="/admin/outils"
          className="print:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux outils admin
        </Link>
        <div className="flex items-start justify-between gap-4 mb-8 print:mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Association La Fréquence du Vivant — dossier statutaire
            </p>
            <h1 className="text-3xl font-serif font-semibold">
              Note de valorisation des données
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Réponse à la remarque : « les données des Marches du Vivant, seul actif
              dont votre propriété personnelle reste discutable ».
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Printer className="w-4 h-4" />
            Exporter en PDF
          </button>
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-sm">Mesure en cours…</p>
        )}
        {error && (
          <p className="text-destructive text-sm">
            Accès refusé ou erreur de mesure. Cette note est réservée aux administrateurs.
          </p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-2 print:mb-4">
              <div className="rounded-xl border border-border p-4">
                <Database className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-semibold tabular-nums">
                  {fmt(data.total_general)}
                </div>
                <div className="text-xs text-muted-foreground">
                  enregistrements mesurés sur 15 familles de données
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <Users className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-semibold tabular-nums">
                  {fmt(data.total_attribue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  créés par G. Boréal ou dans le cadre des Marches du Vivant
                </div>
              </div>
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                <ShieldCheck className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-semibold tabular-nums">
                  {data.ratio_pct.toLocaleString('fr-FR')} %
                </div>
                <div className="text-xs text-muted-foreground">
                  du volume total de la plateforme
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3">1. Mesure par famille de données</h2>
            <div className="rounded-xl border border-border overflow-hidden mb-8 print:mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-2 font-medium">Famille</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                    <th className="px-4 py-2 font-medium text-right">
                      G. Boréal + MdV
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {familles.map((f) => (
                    <tr
                      key={f.famille}
                      className={`border-t border-border ${
                        f.famille.startsWith('dont_')
                          ? 'text-muted-foreground text-xs'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-2">
                        {LABELS[f.famille] ?? f.famille}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {f.famille.startsWith('dont_') ? '' : fmt(f.total)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {fmt(f.attribue)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary/40 font-semibold bg-primary/5">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmt(data.total_general)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmt(data.total_attribue)} ({data.ratio_pct.toLocaleString('fr-FR')} %)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section className="break-inside-avoid mb-8 print:mb-4">
              <h2 className="text-lg font-semibold mb-1">
                2. Contribution des 10 premiers marcheurs
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Part de chaque marcheur dans les {fmt(data.top_base ?? 0)} contributions
                des marcheurs (observations + médias + textes + audios). Mesures IoT exclues.
              </p>
              <div className="space-y-2.5" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                {(() => {
                  const base = data.top_base || 1;
                  const top = data.top_marcheurs ?? [];
                  const rest = base - top.reduce((s, t) => s + t.total, 0);
                  const rows = [
                    ...top.map((t, i) => ({ ...t, rank: String(i + 1) })),
                    ...(rest > 0 ? [{ nom: 'Autres marcheurs', total: rest, role: 'reste', rank: '' }] : []),
                  ];
                  return rows.map((r) => {
                    const pct = (r.total / base) * 100;
                    const bar =
                      r.role === 'gaspard'
                        ? 'bg-primary'
                        : r.role === 'association'
                        ? 'bg-accent-foreground'
                        : r.role === 'reste'
                        ? 'bg-muted-foreground/30'
                        : 'bg-primary/45';
                    return (
                      <div key={r.nom + r.rank} className="grid grid-cols-[1.25rem_8.5rem_1fr_6.5rem] sm:grid-cols-[1.5rem_11rem_1fr_7.5rem] items-center gap-2 text-sm">
                        <span className="text-muted-foreground tabular-nums text-right">{r.rank}</span>
                        <span className={`truncate ${r.role === 'gaspard' || r.role === 'association' ? 'font-semibold' : ''}`}>{r.nom}</span>
                        <div className="h-5 rounded bg-muted overflow-hidden">
                          <div className={`h-full rounded ${bar}`} style={{ width: `${Math.max(pct, 0.8)}%` }} />
                        </div>
                        <span className="text-right tabular-nums">
                          <strong>{pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</strong>
                          <span className="text-xs text-muted-foreground"> ({fmt(r.total)})</span>
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            <h2 className="text-lg font-semibold mb-3">
              3. Qualification juridique en trois couches
            </h2>
            <div className="space-y-3 mb-8 print:mb-4 text-sm leading-relaxed">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-medium mb-1">
                  Données tierces sous licences ouvertes
                </h3>
                <p className="text-muted-foreground">
                  Les snapshots de biodiversité réutilisent les plateformes
                  iNaturalist, GBIF et INPN sous licences ouvertes (Creative
                  Commons). Ces données ne sont pas appropriables : la plateforme
                  n'en est que réutilisatrice, dans le respect de leurs licences.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-medium mb-1">Contenus des marcheurs</h3>
                <p className="text-muted-foreground">
                  Observations, photographies et textes demeurent la propriété de
                  leurs auteurs. L'association en détient une licence
                  d'exploitation (clause à insérer dans les statuts et les
                  conditions d'utilisation), et non la propriété. Les profils
                  communauté sont des données personnelles au sens du RGPD et
                  restent hors actif.
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-medium mb-1">
                  Actif propre de l'association
                </h3>
                <p className="text-muted-foreground">
                  La méthodologie, les indices (ICG, Fréquence), les agrégats, les
                  rapports, la structure et l'enrichissement de la base constituent
                  l'actif défendable. L'association est productrice et exploitante
                  de la base de données « Marches du Vivant » au sens de
                  l'article L.341-1 du Code de la propriété intellectuelle (droit
                  sui generis du producteur de base de données), sans préjudice
                  des droits personnels des contributeurs et des licences des
                  sources ouvertes.
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3">
              4. Formulation suggérée pour les statuts
            </h2>
            <blockquote className="rounded-xl border-l-4 border-primary bg-muted/30 p-4 mb-8 print:mb-4 text-sm italic leading-relaxed">
              « L'association est productrice et exploitante de la base de
              données "Marches du Vivant" (art. L.341-1 CPI — droit sui generis
              du producteur de base de données), sans préjudice des droits
              personnels des contributeurs et des licences des sources
              ouvertes. »
            </blockquote>

            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Scale className="w-3 h-3" />
              Mesures au {computedAt}, recalculées en direct à chaque consultation.
              Document interne — ne constitue pas un avis juridique.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
