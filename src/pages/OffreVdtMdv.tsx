import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Leaf, MapPin, Camera, Users, Sparkles, Database,
  Microscope, FileDown, Palette, TrendingUp, Bot,
  Radar, Compass, ArrowRight, CheckCircle2, Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';
import AnimatedStat from '@/components/marches-vivant/AnimatedStat';
import heroImg from '@/assets/offre-vdt/hero.jpg';

const nf = new Intl.NumberFormat('fr-FR');

/* ------------------------------- Sections ------------------------------- */

const Hero: React.FC = () => (
  <section className="relative min-h-[85vh] flex items-center overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={heroImg}
        alt="Paysagiste en diagnostic biodiversité"
        className="w-full h-full object-cover"
        width={1600}
        height={900}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
    </div>

    <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-6">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-mono">
            Proposition confidentielle · Ver de Terre Production
          </span>
        </div>

        <h1 className="font-crimson text-5xl md:text-7xl leading-[1.05] text-foreground mb-6">
          De la salle e-learning
          <br />
          <span className="italic bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
            au terrain vivant.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-foreground/85 leading-relaxed mb-4 max-w-2xl">
          <strong className="text-primary">Les Marches du Vivant</strong> — le prolongement
          digital & IA de votre formation <em>« À la racine du paysage »</em>.
        </p>
        <p className="text-base text-muted-foreground max-w-2xl mb-10">
          Une plateforme pensée pour vos apprenants&nbsp;: paysagistes concepteurs, chargés d'affaire,
          bureaux d'études et collectivités. Ce que votre pédagogie enseigne, notre technologie
          l'incarne <strong>sur chaque parcelle client</strong>.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() =>
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Découvrir la démonstration <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary/40 hover:bg-primary/10"
            asChild
          >
            <a href="#collaboration">Modèle de collaboration</a>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

const ProofStrip: React.FC = () => {
  const { data, isLoading } = usePublicGlobalStats();

  const stats = [
    { value: data?.especes_tracees ?? 0, label: 'Espèces tracées', sub: 'Union GBIF · iNat · marcheurs' },
    { value: data?.domaines ?? 0, label: 'Domaines documentés', sub: 'Sites cartographiés' },
    { value: data?.marches_organisees ?? 0, label: 'Marches organisées', sub: 'Diagnostics de terrain' },
    { value: data?.marcheurs ?? 0, label: 'Marcheur·euse·s', sub: 'Sentinelles actifs' },
    { value: data?.observations_citoyennes ?? 0, label: 'Observations', sub: 'Preuves géolocalisées' },
    { value: data?.photos_collectees ?? 0, label: 'Photos collectées', sub: 'EXIF + GPS conservés' },
  ];

  return (
    <section className="py-20 md:py-28 border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 mb-4">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-300">
              Données réelles · Certifiées GBIF
            </span>
          </div>
          <h2 className="font-crimson text-3xl md:text-4xl text-foreground">
            La plateforme, en un coup d'œil
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((s, i) => (
            <AnimatedStat
              key={s.label}
              value={s.value}
              loading={isLoading}
              label={s.label}
              sub={s.sub}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------- Miroir objectifs VDT ------------------------- */

const MirrorSection: React.FC = () => {
  const items = [
    {
      icon: <Microscope className="w-6 h-6" />,
      vdt: 'Diagnostic rapide',
      vdtDesc: 'Identifier le sol et ses bio-indicatrices via 3 tests terrain.',
      mdv: 'Marche diagnostic géolocalisée + IA d\'identification',
      mdvDesc:
        'Chaque photo devient une observation certifiée : iNaturalist résout l\'espèce, GBIF valide la taxonomie, la plateforme reconstitue l\'herbier vivant du site en temps réel.',
    },
    {
      icon: <FileDown className="w-6 h-6" />,
      vdt: 'Argumentaire commercial',
      vdtDesc: 'Structurer un argumentaire technico-économique convaincant.',
      mdv: 'Pack Vivant — livrable RSE opposable',
      mdvDesc:
        'Un clic → ZIP contenant PDF client, Excel analyste, CSV data, GeoJSON & KML SIG. Le paysagiste repart du RDV avec une preuve chiffrée. Fini les « on verra dans 3 ans ».',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      vdt: 'Conception résiliente & nourricière',
      vdtDesc: 'Mobiliser les solutions fondées sur la nature.',
      mdv: 'Fréquence du Vivant + 12 fonctions écologiques',
      mdvDesc:
        'Chaque espèce est auto-classifiée : mellifère, fixateur d\'azote, arbre pionnier, hôte auxiliaires… La palette végétale se construit à partir du fonctionnel, pas du décoratif.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      vdt: 'Pérennité paysagère',
      vdtDesc: 'Intégrer les principes MSV au suivi.',
      mdv: 'Snapshots datés + réverbérations saisonnières',
      mdvDesc:
        'Le site est photographié dans le temps. L\'IA compare les snapshots et alerte sur les dérives. Preuve continue de la démarche MSV pour le client et pour l\'assurance décennale.',
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-mono">
            Objectifs VDT · Réponse MDV
          </div>
          <h2 className="font-crimson text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Chaque objectif de votre formation
            <br />
            <span className="italic text-primary">a son outil sur MDV.</span>
          </h2>
          <p className="text-muted-foreground">
            Un miroir 1:1 entre la pédagogie VDT et les capacités opérationnelles de la plateforme.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.vdt}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-8 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
                    Objectif VDT
                  </div>
                  <h3 className="font-crimson text-2xl text-foreground leading-tight">
                    {item.vdt}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.vdtDesc}</p>
                </div>
              </div>

              <div className="pl-16 border-l-2 border-primary/30 ml-6 mt-6">
                <div className="text-[11px] uppercase tracking-widest text-primary font-mono mb-1">
                  → Réponse MDV
                </div>
                <div className="font-semibold text-foreground mb-2">{item.mdv}</div>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.mdvDesc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* --------------------- Screenshots / plateforme démo -------------------- */

const MockBrowser: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl overflow-hidden border border-border/60 bg-card shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/60">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="flex-1 text-center text-xs text-muted-foreground font-mono truncate">
        la-frequence-du-vivant.com{title}
      </div>
    </div>
    <div className="relative">{children}</div>
  </div>
);

const DemoMap: React.FC = () => (
  <MockBrowser title="/m/domaine-de-la-source">
    <div className="relative h-72 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 overflow-hidden">
      {/* fake map grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(163,230,53,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* observation points */}
      {[
        { top: '20%', left: '30%', color: 'bg-lime-400' },
        { top: '45%', left: '55%', color: 'bg-emerald-400' },
        { top: '60%', left: '25%', color: 'bg-amber-400' },
        { top: '35%', left: '75%', color: 'bg-purple-400' },
        { top: '70%', left: '60%', color: 'bg-lime-300' },
        { top: '25%', left: '85%', color: 'bg-emerald-300' },
        { top: '55%', left: '40%', color: 'bg-amber-300' },
      ].map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`absolute w-3 h-3 rounded-full ${p.color} ring-4 ring-background/40 shadow-lg`}
          style={{ top: p.top, left: p.left }}
        />
      ))}
      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-xs font-mono">
        <span className="text-emerald-400">●</span> 47 espèces · rayon 500 m
      </div>
      <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 text-xs">
        <div className="font-semibold text-foreground">Fréquence du jour</div>
        <div className="text-2xl font-crimson text-lime-400 tabular-nums">83<span className="text-sm text-muted-foreground">/100</span></div>
      </div>
    </div>
  </MockBrowser>
);

const DemoSpecies: React.FC = () => (
  <MockBrowser title="/espece/achillea-millefolium">
    <div className="p-5 bg-card">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-lime-300 to-emerald-500 shrink-0 flex items-center justify-center">
          <Leaf className="w-10 h-10 text-emerald-950" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-mono">Asteraceae</div>
          <div className="font-crimson text-xl text-foreground">Achillée millefeuille</div>
          <div className="text-xs italic text-muted-foreground mb-2">Achillea millefolium</div>
          <div className="flex flex-wrap gap-1.5">
            {['mellifère', 'médicinale', 'sol pauvre', 'auxiliaires', 'bio-indicatrice'].map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-crimson text-foreground tabular-nums">12</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Obs. site</div>
        </div>
        <div>
          <div className="text-lg font-crimson text-foreground tabular-nums">4</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Photos marcheurs</div>
        </div>
        <div>
          <div className="text-lg font-crimson text-foreground tabular-nums">GBIF ✓</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Certifiée</div>
        </div>
      </div>
    </div>
  </MockBrowser>
);

const DemoPack: React.FC = () => (
  <MockBrowser title="/mon-espace/exploration/export">
    <div className="p-6 bg-card">
      <div className="flex items-center gap-3 mb-4">
        <FileDown className="w-6 h-6 text-primary" />
        <div>
          <div className="font-crimson text-lg text-foreground">Pack Vivant — Domaine de la Source</div>
          <div className="text-xs text-muted-foreground">Généré le 12 mars 2026 · 47 espèces · 3 sources fusionnées</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { ext: 'PDF', label: 'Rapport client stylisé' },
          { ext: 'XLSX', label: 'Analyse tableur' },
          { ext: 'CSV', label: 'Data brute' },
          { ext: 'GeoJSON', label: 'Points SIG' },
          { ext: 'KML', label: 'Google Earth' },
          { ext: 'ZIP', label: 'Photos + EXIF' },
        ].map((f) => (
          <div
            key={f.ext}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30"
          >
            <span className="text-[10px] font-mono font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded">
              {f.ext}
            </span>
            <span className="text-xs text-foreground/80">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  </MockBrowser>
);

const DemoChatbot: React.FC = () => (
  <MockBrowser title="/mon-espace">
    <div className="p-5 bg-card space-y-3">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted/50 px-4 py-2.5 text-sm text-foreground/90">
          Sur cette parcelle j'observe 47 espèces dont 8 mellifères. Pour une haie brise-vent nourricière côté nord, je conseillerais un mélange <em>Cornus sanguinea</em> + <em>Prunus spinosa</em> — cohérent avec votre pool floristique actuel.
        </div>
      </div>
      <div className="flex items-start gap-2 flex-row-reverse">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-xs">👤</div>
        <div className="flex-1 rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-2.5 text-sm text-foreground/90 text-right">
          Et pour retenir l'eau côté sud ?
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground italic pl-10">
        🌿 IA géo-contextuelle · voit l'écran filtré + les 47 espèces observées
      </div>
    </div>
  </MockBrowser>
);

const DemoSection: React.FC = () => (
  <section id="demo" className="py-24 md:py-32 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-mono">
          Démonstration
        </div>
        <h2 className="font-crimson text-4xl md:text-5xl text-foreground mb-4">
          La plateforme en action.
        </h2>
        <p className="text-muted-foreground">
          Quatre vues qui remplacent 30 slides de commercial.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="text-sm font-mono text-primary uppercase tracking-wider">01 · Carte diagnostic</div>
          <DemoMap />
          <p className="text-sm text-muted-foreground px-1">
            Chaque point = une espèce géolocalisée par un marcheur. Le rayon suit le site du client.
          </p>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-mono text-primary uppercase tracking-wider">02 · Fiche espèce enrichie</div>
          <DemoSpecies />
          <p className="text-sm text-muted-foreground px-1">
            Fonctions écologiques auto-classifiées par IA. Le paysagiste voit ce qui joue sur son site.
          </p>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-mono text-primary uppercase tracking-wider">03 · Pack Vivant exportable</div>
          <DemoPack />
          <p className="text-sm text-muted-foreground px-1">
            Livrable RSE opposable en un clic. Cinq formats — un pour chaque interlocuteur du projet.
          </p>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-mono text-primary uppercase tracking-wider">04 · Chatbot géo-contextuel</div>
          <DemoChatbot />
          <p className="text-sm text-muted-foreground px-1">
            L'IA voit l'écran filtré. Elle raisonne <em>sur les espèces du site</em>, pas dans le vide.
          </p>
        </div>
      </div>
    </div>
  </section>
);

/* -------------------- Le "+" IA disruptif -------------------- */

const AiDifferentiators: React.FC = () => {
  const items = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'IA d\'identification & classification',
      desc: 'iconic_taxon (plantes, insectes, oiseaux, champignons) + 12 tags écologiques auto-classifiés. Le stagiaire VDT ne lit plus une liste latine, il lit un écosystème fonctionnel.',
      badge: 'Lovable AI Gateway',
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'Chatbot géo-contextuel',
      desc: 'Le chatbot voit l\'écran filtré, les marches, les waypoints et le pool d\'espèces. Il conseille des palettes végétales cohérentes avec ce qui pousse déjà sur la parcelle.',
      badge: 'Screen-aware',
    },
    {
      icon: <Radar className="w-6 h-6" />,
      title: 'Diagnostic 5 km automatique',
      desc: 'Avant même le RDV client, un rapport biodiversité 5 km autour de la parcelle est généré. Argument commercial imparable qui prolonge l\'OAD de la formation.',
      badge: 'Moteur Dordonia',
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-mono">
            Le « + » IA
          </div>
          <h2 className="font-crimson text-4xl md:text-5xl text-foreground mb-4">
            Ce que <span className="italic text-primary">personne d'autre</span> ne fait.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-card/70 to-card/30 backdrop-blur-md p-7 overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-5">
                  {it.icon}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80 mb-2">
                  {it.badge}
                </div>
                <h3 className="font-crimson text-2xl text-foreground mb-3 leading-tight">{it.title}</h3>
                <p className="text-sm text-foreground/75 leading-relaxed">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------------- Storyboard parcours paysagiste ---------------------- */

const StoryboardSection: React.FC = () => {
  const steps = [
    { icon: <Radar className="w-5 h-5" />, title: 'Avant RDV', desc: 'Diagnostic 5 km auto autour de la parcelle client.' },
    { icon: <Compass className="w-5 h-5" />, title: 'Sur site', desc: 'Marche géolocalisée — chaque photo = une observation certifiée.' },
    { icon: <FileDown className="w-5 h-5" />, title: 'Restitution', desc: 'Pack Vivant PDF remis au client à chaud.' },
    { icon: <Palette className="w-5 h-5" />, title: 'Conception', desc: 'Palette végétale construite sur les fonctions écologiques observées.' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Suivi MSV', desc: 'Snapshots saisonniers — preuve continue de la démarche.' },
  ];

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-mono">
            Parcours terrain
          </div>
          <h2 className="font-crimson text-4xl md:text-5xl text-foreground">
            Cinq étapes. Un paysagiste.
            <br />
            <span className="italic text-primary">Un client convaincu.</span>
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center relative"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4 relative z-10 ring-4 ring-background">
                  {s.icon}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
                  Étape {i + 1}
                </div>
                <h3 className="font-crimson text-lg text-foreground mb-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ----------------------- Collaboration proposée ----------------------- */

const CollaborationSection: React.FC = () => {
  const models = [
    {
      title: 'Module complémentaire',
      desc: 'Accès MDV offert aux stagiaires VDT — 6 mois d\'usage terrain post-formation, avec 3 marches diagnostic incluses.',
      tag: 'Prolongement pédagogique',
    },
    {
      title: 'Co-marquage territorial',
      desc: 'Marches diagnostic labellisées « VDT × MDV » sur 3-5 territoires pilotes. Communication conjointe, données mutualisées.',
      tag: 'Ancrage terrain',
    },
    {
      title: 'OAD digital intégré',
      desc: 'Les matrices diagnostic sol, l\'herbier bio-indicatrices et le deck d\'arguments économiques deviennent des modules interactifs dans MDV.',
      tag: 'Livrable numérique',
    },
  ];

  return (
    <section id="collaboration" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-mono">
            Trois pistes concrètes
          </div>
          <h2 className="font-crimson text-4xl md:text-5xl text-foreground">
            Comment collaborer.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {models.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md p-7"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80 mb-3">
                {m.tag}
              </div>
              <h3 className="font-crimson text-2xl text-foreground mb-3 leading-tight">
                {m.title}
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">{m.desc}</p>
              <div className="mt-4 pt-4 border-t border-border/30">
                <CheckCircle2 className="w-4 h-4 text-primary inline mr-2" />
                <span className="text-xs text-muted-foreground">Modulable, contractualisable en 15 j.</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------- Closing ------------------------------- */

const ClosingSection: React.FC = () => (
  <section className="py-24 md:py-32 bg-gradient-to-b from-transparent to-emerald-950/30">
    <div className="max-w-3xl mx-auto px-6 text-center">
      <Quote className="w-10 h-10 text-primary/50 mx-auto mb-6" />
      <p className="font-crimson text-2xl md:text-3xl text-foreground italic leading-relaxed mb-6">
        « Ver de Terre Production forme les yeux et la main.
        <br />
        Les Marches du Vivant leur donnent une mémoire, une preuve
        <br />
        et une IA compagne — sur chaque parcelle, pour chaque client. »
      </p>
      <p className="text-sm text-muted-foreground mb-10">
        C'est cette continuité qui manque au marché du paysage aujourd'hui.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90"
          asChild
        >
          <a href="mailto:contact@la-frequence-du-vivant.com?subject=Offre%20VDT%20%C3%97%20MDV%20%E2%80%94%20Suite">
            Planifier une démo à VDT
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="/marches-du-vivant">Explorer la plateforme</a>
        </Button>
      </div>

      <div className="mt-16 text-xs text-muted-foreground font-mono">
        Document préparé pour Ver de Terre Production · La Fréquence du Vivant · 2026
      </div>
    </div>
  </section>
);

/* -------------------------------- Page -------------------------------- */

const OffreVdtMdv: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Offre VDT × MDV — Le prolongement digital IA de votre formation paysagère</title>
        <meta
          name="description"
          content="Les Marches du Vivant, compagnon digital & IA de la formation Ver de Terre Production « À la racine du paysage ». Diagnostic biodiversité, Pack Vivant RSE, chatbot géo-contextuel."
        />
        <meta property="og:title" content="Offre VDT × MDV — Le prolongement digital IA de votre formation paysagère" />
        <meta property="og:description" content="La plateforme qui prolonge votre e-learning sur le terrain client." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Hero />
        <ProofStrip />
        <MirrorSection />
        <DemoSection />
        <AiDifferentiators />
        <StoryboardSection />
        <CollaborationSection />
        <ClosingSection />
      </main>
    </>
  );
};

export default OffreVdtMdv;
