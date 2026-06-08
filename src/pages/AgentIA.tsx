import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, Sparkles, Leaf, Users, ShieldCheck, MapPin, Database, Activity, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

const stats = [
  { value: '2 002', label: 'espèces tracées',        sub: 'sur 80 domaines mesurés (sources scientifiques agrégées)' },
  { value: '80',    label: 'domaines documentés',    sub: 'avec Fréquence du Vivant calculée et historisée' },
  { value: '592',   label: 'observations citoyennes',sub: 'attribuées à 45 marcheurs (photos · audio · témoignages)' },
  { value: '13',    label: 'marches organisées',     sub: '91 participations validées' },
];

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

const AgentIA: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Agent IA · Les Marches du Vivant — Mesure collaborative de la biodiversité</title>
        <meta name="description" content="Fiche Agent IA — Les Marches du Vivant : agent IA collaboratif de mesure de la biodiversité en domaine agricole. Open source, IA responsable, données souveraines." />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/agent-ia" />
      </Helmet>

      {/* Nav */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Link>
        <Button asChild size="sm" variant="default">
          <a href="/fiche-agent-marches-du-vivant.pdf" download>
            <Download className="h-4 w-4 mr-2" /> Télécharger la fiche PDF
          </a>
        </Button>
      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-20 max-w-5xl">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-primary mb-6">
          <Sparkles className="h-4 w-4" />
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
          <Badge variant="outline">v1.0</Badge>
          <Badge variant="outline">AI Gateway</Badge>
          <Badge variant="outline">Supabase souverain (UE)</Badge>
          <Badge variant="outline">Open Source · MIT</Badge>
        </div>
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
        <p className="text-lg text-muted-foreground mb-2">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nos équipes vous accompagnent de la première marche au premier rapport public.</p>
        <p className="text-sm italic text-primary mb-8">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;IA responsable · Open Source · Ancrage terrain</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <a href="https://calendly.com/laurent-bziiit/entretien-ia" target="_blank" rel="noreferrer">
              Prendre rendez-vous →
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/fiche-agent-marches-du-vivant.pdf" download>
              <Download className="h-4 w-4 mr-2" /> Télécharger la fiche PDF
            </a>
          </Button>
        </div>
        <div className="mt-12 text-xs text-muted-foreground">
          la-frequence-du-vivant.com&nbsp;
        </div>
      </section>
    </div>
  );
};

export default AgentIA;
