import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, Sparkles, Leaf, Users, ShieldCheck, MapPin, Database, Activity, Microscope, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';
import {
  BRAND_LOGO_ALT,
  BRAND_LOGO_CAPTION,
  BRAND_LOGO_HEIGHT,
  BRAND_LOGO_ID,
  BRAND_LOGO_MARK,
  BRAND_LOGO_PATH,
  BRAND_LOGO_TITLE,
  BRAND_LOGO_URL,
  BRAND_LOGO_WIDTH,
  brandLogoImageObject,
} from '@/content/brandLogo';

/**
 * Logo retenu : « Empreinte vivante ».
 * Dans l'interface on affiche la marque seule et on compose le nom en HTML :
 * un texte réellement rendu reste net à toute taille, suit le thème clair/sombre
 * et se lit par les lecteurs d'écran, ce que le wordmark gravé dans le PNG ne fait pas.
 */
const LOGO_SRC = BRAND_LOGO_MARK.path;

/** Fiche de l'agent sur le portail partenaire PiloTerra (lien d'entité réciproque). */
const PILOTERRA_URL = 'https://piloterra.fr/agents/les-marches-du-vivant';





const sections = [
  { num: '01', title: 'Identité & Statut', desc: "Nom, tagline, catégorie, version, statut de l'agent." },
  { num: '02', title: 'Mission', desc: "Ce que fait l'agent, pour qui, dans quel but." },
  { num: '03', title: 'Capacités clés', desc: '4 compétences principales avec description courte.' },
  { num: '04', title: 'Impact & Performance', desc: '4 métriques mesurées : temps, fiabilité, volume, portée.' },
  { num: '05', title: 'Engagement éthique', desc: 'Open Source, IA Responsable, RGPD, Souveraineté.' },
  { num: '06', title: 'Pour qui & Déploiement', desc: 'Profils utilisateurs + 3 étapes pour démarrer.' },
];

const capabilities = [
  { icon: Database,   title: 'Collecte multimodale assistée', desc: 'Photos (EXIF GPS), audio, témoignages, traces GPX. Conversion HEIC, déduplication NFD, attribution automatique des observations iNaturalist aux marcheurs présents.' },
  { icon: Microscope, title: 'Identification & enrichissement taxonomique', desc: "Reconnaissance d'espèces (vision + bioacoustique), résolution noms français, classification trophique et écologique (12 fonctions : mellifère, fixateur d'azote, bio-indicateur…)." },
  { icon: Activity,   title: 'Calcul de la Fréquence du Vivant', desc: 'Indice composite par marche et par domaine. Détection automatique des zones blanches (mailles non documentées) à prioriser.' },
  { icon: MapPin,     title: 'Restitution & partage souverain', desc: 'Pack Vivant (PDF + Excel + CSV + GeoJSON + KML), pages publiques /m/:slug ON/OFF, chatbot contextuel pour élus, agriculteurs et scientifiques.' },
];

const fmt = (n?: number | null) =>
  typeof n === 'number' ? n.toLocaleString('fr-FR').replace(/\u202F/g, ' ') : '—';


const ethics = [
  'Open Source — Licence MIT',
  'IA Responsable (selon référentiel charte bziiit - PiloTerra)',
  'Données hébergées en UE (Supabase)',
  'RGPD — données non revendues',
  'Empreinte carbone mesurée',
  'Traçabilité complète (snapshots horodatés)',
  'Protection des espèces sensibles (flou GPS)',
  'Souveraineté des données',
];

const profiles = [
  { title: 'Collectivités & PNR',                    desc: "Documenter la biodiversité communale, alimenter les ABC, piloter les politiques TVB / OFB." },
  { title: 'Entreprises RSE & domaines agricoles',   desc: "Mesurer et publier l'impact biodiversité d'un site (CSRD, LUCIE, Ecovadis), animer des marches d'équipe." },
  { title: 'Associations & éducation',               desc: "Animer des protocoles citoyens (Vigie-Nature, STOC) avec une UI mobile-first." },
  { title: 'Scientifiques & gestionnaires',          desc: "Flux de données fraîches, géolocalisées, attribuées, exportables (GeoJSON / KML / CSV)." },
];

const steps = [
  { when: 'Jour 1',    title: 'Connexion',          desc: 'Création du domaine (polygone GPS), invitation des marcheurs, sources iNaturalist branchées.' },
  { when: 'Semaine 1', title: 'Première marche',    desc: "2 h sur le terrain. L'agent collecte, identifie, géolocalise. Curation Ambassadeurs < 15 min." },
  { when: 'Jour 14',   title: 'Premier Pack Vivant',desc: 'Bilan publiable (PDF + page /m/:slug), Fréquence calculée, zones blanches identifiées.' },
];

