import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import PublicTopBar from '@/components/layout/PublicTopBar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Cpu,
  Users,
  Sprout,
  MapPin,
  GraduationCap,
  Building2,
  Grape,
  Wine,
  Star,
  ArrowRight,
  Download,
  CalendarCheck,
  Leaf,
  Waves,
  Shield,
  Wifi,
  Coins,
  Home,
} from 'lucide-react';

const CANONICAL = 'https://la-frequence-du-vivant.com/interreg-sudoe-mdv';

/* ------------ Hero Spectrogramme animé (Canvas) ------------ */
const HeroSpectrogramme: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 96;
      const barW = w / bars;
      for (let i = 0; i < bars; i++) {
        const phase = i * 0.12 + t * 0.02;
        const v =
          (Math.sin(phase) * 0.4 +
            Math.sin(phase * 2.3 + t * 0.01) * 0.3 +
            Math.sin(phase * 0.7 + t * 0.005) * 0.3) *
            0.5 +
          0.5;
        const bh = v * h * 0.85;
        const y = (h - bh) / 2;
        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, 'rgba(201, 168, 76, 0.0)');
        grad.addColorStop(0.4, 'rgba(13, 107, 88, 0.7)');
        grad.addColorStop(0.5, 'rgba(201, 168, 76, 0.95)');
        grad.addColorStop(0.6, 'rgba(13, 107, 88, 0.7)');
        grad.addColorStop(1, 'rgba(201, 168, 76, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(i * barW + barW * 0.15, y, barW * 0.7, bh);
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      aria-hidden="true"
    />
  );
};

/* ------------ Reveal on scroll ------------ */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`;
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

/* ------------ Glass card ------------ */
const Glass: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...p }) => (
  <div
    className={`relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] ${className}`}
    {...p}
  >
    {children}
  </div>
);

/* ------------ Stars ------------ */
const Stars: React.FC<{ n: number; max?: number }> = ({ n, max = 5 }) => (
  <span className="inline-flex gap-0.5" aria-label={`${n}/${max}`}>
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < n ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-white/15'}`}
      />
    ))}
  </span>
);

