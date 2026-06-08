import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';

const fmt = (n?: number | null) =>
  typeof n === 'number' ? n.toLocaleString('fr-FR').replace(/\u202F/g, ' ') : '—';

/**
 * Fiche imprimable A4 — chiffres clés branchés en direct sur la RPC
 * `get_public_global_stats`. L'utilisateur clique "Imprimer" → choisit
 * "Enregistrer au format PDF" dans le navigateur → PDF avec chiffres frais.
 */
const AgentIAFiche: React.FC = () => {
  const { data: live, isLoading } = usePublicGlobalStats();

  // Auto-déclenche la boîte d'impression dès que les chiffres sont chargés
  useEffect(() => {
    if (!isLoading && live) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [isLoading, live]);

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <Helmet>
        <title>Fiche Agent IA — Les Marches du Vivant (à imprimer)</title>
        <meta name="robots" content="noindex" />
        <style>{`
          @page { size: A4; margin: 14mm; }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .fiche-page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          }
        `}</style>
      </Helmet>

      {/* Barre d'actions (cachée à l'impression) */}
      <div className="no-print sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/agent-ia"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la fiche en ligne
          </Link>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer / Enregistrer au format PDF
          </Button>
        </div>
      </div>

      {/* Fiche A4 */}
      <main className="bg-muted/30 min-h-screen py-8 print:py-0 print:bg-white">
        <article className="fiche-page mx-auto bg-white text-slate-900 shadow-xl print:shadow-none max-w-[210mm] p-12 print:p-0 leading-relaxed">
          {/* Header */}
          <header className="border-b-2 border-emerald-700 pb-4 mb-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 mb-2">
              La Fréquence du Vivant — Fiche Agent IA 2026
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Les Marches du Vivant
            </h1>
            <p className="text-emerald-700 italic mt-2 text-lg">
              Mesurer collectivement la biodiversité pour accélérer la transition agroécologique
            </p>
            <div className="text-[10px] text-slate-500 mt-3">
              Édition au {today} — chiffres extraits en direct de la base de production
            </div>
          </header>

          {/* Mission */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-2">Mission</h2>
            <p className="text-[13px]">
              <strong>Les Marches du Vivant</strong> est un agent IA collaboratif qui transforme la
              marche sur un domaine ou une exploitation agricole en{' '}
              <strong>protocole citoyen de mesure de la biodiversité</strong>. Il agrège les
              observations des marcheurs (photos géolocalisées, sons, témoignages) et les données
              scientifiques ouvertes (iNaturalist, Pl@ntNet, GBIF, MNHN), reconstruit la{' '}
              <strong>Fréquence du Vivant</strong> d'un lieu, identifie les espèces sentinelles et
              les zones blanches à explorer, et restitue un bilan biodiversité tracé et vérifiable.
            </p>
          </section>

          {/* KPIs — chiffres dynamiques */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-3">
              Impact & performance — campagne 2025-2026
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Kpi
                value={fmt(live?.especes_tracees)}
                label="espèces tracées"
                sub={`sur ${fmt(live?.domaines)} domaines mesurés`}
              />
              <Kpi
                value={fmt(live?.domaines)}
                label="domaines documentés"
                sub="Fréquence du Vivant calculée"
              />
              <Kpi
                value={fmt(live?.observations_citoyennes)}
                label="observations citoyennes"
                sub={`attribuées à ${fmt(live?.marcheurs)} marcheurs`}
              />
              <Kpi
                value={fmt(live?.marches_organisees)}
                label="marches organisées"
                sub={`${fmt(live?.participations_validees)} participations validées`}
              />
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">
              Données extraites le {today} via la fonction publique
              get_public_global_stats (source unique pour /agent-ia, /marches-du-vivant et cette
              fiche).
            </p>
          </section>

          {/* Capacités */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-3">
              4 capacités clés
            </h2>
            <ol className="text-[12px] space-y-2 list-decimal pl-5">
              <li>
                <strong>Collecte multimodale assistée</strong> — Photos (EXIF GPS), audio,
                témoignages, traces GPX. Conversion HEIC, déduplication NFD, attribution
                automatique des observations iNaturalist.
              </li>
              <li>
                <strong>Identification & enrichissement taxonomique</strong> — Reconnaissance
                d'espèces (vision + bioacoustique), résolution noms français, classification
                trophique et écologique (12 fonctions).
              </li>
              <li>
                <strong>Calcul de la Fréquence du Vivant</strong> — Indice composite par marche et
                par domaine. Détection automatique des zones blanches à prioriser.
              </li>
              <li>
                <strong>Restitution & partage souverain</strong> — Pack Vivant (PDF + Excel + CSV
                + GeoJSON + KML), pages publiques /m/:slug, chatbot contextuel.
              </li>
            </ol>
          </section>

          {/* Engagement éthique */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-3">
              Engagement éthique
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] list-['—_'] pl-4">
              <li>Open Source — Licence MIT</li>
              <li>IA Responsable (charte bziiit - PiloTerra)</li>
              <li>Données hébergées en UE (Supabase)</li>
              <li>RGPD — données non revendues</li>
              <li>Empreinte carbone mesurée</li>
              <li>Traçabilité complète (snapshots horodatés)</li>
              <li>Protection des espèces sensibles (flou GPS)</li>
              <li>Souveraineté des données</li>
            </ul>
          </section>

          {/* Pour qui */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-3">Pour qui ?</h2>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <Profile
                title="Collectivités & PNR"
                desc="Documenter la biodiversité communale, alimenter les ABC, piloter TVB / OFB."
              />
              <Profile
                title="Entreprises RSE & domaines agricoles"
                desc="Mesurer et publier l'impact biodiversité (CSRD, LUCIE, Ecovadis)."
              />
              <Profile
                title="Associations & éducation"
                desc="Animer des protocoles citoyens (Vigie-Nature, STOC) en mobile-first."
              />
              <Profile
                title="Scientifiques & gestionnaires"
                desc="Flux de données fraîches, géolocalisées, exportables (GeoJSON / KML / CSV)."
              />
            </div>
          </section>

          {/* Déploiement */}
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 mb-3">
              Déploiement en 3 étapes
            </h2>
            <div className="grid grid-cols-3 gap-3 text-[12px]">
              <Step
                when="Jour 1"
                title="Connexion"
                desc="Création du domaine (polygone GPS), invitation des marcheurs."
              />
              <Step
                when="Semaine 1"
                title="Première marche"
                desc="2 h de terrain. Curation Ambassadeurs < 15 min."
              />
              <Step
                when="Jour 14"
                title="Premier Pack Vivant"
                desc="Bilan publiable (PDF + /m/:slug), Fréquence calculée."
              />
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-slate-200 pt-4 mt-10 text-center text-[10px] text-slate-500">
            <p className="italic text-emerald-700 text-sm not-italic font-medium mb-1">
              IA responsable · Open Source · Ancrage terrain
            </p>
            <p>la-frequence-du-vivant.com</p>
          </footer>
        </article>
      </main>
    </>
  );
};

const Kpi: React.FC<{ value: string; label: string; sub: string }> = ({ value, label, sub }) => (
  <div className="border border-emerald-200 bg-emerald-50/50 rounded-md p-3">
    <div className="text-3xl font-bold text-emerald-800 leading-none">{value}</div>
    <div className="text-[12px] font-semibold text-slate-800 mt-1">{label}</div>
    <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
  </div>
);

const Profile: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div>
    <div className="font-semibold text-emerald-800">› {title}</div>
    <div className="text-slate-600">{desc}</div>
  </div>
);

const Step: React.FC<{ when: string; title: string; desc: string }> = ({ when, title, desc }) => (
  <div className="border border-slate-200 rounded-md p-2.5">
    <div className="text-[9px] uppercase tracking-widest text-emerald-700">{when}</div>
    <div className="font-semibold text-slate-800 mt-0.5">{title}</div>
    <div className="text-[11px] text-slate-600 mt-1">{desc}</div>
  </div>
);

export default AgentIAFiche;