const SITE = 'https://la-frequence-du-vivant.com';
const AGENT_URL = `${SITE}/agent-ia`;
const AGENT_IMAGE = `${SITE}/agent-ia-marches-du-vivant.png`;

/** Contributeurs à l'origine de l'agent. */
const contributeurs = [
  {
    nom: 'Laurent Tripied',
    role: 'CEO bziiit · PiloTerra',
    apport:
      "Direction technologique de l'agent et cadre d'IA responsable : charte bziiit - PiloTerra, IA frugale, architecture de données souveraine.",
    lien: 'https://www.linkedin.com/in/laurenttripied/',
    lienLabel: 'LinkedIn',
  },
  {
    nom: 'Gaspard Boréal',
    role: 'Auteur du recueil « La Fréquence du Vivant »',
    apport:
      "Créateur des Marches du Vivant : protocole de marche, écoute du vivant et bioacoustique, récit de territoire et direction sensible de l'agent.\u00a0",
    lien: 'https://www.gaspardboreal.com/',
    lienLabel: 'gaspardboreal.com',
  },
];

/** Faits courts, autonomes et citables — pensés pour les moteurs et les modèles de langage. */
const enBref = [
  "Nom de l'agent : Les Marches du Vivant.",
  "Éditeur : La Fréquence du Vivant, association loi 1901 (Charente, Nouvelle-Aquitaine).",
  "Contributeurs à l'origine de l'agent : Laurent Tripied (CEO bziiit - PiloTerra) et Gaspard Boréal (auteur du recueil « La Fréquence du Vivant », créateur des Marches du Vivant).",
  "Fonction : mesurer collectivement la biodiversité d'un lieu pendant une marche de terrain.",
  "Entrées : photos géolocalisées, enregistrements sonores, témoignages, traces GPX, données iNaturalist, Pl@ntNet et GBIF.",
  "Sorties : indice « Fréquence du Vivant », liste d'espèces enrichie, zones blanches à explorer, Pack Vivant (PDF, Excel, CSV, GeoJSON, KML).",
  "Usage : collectivités et parcs naturels, domaines agricoles, entreprises (RSE / CSRD), associations et écoles.",
  "Origine terrain : première marche en août 2025 sur la Dordogne — Gaspard Boréal remonte le fleuve de Bec d'Ambès jusqu'aux pentes du Puy de Sancy (1 370 m d'altitude).",
  "Cadre : open source (MIT), RGPD, hébergement en Union européenne, données non revendues, flou GPS sur les espèces sensibles.",
];

const PERSON_LT = `${AGENT_URL}#laurent-tripied`;
const PERSON_GB = `${AGENT_URL}#gaspard-boreal`;