/* ============================ PAGE ============================ */
const InterregSudoeMdv: React.FC = () => {
  const scenariosA = [
    {
      code: 'A1',
      title: "L'Observatoire Sonore du Jardin Vivant",
      icon: Activity,
      pitch:
        "Réseau de micro-capteurs bioacoustiques open-source (AudioMoth) couplés à l'agent IA frugal sur 4 000 m² : écoute permanente du vivant.",
      bullets: [
        'Surveillance écologique low-cost sur petite surface',
        'IA capable de différencier espèces et détecter anomalies (silence anormal, nuisibles)',
        'Base de données bioacoustiques locale, open-source, réutilisable',
      ],
      livrables: [
        'Tableau de bord public temps réel',
        'Cartographie sonore saisonnière',
        '"Rapport hebdomadaire du vivant" lisible par un agriculteur',
      ],
      ditwins: 'Pendant "jardin" du jumeau numérique agricole. Valide la couche capteur bioacoustique.',
    },
    {
      code: 'A2',
      title: 'La Marche Diagnostic Agricole',
      icon: Sprout,
      pitch:
        "Protocole structuré de 2h, équipement 200-400€ : écoute IA temps réel + lecture sensorielle + rapport co-produit. Alternative à la consultation d'expert à 800€/jour.",
      bullets: [
        "Outil de diagnostic simple, reproductible, non-invasif",
        "Premier point d'entrée techno pour un agriculteur réticent",
        "Fiche PDF générée par l'IA frugale : portrait sonore + recommandations hiérarchisées",
      ],
      livrables: [
        'Protocole exportable de la marche diagnostic',
        'Template PDF IA (urgence × coût)',
        'Première campagne pilote sur Deviat',
      ],
      ditwins: 'Méthodologie terrain reproductible, brique de service du jumeau numérique.',
    },
    {
      code: 'A3',
      title: 'Le Jardin comme Salle de Formation Immersive',
      icon: GraduationCap,
      pitch:
        "Journées de formation agricole au parc de Deviat : agriculteurs, conseillers, étudiants découvrent les outils bioacoustiques in situ avec leur parcelle en miroir.",
      bullets: [
        '"Comprendre son exploitation par les sons" (2h)',
        '"Configurer son réseau de capteurs" (atelier DIY 4h)',
        '"Lire le rapport de l\'IA" (interprétation et décision 2h)',
      ],
      livrables: [
        'Programme pédagogique 3 modules',
        'Kit pédagogique open-source',
        'Deviat = lieu de référence régional "basse tech, haute conscience"',
      ],
      ditwins: 'Adoption terrain — chaînon manquant entre R&D et exploitation.',
    },
  ];

  const matrice = [
    { code: 'A1 · Observatoire Deviat', terrain: 'Parc 4 000 m²', impact: 3, effort: 'Faible', valeur: 2 },
    { code: 'A2 · Marche Diagnostic', terrain: 'Parc + protocole', impact: 4, effort: 'Faible', valeur: 3 },
    { code: 'A3 · Formation immersive', terrain: 'Parc', impact: 3, effort: 'Moyen', valeur: 3 },
    { code: 'B1a · Sentinelle communale', terrain: 'Commune Deviat', impact: 4, effort: 'Moyen', valeur: 3 },
    { code: 'B1b · Réseau agriculteurs', terrain: 'Exploitations locales', impact: 5, effort: 'Moyen', valeur: 3 },
    { code: 'B2a · Oreille du Terroir (Cheval Blanc)', terrain: 'Vignes CBlanc', impact: 4, effort: 'Élevé', valeur: 5 },
    { code: 'B2b · Marche Millésime (CBlanc)', terrain: 'Vignes CBlanc', impact: 2, effort: 'Faible', valeur: 5 },
    { code: 'B3a · Écouter le Botrytis (Yquem)', terrain: 'Vignes Yquem', impact: 5, effort: 'Élevé', valeur: 5 },
    { code: "B3b · Marches d'Yquem", terrain: 'Vignes Yquem', impact: 2, effort: 'Faible', valeur: 5 },
  ];

  const convergences = [
    ['Capteurs et données terrain', 'Bioacoustique = nouvelle couche de captation non chimique'],
    ['Jumeau numérique', '"Portrait sonore" de la ferme = représentation IA frugale du vivant'],
    ['Décision support', 'Agent IA générant des rapports actionnables pour l\'agriculteur'],
    ['Open-source', "ADN de l'association, compatible OSFARM / OSFarm"],
    ['Durabilité', 'IA frugale = moins de CO₂, moins de coûts, plus de souveraineté'],
    ['Science participative', 'Agriculteurs co-producteurs de données, pas simples consommateurs'],
  ];

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white antialiased overflow-x-hidden">
      <Helmet>
        <title>Les Marches du Vivant × AGROBOTICS-DITWINS · Interreg SUDOE</title>
        <meta
          name="description"
          content="Argumentaire stratégique : comment Les Marches du Vivant — bioacoustique, IA frugale et science participative — apporte une couche inédite au programme AGROBOTICS-DITWINS pour l'agriculture du futur."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Les Marches du Vivant × AGROBOTICS-DITWINS" />
        <meta
          property="og:description"
          content="Écouter le vivant pour cultiver demain. Argumentaire Interreg SUDOE — La Fréquence du Vivant, juin 2026."
        />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Les Marches du Vivant × AGROBOTICS-DITWINS · Interreg SUDOE',
            author: { '@type': 'Organization', name: 'La Fréquence du Vivant' },
            datePublished: '2026-06-01',
            inLanguage: 'fr',
          })}
        </script>
      </Helmet>

      {/* Background ambiance */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f1a] via-[#0d2a22] to-[#0a1f1a]" />
        <div className="absolute top-0 left-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#0d6b58]/20 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-[#c9a84c]/10 blur-[160px]" />
      </div>

      {/* Nav minimal */}
      <PublicTopBar
        tone="glass"
        leftSlot={
          <div className="flex items-center justify-between w-full gap-4">
            <Link to="/marches-du-vivant" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <Home className="h-4 w-4" /> Accueil
            </Link>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] text-[#c9a84c]/80">
              Interreg SUDOE · AGROBOTICS-DITWINS
            </span>
          </div>
        }
      />

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <HeroSpectrogramme />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1f1a]/40 to-[#0a1f1a]" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[#c9a84c]">
              <Waves className="h-3.5 w-3.5" /> Argumentaire · juin 2026
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-light leading-[1.05] tracking-tight">
              Écouter le vivant <br />
              <span className="bg-gradient-to-r from-[#c9a84c] via-[#e8d28b] to-[#c9a84c] bg-clip-text text-transparent italic">
                pour cultiver demain.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 max-w-2xl text-lg text-white/70 leading-relaxed">
              Les Marches du Vivant proposent une couche inédite au programme{' '}
              <strong className="text-white">AGROBOTICS-DITWINS</strong> : bioacoustique frugale, IA
              souveraine, science participative. Trois différenciateurs que ni John Deere, ni Trimble,
              ni Ag Leader ne peuvent tenir.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#0d6b58] to-[#0d6b58]/80 hover:from-[#0d6b58]/90 text-white shadow-lg shadow-[#0d6b58]/30"
              >
                <a href="mailto:contact@la-frequence-du-vivant.com?subject=Interreg%20SUDOE%20%C2%B7%20Les%20Marches%20du%20Vivant">
                  <CalendarCheck className="mr-1" /> Prendre rendez-vous
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handlePrint}
                className="border-[#c9a84c]/40 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:text-[#c9a84c]"
              >
                <Download className="mr-1" /> Télécharger l'argumentaire PDF
              </Button>
            </div>
          </Reveal>
          <Reveal delay={500}>
            <p className="mt-12 text-xs text-white/40 uppercase tracking-[0.18em]">
              La Fréquence du Vivant · Deviat (Charente) · Dans le cadre du programme AGROBOTICS-DITWINS — Interreg SUDOE
            </p>
          </Reveal>
        </div>
      </section>

      {/* CONTEXTE */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">01 · Contexte</div>
          <h2 className="text-3xl md:text-5xl font-light leading-tight">
            Pourquoi Les Marches du Vivant fait sens <br />
            <span className="text-white/60">pour l'agriculture aujourd'hui.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 grid md:grid-cols-2 gap-8 text-white/75 leading-relaxed text-lg">
            <p>
              Le monde agricole traverse une <strong className="text-white">double transformation</strong> :
              technologique (robotique, capteurs, jumeaux numériques, IA) et sensible (retour au vivant,
              agroécologie, lecture du paysage). Ces deux mouvements sont souvent traités séparément.
            </p>
            <p>
              L'originalité de notre association est précisément de les{' '}
              <span className="text-[#c9a84c]">faire converger</span> : écouter le territoire avec des
              outils frugaux et open-source pour mieux le comprendre, l'accompagner, le valoriser.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 3 DIFFERENCIATEURS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">02 · Différenciateurs</div>
          <h2 className="text-3xl md:text-5xl font-light">Trois signatures rares dans l'agritech.</h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Activity,
              t: 'Bioacoustique low-cost',
              d: "Les sons du vivant — insectes, oiseaux, sol, végétaux sous stress — sont des indicateurs agrosystémiques très sous-exploités par les agriculteurs.",
            },
            {
              icon: Cpu,
              t: 'IA frugale & souveraine',
              d: "Déployable localement, sans dépendance cloud lourde, sans coût d'exploitation prohibitif. Compatible avec les contraintes des exploitations rurales.",
            },
            {
              icon: Users,
              t: 'Science participative & poétique',
              d: 'La posture poétique crée de la confiance et de l\'adhésion là où la tech seule crée de la résistance ou de l\'incompréhension.',
            },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 120}>
              <Glass className="p-8 h-full hover:bg-white/[0.06] transition-colors">
                <c.icon className="h-10 w-10 text-[#c9a84c]" strokeWidth={1.3} />
                <h3 className="mt-5 text-xl text-white font-medium">{c.t}</h3>
                <p className="mt-3 text-white/65 leading-relaxed text-[15px]">{c.d}</p>
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SIMULATION A */}
      <section className="relative py-28">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">03 · Simulation A</div>
            <h2 className="text-3xl md:text-5xl font-light">
              Terrain de Deviat <span className="text-white/40">— parc & jardin 4 000 m²</span>
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl">
              L'association devient son propre living lab. Démonstration vivante avant tout déploiement
              chez un partenaire.
            </p>
          </Reveal>

          <div className="mt-14 space-y-8">
            {scenariosA.map((s, i) => (
              <Reveal key={s.code} delay={i * 80}>
                <Glass className="p-8 md:p-10">
                  <div className="flex items-start gap-6 flex-wrap">
                    <div className="rounded-xl bg-[#0d6b58]/20 border border-[#0d6b58]/40 p-4">
                      <s.icon className="h-8 w-8 text-[#c9a84c]" strokeWidth={1.4} />
                    </div>
                    <div className="flex-1 min-w-[280px]">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">
                        Scénario {s.code}
                      </div>
                      <h3 className="mt-1 text-2xl md:text-3xl font-light text-white">{s.title}</h3>
                      <p className="mt-4 text-white/70 leading-relaxed">{s.pitch}</p>
                      <div className="mt-6 grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                            Ce que cela démontre
                          </div>
                          <ul className="space-y-2">
                            {s.bullets.map((b) => (
                              <li key={b} className="flex gap-2 text-sm text-white/75">
                                <span className="text-[#c9a84c] mt-0.5">◆</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                            Livrables concrets
                          </div>
                          <ul className="space-y-2">
                            {s.livrables.map((b) => (
                              <li key={b} className="flex gap-2 text-sm text-white/75">
                                <span className="text-[#0d6b58]">▸</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-6 rounded-lg border-l-2 border-[#c9a84c] bg-[#c9a84c]/5 px-4 py-3 text-sm text-white/80 italic">
                        <span className="text-[#c9a84c] not-italic font-medium">
                          Alignement AGROBOTICS-DITWINS :
                        </span>{' '}
                        {s.ditwins}
                      </div>
                    </div>
                  </div>
                </Glass>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATION B */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">04 · Simulation B</div>
          <h2 className="text-3xl md:text-5xl font-light">
            Deviat <span className="text-white/40">+</span> Partenaires locaux d'exception.
          </h2>
        </Reveal>

        {/* B1 Mairie */}
        <Reveal delay={80}>
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#0d6b58]/60 to-transparent" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0d6b58]/40 bg-[#0d6b58]/10">
                <Building2 className="h-4 w-4 text-[#0d6b58]" />
                <span className="text-sm text-white/90">B1 · Mairie de Deviat — Jean-François Servant</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#0d6b58]/60 to-transparent" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Glass className="p-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B1-a</div>
                <h3 className="mt-1 text-2xl font-light">Sentinelle Sonore du Territoire Communal</h3>
                <p className="mt-4 text-white/70 leading-relaxed text-[15px]">
                  Déployer Les Marches du Vivant à l'échelle des 8,42 km² de la commune. Capteurs sur
                  points stratégiques (lisières, prairies, zones humides), portail communal open-source,
                  marches mensuelles ouvertes aux habitants.
                </p>
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-[#0d6b58]/10 p-4">
                    <div className="text-[#0d6b58] font-medium mb-2">Ce que gagne la commune</div>
                    <ul className="space-y-1 text-white/75">
                      <li>Données pour PLU, Natura 2000, PAC</li>
                      <li>Image innovante & engagée</li>
                      <li>Animation du territoire rural</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-[#c9a84c]/10 p-4">
                    <div className="text-[#c9a84c] font-medium mb-2">Ce que gagne La Fréquence</div>
                    <ul className="space-y-1 text-white/75">
                      <li>Légitimité institutionnelle</li>
                      <li>Terrain élargi : 842 ha</li>
                      <li>Données multi-contextes</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-6 italic text-white/80 border-l-2 border-[#c9a84c] pl-4 text-sm">
                  « Votre commune devient la première de Charente à disposer d'un observatoire sonore
                  du vivant. »
                </p>
              </Glass>
              <Glass className="p-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B1-b</div>
                <h3 className="mt-1 text-2xl font-light">Programme « Agriculteurs Explorateurs du Vivant »</h3>
                <p className="mt-4 text-white/70 leading-relaxed text-[15px]">
                  Via la mairie, créer un réseau de 5 à 10 agriculteurs locaux volontaires. Chacun reçoit
                  un kit de départ, participe à 2 journées de formation et contribue à une base de données
                  sonores partagée.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  <li className="flex gap-2"><Leaf className="h-4 w-4 text-[#0d6b58] mt-0.5 shrink-0" /> Diagnostic gratuit dans le cadre de l'expérimentation</li>
                  <li className="flex gap-2"><Leaf className="h-4 w-4 text-[#0d6b58] mt-0.5 shrink-0" /> Outil de veille écologique simple</li>
                  <li className="flex gap-2"><Leaf className="h-4 w-4 text-[#0d6b58] mt-0.5 shrink-0" /> Valorisation dans la communication AGROBOTICS-DITWINS</li>
                </ul>
              </Glass>
            </div>
          </div>
        </Reveal>

        {/* B2 Cheval Blanc */}
        <Reveal delay={120}>
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10">
                <Grape className="h-4 w-4 text-[#c9a84c]" />
                <span className="text-sm text-white/90">B2 · Château Cheval Blanc — Saint-Émilion</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Glass className="p-8 lg:col-span-2 bg-gradient-to-br from-[#c9a84c]/[0.06] to-transparent">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B2-a · Phare</div>
                <h3 className="mt-1 text-2xl md:text-3xl font-light">
                  « L'Oreille du Terroir » — Bioacoustique des Parcelles Viticoles
                </h3>
                <p className="mt-4 text-white/75 leading-relaxed">
                  Déployer un réseau de micro-capteurs sur plusieurs parcelles, en complément des capteurs
                  existants (météo, sol, drones). Constituer une <span className="text-[#c9a84c]">empreinte sonore du terroir</span>,
                  saison par saison.
                </p>
                <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Ce que la bioacoustique apporte</div>
                    <ul className="space-y-2 text-white/75">
                      <li>◆ Détection précoce des nuisibles (cicadelle, eudémis) par signature acoustique</li>
                      <li>◆ Monitoring de la biodiversité auxiliaire (pollinisateurs, prédateurs)</li>
                      <li>◆ Indicateur de « santé silencieuse » du vignoble</li>
                      <li>◆ Corrélation potentielle entre richesse acoustique et expression du millésime</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Ce que gagne Cheval Blanc</div>
                    <ul className="space-y-2 text-white/75">
                      <li>▸ Diagnostic supplémentaire non-invasif, frugal, différenciant</li>
                      <li>▸ Narrative exceptionnelle : « Nous écoutons nos vignes »</li>
                      <li>▸ Données R&D inédites sur la biodiversité parcellaire</li>
                      <li>▸ Storytelling millésime, visite premium</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-xs">
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Phase 1 · 6 mois pilote 2-3 parcelles</span>
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Phase 2 · Protocole « portrait sonore du millésime »</span>
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Phase 3 · Étude de cas conjointe</span>
                </div>
                <p className="mt-6 italic text-white/85 border-l-2 border-[#c9a84c] pl-4">
                  « Là où d'autres domaines mesurent les pixels de leurs drones, vous écoutez la voix du
                  vivant dans vos vignes. »
                </p>
              </Glass>
              <Glass className="p-8 lg:col-span-2">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B2-b</div>
                <h3 className="mt-1 text-2xl font-light">« La Marche du Millésime » — Expérience Premium pour les Clients</h3>
                <p className="mt-4 text-white/70 leading-relaxed text-[15px]">
                  Expérience exclusive de 90 minutes : visiteurs écoutent leur parcelle au casque, découvrent
                  les sons du vignoble en temps réel via l'agent IA, repartent avec leur propre « portrait
                  sonore » de la visite. Format exportable au réseau LVMH.
                </p>
              </Glass>
            </div>
          </div>
        </Reveal>

        {/* B3 Yquem */}
        <Reveal delay={160}>
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/80 to-transparent" />
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a84c]/60 bg-gradient-to-r from-[#c9a84c]/20 to-[#c9a84c]/5">
                <Wine className="h-4 w-4 text-[#c9a84c]" />
                <span className="text-sm text-white/90">B3 · Château d'Yquem — Sauternes</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c9a84c]/80 to-transparent" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Glass className="p-8 lg:col-span-2 bg-gradient-to-br from-[#c9a84c]/[0.08] via-transparent to-[#0d6b58]/[0.06]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B3-a · Phare scientifique</div>
                <h3 className="mt-1 text-2xl md:text-3xl font-light">
                  « Écouter le Botrytis » — Bioacoustique & Pourriture Noble
                </h3>
                <p className="mt-4 text-white/75 leading-relaxed">
                  À Yquem, tout repose sur <em>Botrytis cinerea</em>. L'IA frugale analyse les données
                  bioacoustiques et environnementales en temps réel pour constituer une{' '}
                  <span className="text-[#c9a84c]">signature acoustique des conditions favorables</span>{' '}
                  au développement du botrytis.
                </p>
                <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm text-white/75">
                  <ul className="space-y-2">
                    <li>◆ Monitoring de l'activité des insectes et champignons microscopiques</li>
                    <li>◆ Corrélation entre paysage sonore et conditions météo/phénologiques</li>
                    <li>◆ Détection des stress hydriques (ultrasons végétaux mesurables)</li>
                    <li>◆ Enrichissement du modèle de prévision de la récolte</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>▸ Couche de données inédite pour le terroir</li>
                    <li>▸ Suivi biologique non-chimique, respect du millésime</li>
                    <li>▸ R&D distinctive : seul Sauternes à « écouter » le botrytis</li>
                  </ul>
                </div>
                <p className="mt-6 italic text-white/85 border-l-2 border-[#c9a84c] pl-4">
                  « Yquem lit les brouillards depuis des siècles. Aujourd'hui, vous pouvez aussi les
                  entendre. »
                </p>
              </Glass>
              <Glass className="p-8 lg:col-span-2">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">Scénario B3-b</div>
                <h3 className="mt-1 text-2xl font-light">« Les Marches d'Yquem » — Tourisme Sensoriel & Science Participative</h3>
                <p className="mt-4 text-white/70 leading-relaxed text-[15px]">
                  Offre de tourisme scientifique de prestige : expédition d'écoute, contribution à la base
                  de données du Château, enregistrement sonore exclusif emporté par le visiteur. Édition
                  limitée annuelle corrélée au millésime.
                </p>
              </Glass>
            </div>
          </div>
        </Reveal>
      </section>

      {/* MATRICE */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">05 · Synthèse</div>
          <h2 className="text-3xl md:text-5xl font-light">Matrice de comparaison des scénarios.</h2>
        </Reveal>
        <Reveal delay={120}>
          <Glass className="mt-10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-xs uppercase tracking-wider text-white/60">
                    <th className="px-5 py-4">Scénario</th>
                    <th className="px-5 py-4">Terrain</th>
                    <th className="px-5 py-4">Impact agriculture</th>
                    <th className="px-5 py-4">Effort</th>
                    <th className="px-5 py-4">Valeur symbolique</th>
                  </tr>
                </thead>
                <tbody>
                  {matrice.map((r, i) => (
                    <tr
                      key={r.code}
                      className={`border-b border-white/5 ${i % 2 ? 'bg-white/[0.015]' : ''} hover:bg-[#0d6b58]/10 transition-colors`}
                    >
                      <td className="px-5 py-4 text-white/90">{r.code}</td>
                      <td className="px-5 py-4 text-white/65">{r.terrain}</td>
                      <td className="px-5 py-4"><Stars n={r.impact} /></td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            r.effort === 'Faible'
                              ? 'bg-[#0d6b58]/20 text-[#7dd3bb]'
                              : r.effort === 'Moyen'
                              ? 'bg-[#c9a84c]/15 text-[#c9a84c]'
                              : 'bg-orange-500/15 text-orange-300'
                          }`}
                        >
                          {r.effort}
                        </span>
                      </td>
                      <td className="px-5 py-4"><Stars n={r.valeur} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Glass>
        </Reveal>
      </section>

      {/* TIMELINE */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">06 · Séquençage</div>
          <h2 className="text-3xl md:text-5xl font-light">Une trajectoire en trois mouvements.</h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              label: 'Court terme',
              date: '2026',
              title: 'A1 + A2 sur Deviat',
              desc: "Vitrine. Sans partenaire, sans condition. Production de données réelles, affinage du protocole, premiers contenus de démonstration.",
            },
            {
              label: 'Moyen terme',
              date: 'Fin 2026 – début 2027',
              title: 'Mairie + 3-5 agriculteurs',
              desc: "Approcher Jean-François Servant (B1a/B1b). Crédibiliser l'approche terrain avant les grands domaines.",
            },
            {
              label: 'Long terme',
              date: '2027',
              title: 'Cheval Blanc puis Yquem',
              desc: "Ouvrir le dialogue avec Cheval Blanc (B2a). Yquem (B3a) : objectif plus complexe, valeur symbolique et scientifique maximale.",
            },
          ].map((step, i) => (
            <Reveal key={step.label} delay={i * 120}>
              <Glass className="p-8 h-full relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#0d6b58] flex items-center justify-center text-white font-light">
                  {i + 1}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#c9a84c]/80">{step.label}</div>
                <div className="mt-1 text-white/50 text-sm">{step.date}</div>
                <h3 className="mt-3 text-xl font-medium text-white">{step.title}</h3>
                <p className="mt-3 text-white/65 leading-relaxed text-[14px]">{step.desc}</p>
                {i < 2 && <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-[#c9a84c]/60" />}
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CONVERGENCES */}
      <section className="max-w-5xl mx-auto px-6 py-28">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">07 · Alignement</div>
          <h2 className="text-3xl md:text-5xl font-light">Points de convergence avec AGROBOTICS-DITWINS.</h2>
        </Reveal>
        <Reveal delay={120}>
          <Glass className="mt-10 divide-y divide-white/5">
            {convergences.map(([axe, apport]) => (
              <div key={axe} className="grid md:grid-cols-[1fr_2fr] gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors">
                <div className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider">{axe}</div>
                <div className="text-white/80">{apport}</div>
              </div>
            ))}
          </Glass>
        </Reveal>
      </section>

      {/* IA FRUGALE */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6b58]/10 via-transparent to-[#c9a84c]/5 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">08 · Argument unique</div>
            <h2 className="text-3xl md:text-5xl font-light">
              L'IA frugale, <span className="text-[#c9a84c] italic">l'argument que les géants ne peuvent tenir.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 text-lg text-white/70 leading-relaxed">
              Dans les exploitations rurales, l'adoption technologique échoue sur trois obstacles. Notre
              approche répond aux trois.
            </p>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Coins, t: 'Coût', d: "L'agent tourne localement ou sur infrastructure minimale." },
              { icon: Wifi, t: 'Connectivité', d: 'Compatible zones blanches : offline + sync différé.' },
              { icon: Shield, t: 'Souveraineté', d: "Données restent sur l'exploitation, open-source vérifiable." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 120}>
                <Glass className="p-8 h-full text-center">
                  <c.icon className="h-10 w-10 mx-auto text-[#c9a84c]" strokeWidth={1.3} />
                  <h3 className="mt-5 text-xl text-white font-medium">{c.t}</h3>
                  <p className="mt-3 text-white/65 text-[15px]">{c.d}</p>
                </Glass>
              </Reveal>
            ))}
          </div>
          <Reveal delay={400}>
            <p className="mt-14 text-center text-2xl md:text-3xl font-light text-white max-w-3xl mx-auto leading-snug">
              John Deere, Trimble, Ag Leader ne peuvent pas tenir cet argument.{' '}
              <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d28b] bg-clip-text text-transparent italic">
                Vous si.
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl mx-auto px-6 py-28 text-center">
        <Reveal>
          <div className="text-xs uppercase tracking-[0.22em] text-[#c9a84c] mb-4">Signons ensemble</div>
          <h2 className="text-4xl md:text-6xl font-light">
            Faisons de l'écoute <br />
            <span className="italic text-[#c9a84c]">un acte agricole.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-10 flex flex-wrap justify-center gap-3 print:hidden">
            <Button
              asChild
              size="xl"
              className="bg-gradient-to-r from-[#0d6b58] to-[#0d6b58]/80 hover:from-[#0d6b58]/90 text-white shadow-xl shadow-[#0d6b58]/40"
            >
              <a href="mailto:contact@la-frequence-du-vivant.com?subject=Interreg%20SUDOE%20%C2%B7%20Les%20Marches%20du%20Vivant">
                <CalendarCheck /> Prendre rendez-vous
              </a>
            </Button>
            <Button
              size="xl"
              variant="outline"
              onClick={handlePrint}
              className="border-[#c9a84c]/40 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/15 hover:text-[#c9a84c]"
            >
              <Download /> Télécharger l'argumentaire PDF
            </Button>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-16 text-xs text-white/40 uppercase tracking-[0.22em]">
            Document juin 2026 · Association La Fréquence du Vivant · Deviat (Charente)
          </p>
          <p className="mt-2 text-xs text-white/30">
            Rédigé dans le cadre du projet AGROBOTICS-DITWINS — Interreg SUDOE.
          </p>
          <div className="mt-8 flex justify-center gap-2 opacity-60">
            <MapPin className="h-4 w-4 text-[#0d6b58]" />
            <span className="text-xs text-white/50">Deviat → Saint-Émilion → Sauternes</span>
          </div>
        </Reveal>
      </section>

      <style>{`
        @media print {
          body, html { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InterregSudoeMdv;
