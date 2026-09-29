import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Printer, Database, Scale, ShieldCheck, Users } from 'lucide-react';

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
}

const LABELS: Record<string, string> = {
  mesures_capteurs_iot: 'Mesures capteurs IoT',
  observations_marcheurs: 'Observations marcheurs',
  dont_observations_gaspard: '— dont signées G. Boréal',
  medias_marcheurs: 'Médias marcheurs',
  dont_medias_gaspard: '— dont signés G. Boréal',
  snapshots_biodiversite: 'Snapshots biodiversité',
  photos_marches: 'Photos de marches',
  marches: 'Marches',
  evenements: 'Événements',
  dont_evenements_crees_gaspard: '— dont créés par G. Boréal',
  participations: 'Participations',
  dont_participations_gaspard: '— dont G. Boréal',
  waypoints_exploration: "Points d'étape (waypoints)",
  audios_marches: 'Audios de marches',
  textes_marcheurs: 'Textes de marcheurs',
  profils_communaute_exclus: 'Profils communauté (exclus — RGPD)',
  proprietes: 'Propriétés documentées',
};

const ORDER = [
  'mesures_capteurs_iot',
  'observations_marcheurs',
  'dont_observations_gaspard',
  'medias_marcheurs',
  'dont_medias_gaspard',
  'snapshots_biodiversite',
  'photos_marches',
  'marches',
  'evenements',
  'dont_evenements_crees_gaspard',
  'participations',
  'dont_participations_gaspard',
  'waypoints_exploration',
  'audios_marches',
  'textes_marcheurs',
  'proprietes',
  'profils_communaute_exclus',
];

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function AdminNoteDonnees() {
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

            <h2 className="text-lg font-semibold mb-3">
              2. Qualification juridique en trois couches
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
              3. Formulation suggérée pour les statuts
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