const AGENT_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    brandLogoImageObject(AGENT_URL, false),
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'La Fréquence du Vivant',
      url: `${SITE}/`,
      logo: { '@id': BRAND_LOGO_ID },
      image: { '@id': BRAND_LOGO_ID },
      description:
        "Association loi 1901 : bioacoustique, science participative et transition agroécologique. Éditrice de l'agent IA Les Marches du Vivant.",
      sameAs: [
        `${SITE}/marches-du-vivant`,
        `${SITE}/marches-du-vivant/association`,
        PILOTERRA_URL,
      ],
    },

    {
      '@type': 'Person',
      '@id': PERSON_LT,
      name: 'Laurent Tripied',
      jobTitle: 'CEO bziiit - PiloTerra',
      description:
        "Direction technologique de l'agent IA Les Marches du Vivant et cadre d'IA responsable (charte bziiit - PiloTerra, IA frugale).",
      affiliation: { '@type': 'Organization', name: 'bziiit - PiloTerra', url: 'https://piloterra.fr' },
      sameAs: ['https://www.linkedin.com/in/laurenttripied/'],
    },
    {
      '@type': 'Person',
      '@id': PERSON_GB,
      name: 'Gaspard Boréal',
      jobTitle: "Auteur du recueil « La Fréquence du Vivant », créateur des Marches du Vivant",
      description:
        "Conception du protocole de marche, de l'écoute du vivant et du récit de territoire de l'agent IA Les Marches du Vivant.",
      affiliation: { '@id': `${SITE}/#organization` },
      sameAs: ['https://www.gaspardboreal.com/'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${AGENT_URL}#software`,
      name: 'Les Marches du Vivant',
      alternateName: 'Agent IA Les Marches du Vivant',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Agent IA — biodiversité, agriculture, science participative',
      operatingSystem: 'Web (navigateur, mobile-first)',
      url: AGENT_URL,
      image: AGENT_IMAGE,
      inLanguage: 'fr',
      datePublished: '2025-08-01',
      dateModified: '2026-08-19',
      softwareVersion: '1.3',
      license: 'https://opensource.org/licenses/MIT',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      areaServed: { '@type': 'Country', name: 'France' },
      publisher: { '@id': `${SITE}/#organization` },
      author: [{ '@id': `${SITE}/#organization` }, { '@id': PERSON_LT }, { '@id': PERSON_GB }],
      contributor: [{ '@id': PERSON_LT }, { '@id': PERSON_GB }],
      description:
        "Agent IA de mesure collaborative de la biodiversité édité par l'association La Fréquence du Vivant : collecte multimodale sur le terrain (photos géolocalisées, sons, témoignages, traces GPX), identification des espèces par vision et bioacoustique, calcul de l'indice Fréquence du Vivant, détection des zones blanches et exports ouverts (PDF, Excel, CSV, GeoJSON, KML).",
      featureList: [
        'Collecte multimodale géolocalisée (photo, audio, texte, GPX)',
        "Identification d'espèces par vision et bioacoustique",
        'Résolution des noms français et classification écologique (12 fonctions)',
        'Calcul de la Fréquence du Vivant et détection des zones blanches',
        'Chatbot contextuel pour élus, agriculteurs et scientifiques',
        'Exports ouverts : PDF, Excel, CSV, GeoJSON, KML',
        'API et serveur MCP (Model Context Protocol)',
      ],
      keywords:
        'biodiversité, agriculture, agroécologie, science participative, sol vivant, collectivités, RSE, CSRD, données géospatiales, bioacoustique',
      sameAs: [`${SITE}/marches-du-vivant`, `${SITE}/roadmap/frequence-jardin`, PILOTERRA_URL],
    },
  ],
};



