import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sprout,
  Trees,
  Users,
  Wheat,
  Trophy,
  Building2,
  Network,
  Tractor,
  ArrowRight,
  Bug,
  Flower2,
  type LucideIcon,
} from 'lucide-react';
import Footer from '@/components/Footer';
import TrustBar from '@/components/marches-vivant/TrustBar';
import ContactFormB2B from '@/components/marches-vivant/ContactFormB2B';
import { Button } from '@/components/ui/button';
import { useMarchesDuVivantStats } from '@/hooks/useMarchesDuVivantStats';
import AnimatedStat from '@/components/marches-vivant/AnimatedStat';

type ProofItem = { value: number; label: string; sub: string };

const buildProofs = (
  stats: { marches: number; regions: number; departements: number; especes: number; marcheurs: number } | undefined,
): ProofItem[] => [
  {
    value: stats?.marches ?? 0,
    label: 'Marches du Vivant déjà organisées',
    sub: 'Des exploitations et coopératives déjà engagées',
  },
  {
    value: stats?.regions ?? 0,
    label: 'Régions françaises mobilisées',
    sub: 'Un réseau national au plus près de vos territoires',
  },
  {
    value: stats?.departements ?? 0,
    label: 'Départements traversés',
    sub: 'Une couverture fine, adaptée à chaque bassin agricole',
  },
  {
    value: stats?.especes ?? 0,
    label: 'Espèces vivantes identifiées sur le terrain',
    sub: 'Inventaire opposable GBIF / iNaturalist · preuve de biodiversité réelle',
  },
  {
    value: stats?.marcheurs ?? 0,
    label: 'Marcheurs-observateurs actifs',
    sub: 'Agriculteurs, techniciens, élus, citoyens — une intelligence collective au service du vivant',
  },
];