const AgentIA: React.FC = () => {
  const { data: live } = usePublicGlobalStats();
  const stats = [
    {
      value: fmt(live?.especes_tracees),
      label: 'espèces tracées',
      sub: `sur ${fmt(live?.domaines)} domaines mesurés (sources scientifiques agrégées)`,
    },
    {
      value: fmt(live?.domaines),
      label: 'domaines documentés',
      sub: 'avec Fréquence du Vivant calculée et historisée',
    },
    {
      value: fmt(live?.observations_citoyennes),
      label: 'observations citoyennes',
      sub: `attribuées à ${fmt(live?.marcheurs)} marcheurs (photos · audio · témoignages)`,
    },
    {
      value: fmt(live?.marches_organisees),
      label: 'marches organisées',
      sub: `${fmt(live?.participations_validees)} participations validées`,
    },
  ];
  return (

    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Agent IA · Les Marches du Vivant — Mesure collaborative de la biodiversité</title>
        <meta name="description" content="Les Marches du Vivant, agent IA de mesure collaborative de la biodiversité édité par l'association La Fréquence du Vivant : collecte multimodale, identification des espèces, indice Fréquence du Vivant, exports ouverts." />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/agent-ia" />
        <meta property="og:title" content="Les Marches du Vivant — Agent IA de mesure collaborative de la biodiversité" />
        <meta property="og:description" content="Agent IA édité par l'association La Fréquence du Vivant : collecte multimodale sur le terrain, identification des espèces, indice Fréquence du Vivant, exports PDF / CSV / GeoJSON / KML." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={AGENT_URL} />
        <meta property="og:image" content={AGENT_IMAGE} />
        <meta property="og:image:alt" content={BRAND_LOGO_ALT} />
        <meta property="og:logo" content={BRAND_LOGO_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={AGENT_IMAGE} />
        <meta name="twitter:image:alt" content={BRAND_LOGO_ALT} />
        {/* Signaux recherche d'images : le logo de marque, ses dimensions et sa légende */}
        <meta itemProp="image" content={BRAND_LOGO_URL} />
        <meta name="thumbnail" content={BRAND_LOGO_URL} />
        <link rel="image_src" href={BRAND_LOGO_URL} />
        <link
          rel="preload"
          as="image"
          href={LOGO_SRC}
          imageSrcSet={`${LOGO_SRC} ${BRAND_LOGO_WIDTH}w`}
        />
        <meta name="image:width" content={String(BRAND_LOGO_WIDTH)} />
        <meta name="image:height" content={String(BRAND_LOGO_HEIGHT)} />
        <meta name="image:caption" content={BRAND_LOGO_CAPTION} />
        <script type="application/ld+json">{JSON.stringify(AGENT_JSONLD)}</script>

      </Helmet>


      {/* Nav */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <Link to="/marches-du-vivant" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2 min-w-0">
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <img
            src={LOGO_SRC}
            alt={BRAND_LOGO_ALT}
            title={BRAND_LOGO_TITLE}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/25 shrink-0"
            width={32}
            height={32}
          />

          <span className="truncate">Accueil</span>
        </Link>
        <Button asChild size="sm" variant="default">
          <Link to="/agent-ia/fiche" target="_blank" rel="noreferrer">
            <Download className="h-4 w-4 mr-2" /> Télécharger la fiche PDF
          </Link>
        </Button>

      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-20 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          {/* Signature visuelle — marque seule + nom composé en HTML (lisible à toute taille) */}
          <figure className="relative shrink-0 self-start md:self-center m-0 flex flex-col items-center">
            <div
              className="absolute -inset-4 rounded-full blur-2xl opacity-60"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)' }}
              aria-hidden
            />
            <img
              src={LOGO_SRC}
              alt={BRAND_LOGO_ALT}
              title={BRAND_LOGO_TITLE}
              className="relative h-28 w-28 md:h-44 md:w-44 rounded-full object-cover ring-1 ring-primary/25 shadow-2xl"
              width={176}
              height={176}
              loading="eager"
              decoding="async"
            />
            <figcaption className="relative mt-4 flex flex-col items-center gap-2">
              <span className="text-center text-[13px] md:text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                Les Marches du Vivant
              </span>
              <span className="flex items-center gap-2" aria-hidden>
                <span className="h-px w-8 bg-primary/40" />
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                <span className="h-px w-8 bg-primary/40" />
              </span>
              <span className="text-center text-[11px] leading-snug text-muted-foreground">
                Logo « Empreinte vivante »
              </span>
            </figcaption>
          </figure>



          <div className="min-w-0">
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-primary mb-6">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>LA FRÉQUENCE DU VIVANT — FICHE AGENT IA 2026</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
              Les Marches<br/>du Vivant
            </h1>
            <p className="text-xl md:text-2xl text-primary italic max-w-3xl mb-8">
              Mesurer collectivement la biodiversité pour accélérer la transition agroécologique
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">ACTIF</Badge>
              <Badge variant="outline">v1.3</Badge>
              <Badge variant="outline">AI Gateway</Badge>
              <Badge variant="outline">Supabase souverain (UE)</Badge>
              <Badge variant="outline">Open Source · MIT</Badge>
            </div>
          </div>
        </div>
      </section>


      {/* En bref — faits courts et citables (SEO / GEO) */}
      <section className="container mx-auto px-4 pb-4 max-w-5xl">
        <Card className="p-6 md:p-8 border-primary/20 bg-primary/5">
          <h2 className="text-sm uppercase tracking-widest text-primary mb-4">En bref</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {enBref.map((fact) => (
              <li key={fact} className="flex items-start gap-2 text-sm leading-relaxed">
                <Leaf className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>



      {/* Mission */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <Card className="p-8 md:p-12 border-primary/20 bg-card/50 backdrop-blur">
          <div className="text-xs uppercase tracking-widest text-primary mb-4">Mission</div>
          <p className="text-lg md:text-xl leading-relaxed">
            <strong>Les Marches du Vivant</strong> est un agent IA collaboratif qui transforme la marche sur un domaine, exploitation agricole en
            <strong> protocole citoyen de mesure de la biodiversité</strong>. Il agrège en temps réel les observations des marcheurs
            (photos géolocalisées, sons, témoignages) et les données scientifiques ouvertes (iNaturalist, Pl@ntNet, GBIF, MNHN), reconstruit
            la <strong>Fréquence du Vivant</strong> d'un lieu, identifie les <strong>espèces sentinelles</strong> et les
            <strong> zones blanches</strong> à explorer, et restitue un bilan biodiversité <strong>tracé, vérifiable</strong>,
            sans tableur, sans intermédiaire, en pleine souveraineté.
          </p>
        </Card>
      </section>

      {/* Capacités */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Ce qu'il fait</h2>
        <p className="text-muted-foreground mb-10">4 capacités clés applicables à tout territoire agricole, naturel ou péri-urbain.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {capabilities.map((c, i) => (
            <Card key={i} className="p-6 hover:border-primary/40 transition">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary shrink-0">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="bg-primary/5 border-y border-primary/10 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Impact & performance</h2>
          <p className="text-muted-foreground mb-10 italic">Données issues des déploiements La Fréquence du Vivant — campagne 2025-2026.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <Card key={i} className="p-6 bg-card border-primary/20">
                <div className="text-4xl md:text-5xl font-bold text-accent-foreground mb-2" style={{ color: '#F2B544' }}>{s.value}</div>
                <div className="font-semibold mb-2">{s.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{s.sub}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Éthique */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold">Engagement éthique</h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          <strong>"Les Marches du Vivant"</strong> a été développé dans le respect de la <strong>charte IA responsable de notre partenaire technologique bziiit&nbsp;- PiloTerra</strong> et d'une
          philosophie open source en collaboration avec le <strong>collectif OSFARM</strong>. La donnée d'observation reste la propriété du marcheur, de l'exploitant et de l'association <strong>"La Fréquence du vivant"</strong>.
          <strong> Aucune revente, aucun entraînement de modèle tiers sur vos données.</strong> Les espèces sensibles bénéficient d'un
          flou géographique automatique.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ethics.map((e, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm">
              <Leaf className="h-4 w-4 text-primary shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      </section>

      {/* À l'origine de l'agent */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold">À l'origine de l'agent</h2>
        </div>
        <p className="text-muted-foreground mb-4 max-w-3xl">
          L'agent <strong>Les Marches du Vivant</strong> est édité par l'association{' '}
          <Link to="/marches-du-vivant/association" className="text-primary underline underline-offset-4">
            La Fréquence du Vivant
          </Link>
          . Il est né de la rencontre de deux contributeurs.
        </p>
        <Card className="p-5 mb-8 border-primary/20 bg-primary/5 max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-primary mb-2">Origine terrain</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le projet a débuté en <strong>août 2025</strong> lors du projet <strong>« Fréquence de la rivière Dordogne »</strong> : Gaspard Boréal a remonté le fleuve de l'<strong>estuaire de Bec d'Ambès</strong> jusqu'aux <strong>pentes du Puy de Sancy</strong> (Puy-de-Dôme), à <strong>1 370 mètres d'altitude</strong>.
          </p>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          {contributeurs.map((c) => (
            <Card key={c.nom} className="p-6 border-primary/20">
              <h3 className="font-bold text-lg">{c.nom}</h3>
              <p className="text-sm text-primary font-medium mb-3">{c.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.apport}</p>
              <a
                href={c.lien}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.lienLabel} →
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* Pour qui */}

      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold">Pour qui&nbsp;?</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {profiles.map((p, i) => (
            <Card key={i} className="p-6">
              <h3 className="font-bold text-lg mb-2 text-primary">› {p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Déploiement */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Déploiement en 3 étapes</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <Card key={i} className="p-6 relative overflow-hidden">
              <div className="text-xs uppercase tracking-widest text-primary mb-2">{s.when}</div>
              <h3 className="font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <div className="absolute -bottom-4 -right-4 text-6xl font-bold text-primary/5">{i + 1}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Structure rappel */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl font-bold mb-2 text-muted-foreground">Structure de la fiche</h2>
        <p className="text-sm text-muted-foreground mb-6 italic">6 sections standardisées — modèle bziiit × PiloTerra applicable à tout agent IA responsable.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((s) => (
            <div key={s.num} className="flex gap-3 p-3 rounded-lg border border-border">
              <span className="text-primary font-bold">{s.num}</span>
              <div>
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Prêt à mesurer le vivant<br/>de votre domaine ?</h2>
        <p className="text-lg text-muted-foreground mb-2">Nos équipes vous accompagnent de la première marche au premier rapport public.</p>
        <p className="text-sm italic text-primary mb-8">IA responsable · Open Source · Ancrage terrain</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <a href="https://calendly.com/laurent-bziiit/entretien-ia" target="_blank" rel="noreferrer">
              Prendre rendez-vous →
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/agent-ia/fiche" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 mr-2" /> Télécharger la fiche PDF
            </Link>
          </Button>
          <Button asChild size="lg" variant="hero">
            <a href="https://la-frequence-du-vivant.com/marches-du-vivant/connexion">
              <UserPlus className="h-4 w-4 mr-2" /> Créer un compte
            </a>
          </Button>
        </div>
        <div className="mt-12 flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <img
            src={LOGO_SRC}
            alt={BRAND_LOGO_ALT}
            title={BRAND_LOGO_TITLE}
            className="h-12 w-12 rounded-full object-cover ring-1 ring-primary/20 opacity-90"
            width={48}
            height={48}
            loading="lazy"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
            Les Marches du Vivant
          </span>

          la-frequence-du-vivant.com&nbsp;

          <span className="text-[11px]">
            Référencé sur le portail{' '}
            <a
              href={PILOTERRA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              PiloTerra
            </a>
          </span>


        </div>
      </section>
    </div>
  );
};

export default AgentIA;