const leviers = [
  {
    icon: Sprout,
    color: 'lime',
    title: 'Services rendus par la biodiversité',
    desc: 'Inventaire vivant sur site (pollinisateurs, auxiliaires, sols, sons) avec restitution GBIF opposable.',
    tag: 'Sensibilisation',
  },
  {
    icon: Users,
    color: 'amber',
    title: 'Atelier collectif « Services de la biodiversité »',
    desc: 'Format 3 h : marche d\'observation + atelier de cartographie des services (pollinisation, régulation des ravageurs, qualité des sols).',
    tag: 'Atelier',
  },
  {
    icon: Wheat,
    color: 'orange',
    title: 'Pratiques culturales alternatives',
    desc: 'Restitution comparée des pratiques disponibles : agroforesterie, bandes enherbées, couverts végétaux, matériel bas-intrants.',
    tag: 'Pratiques',
  },
  {
    icon: Trees,
    color: 'emerald',
    title: 'Réglementation haies & bocage',
    desc: 'Diagnostic du linéaire bocager + temps d\'information réglementaire sur la taille, l\'entretien, les dispositions PAC/BCAE.',
    tag: 'Information',
  },
  {
    icon: Trophy,
    color: 'purple',
    title: 'Benchmark des leaders',
    desc: 'Visites organisées dans des exploitations, domaines exemples — véritables démonstrateurs « vivant » pour les territoires.',
    tag: 'Visites',
  },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string; tagBg: string; tagText: string }> = {
  lime: { bg: 'bg-lime-950/40', border: 'border-lime-500/30', icon: 'text-lime-400', tagBg: 'bg-lime-950/30 border-lime-500/20', tagText: 'text-lime-300' },
  emerald: { bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', icon: 'text-emerald-400', tagBg: 'bg-emerald-950/30 border-emerald-500/20', tagText: 'text-emerald-300' },
  amber: { bg: 'bg-amber-950/40', border: 'border-amber-500/30', icon: 'text-amber-400', tagBg: 'bg-amber-950/30 border-amber-500/20', tagText: 'text-amber-300' },
  orange: { bg: 'bg-orange-950/40', border: 'border-orange-500/30', icon: 'text-orange-400', tagBg: 'bg-orange-950/30 border-orange-500/20', tagText: 'text-orange-300' },
  purple: { bg: 'bg-purple-950/40', border: 'border-purple-500/30', icon: 'text-purple-400', tagBg: 'bg-purple-950/30 border-purple-500/20', tagText: 'text-purple-300' },
};

const formats = [
  {
    icon: Building2,
    title: 'Format Coopérative / CUMA',
    duree: '1 journée (7 h)',
    desc: 'Animation collective d\'adhérents sur une exploitation pilote. Marche d\'observation, atelier services écosystémiques, plan d\'action.',
    livrable: 'Diagnostic Chapitre 5 RSO opposable + plan de progression sur 12 mois.',
    cible: 'Adhérents · administrateurs · animateurs',
  },
  {
    icon: Network,
    title: 'Format Fédération / Chambre',
    duree: 'Programme régional',
    desc: 'Plusieurs marches en réseau sur le territoire, animation inter-organisation, mise en commun des données biodiversité.',
    livrable: 'Benchmark inter-territoires + restitution publique + base GBIF partagée.',
    cible: 'FRCUMA · Chambres d\'agriculture · GIEE',
  },
  {
    icon: Tractor,
    title: 'Format Exploitant',
    duree: '1/2 journée (3h30)',
    desc: 'Marche d\'observation sur une exploitation, focus haies/bocage et auxiliaires de culture, restitution cartographique.',
    livrable: 'Carte des services écosystémiques de l\'exploitation + plan d\'action personnalisé.',
    cible: 'Exploitants engagés ou en transition',
  },
];

const leaders: { nom: string; highlight: string; detail: string; icon: LucideIcon }[] = [
  {
    nom: 'Vincent',
    highlight: 'Mosaïque de 4 milieux vivants',
    detail: 'Prairie humide · Potager sol vivant · Forêt · Lande sèche',
    icon: Sprout,
  },
  {
    nom: 'Jean-François',
    highlight: 'Équilibres écologiques en action',
    detail: 'Corridor écologique · Gestion des ravageurs · Partenariat apiculteurs',
    icon: Bug,
  },
  {
    nom: 'Gaspard',
    highlight: 'Jardin en mouvement',
    detail: 'Jardin en mouvement sur 4 000 m²',
    icon: Flower2,
  },
];

const MarchesDuVivantAgriculture = () => {
  const { data: stats, isLoading: statsLoading } = useMarchesDuVivantStats();
  const proofs = buildProofs(stats);

  const scrollToContact = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Marches du Vivant pour l'Agriculture — Coopératives, CUMA, Fédérations</title>
        <meta
          name="description"
          content="Transformez le Chapitre 5 du RSO CUMA (Respect du Vivant, 41,5 % en moyenne) en expérience terrain. Marches du Vivant pour Coopératives, CUMA, Fédérations et exploitants."
        />
        <meta
          name="keywords"
          content="biodiversité agricole, CUMA, coopérative, RSO, Chapitre 5, services écosystémiques, haies bocage, agroforesterie, Nouvelle-Aquitaine"
        />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant/agriculture" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header retour */}
        <header className="border-b border-border/20 bg-card/40 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link
              to="/marches-du-vivant"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour aux Marches du Vivant</span>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-950/40 border border-lime-500/30 rounded-full">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wide text-lime-300">
                  Coopératives · CUMA · Fédérations · Exploitants
                </span>
              </div>

              <h1 className="font-crimson text-4xl md:text-5xl lg:text-6xl text-foreground">
                Pour les{' '}
                <span className="text-lime-400">Acteurs Agricoles</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
                Les Marches du Vivant transforment le respect du Vivant en expérience
                concrète sur vos parcelles.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={scrollToContact}
                  className="bg-lime-500 hover:bg-lime-600 text-lime-950 font-medium"
                >
                  Organiser une marche agricole
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToContact}
                  className="border-lime-500/40 text-lime-300 hover:bg-lime-950/30"
                >
                  Demander un éductour
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ProofBar chiffrée */}
        <section className="py-12 px-6 border-y border-border/20 bg-card/20">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-8 font-mono">
              Marches du Vivant — chiffres clés du réseau, en temps réel
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {proofs.map((p, i) => (
                <AnimatedStat
                  key={p.label}
                  value={p.value}
                  loading={statsLoading}
                  duration={2200}
                  label={p.label}
                  sub={p.sub}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 5 leviers */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                5 leviers que votre marche active
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-center">
                Chaque enjeu identifié par le référentiel RSO devient une séquence concrète,
                vécue par vos adhérents sur le terrain.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leviers.map((l, i) => {
                const c = colorClasses[l.color];
                const Icon = l.icon;
                return (
                  <motion.div
                    key={l.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-6"
                  >
                    <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${c.icon}`} />
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs ${c.tagBg} border rounded-full ${c.tagText} mb-3`}>
                      {l.tag}
                    </span>
                    <h3 className="font-crimson text-xl text-foreground mb-2">{l.title}</h3>
                    <p className="text-sm text-muted-foreground text-center">{l.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Argument massue */}
        <section className="py-8 px-6 bg-lime-950/20 border-y border-lime-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-lime-300 font-medium text-center">
              « Vos adhérents passent du référentiel papier à la mesure terrain :
              chaque marche produit une donnée biodiversité opposable, alignée avec
              les exigences RSE / RSO »
            </p>
          </div>
        </section>

        {/* 3 formats */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                3 formats pour 3 publics agricoles
              </h2>
              <p className="text-muted-foreground text-center">
                Chaque marche est calibrée pour la structure organisatrice et ses livrables attendus.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formats.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-6 flex flex-col"
                  >
                    <div className="w-12 h-12 rounded-xl bg-lime-950/40 border border-lime-500/30 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-lime-400" />
                    </div>
                    <h3 className="font-crimson text-xl text-foreground mb-1">{f.title}</h3>
                    <div className="text-xs text-lime-300 font-mono uppercase tracking-wide mb-4">
                      {f.duree}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
                    <div className="mt-auto space-y-3 pt-4 border-t border-border/20">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Livrable</div>
                        <div className="text-sm text-foreground/90">{f.livrable}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Cible</div>
                        <div className="text-sm text-foreground/80">{f.cible}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Leaders / benchmark */}
        <section className="py-16 px-6 bg-card/20 border-y border-border/20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-crimson text-3xl text-foreground mb-4">
                La preuve par l'exemple
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-center">
                Les leaders identifiées par le référentiel RSE / RSO sont autant de
                démonstrateurs « vivant » pour vos visites de benchmark.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaders.map((l, i) => (
                <motion.div
                  key={l.nom}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="bg-card/40 backdrop-blur-sm border border-lime-500/20 rounded-2xl p-6 text-center"
                >
                  <l.icon className="w-8 h-8 text-lime-400 mx-auto mb-4" />
                  <h3 className="font-crimson text-2xl text-foreground mb-2">{l.nom}</h3>
                  <div className="text-sm text-lime-300 mb-3">{l.highlight}</div>
                  <p className="text-sm text-muted-foreground text-center">{l.detail}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
              Source : tableau de bord "Les Marches du Vivant"
            </p>

            <div className="text-center mt-8">
              <Button
                onClick={scrollToContact}
                variant="outline"
                className="border-lime-500/40 text-lime-300 hover:bg-lime-950/30"
              >
                Organiser une visite-benchmark
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* TrustBar */}
        <TrustBar showQualiopi={false} className="border-y border-border/20" />

        {/* Formulaire de contact */}
        <section id="contact-form" className="py-16 px-6">
          <div className="max-w-xl mx-auto">
            <ContactFormB2B source="page-agriculture" />
          </div>
        </section>

        <Footer variant="marches" />
      </div>
    </>
  );
};

export default MarchesDuVivantAgriculture;
