import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Leaf, Cpu, Users, Footprints, Map, TrendingUp,
  Printer, Share2, Calendar, ChevronRight, Sparkles, Eye, Shield, Heart
} from 'lucide-react';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const MarchesDuVivantExplorer = () => {
  const handlePrint = () => window.print();
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Devenez Marcheur du Vivant', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié dans le presse-papier');
      }
    } catch { /* user cancelled */ }
  };

  const piliers = [
    {
      icon: <Leaf className="w-7 h-7" />,
      titre: 'Géopoétique du Vivant',
      couleur: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      texte: "La marche n'est pas un sport, c'est une expérience du territoire. Chaque pas est un acte poétique et scientifique. Le marcheur ne collecte pas des données\u00A0: il écoute, il nomme, il témoigne."
    },
    {
      icon: <Cpu className="w-7 h-7" />,
      titre: 'Technologie Frugale',
      couleur: 'text-sky-700 bg-sky-50 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-700',
      texte: "Pas de surconsommation de données. L'application traite ce que le marcheur rapporte avec sobriété et précision. L'IA est au service du vivant, pas l'inverse."
    },
    {
      icon: <Users className="w-7 h-7" />,
      titre: 'Science Participative',
      couleur: 'text-amber-700 bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      texte: "Chaque observation rejoint une base de connaissance collective. Vous contribuez à la cartographie du vivant, pour les scientifiques et pour les générations futures."
    }
  ];

  const etapes = [
    {
      num: '01',
      icon: <Footprints className="w-6 h-6" />,
      titre: 'Marchez',
      texte: "Choisissez un sentier, une forêt, une rivière, un parc, ouvrez l'application, marchez. Chaque kilomètre vous rapporte des Fréquences."
    },
    {
      num: '02',
      icon: <Map className="w-6 h-6" />,
      titre: 'Explorez les zones blanches',
      texte: "Les zones pauvres en données rapportent jusqu'à 4× plus de Fréquences. Devenez éclaireur du vivant."
    },
    {
      num: '03',
      icon: <TrendingUp className="w-6 h-6" />,
      titre: 'Progressez',
      texte: "Maintenez votre série hebdomadaire, montez dans le classement, débloquez de nouveaux rôles."
    }
  ];

  const roles = [
    { nom: 'Marcheur', desc: 'Première marche, découverte de l\'écoute active', icon: <Footprints className="w-5 h-5" /> },
    { nom: 'Éclaireur', desc: '5 zones blanches explorées', icon: <Eye className="w-5 h-5" /> },
    { nom: 'Ambassadeur', desc: 'Formation + animation de groupes', icon: <Heart className="w-5 h-5" /> },
    { nom: 'Sentinelle', desc: 'Référent territorial, formateur', icon: <Shield className="w-5 h-5" /> },
  ];

  const calendrier = [
    { date: '8-9 mars 2026', label: 'Premier test', desc: 'Printemps des Poètes — comité réduit' },
    { date: '24-25 mai 2026', label: 'Second test', desc: 'Fête de la Nature — comité élargi' },
    { date: '21 juin 2026', label: 'Lancement officiel', desc: 'Solstice d\'été — ouverture à tous' },
  ];

  const zones = [
    { zone: 'Zone fréquentée', mult: '×1', bar: 'w-1/4' },
    { zone: 'Peu fréquentée', mult: '×2', bar: 'w-2/4' },
    { zone: 'Zone blanche', mult: '×4', bar: 'w-full' },
  ];

  return (
    <>
      <Helmet>
        <title>Devenez Marcheur du Vivant — Les Marches du Vivant</title>
        <meta name="description" content="Marchez, écoutez, témoignez. Rejoignez gratuitement les Marcheurs du Vivant et contribuez à la connaissance de la biodiversité." />
      </Helmet>

      <div className="min-h-screen bg-white text-gray-900 print-plaquette">

        {/* === NAV === */}
        <nav className="print:hidden sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to="/marches-du-vivant" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Les Marches du Vivant
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Partager">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Imprimer / PDF">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* === HERO === */}
        <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 mb-8">
              Gratuit · Ouvert à tous
            </span>
            <h1 className="font-crimson text-5xl md:text-7xl font-semibold leading-[1.05] mb-6 text-gray-900">
              Devenez Marcheur<br />du Vivant
            </h1>
            <p className="font-crimson text-xl md:text-2xl text-gray-500 italic leading-relaxed mb-8">
              « Chaque pas est un acte poétique et scientifique »
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto text-left">
              Vous n'allez pas collecter des données. Vous allez écouter, nommer, témoigner. Et chaque kilomètre parcouru enrichira votre connaissance du vivant.
            </p>
          </motion.div>
        </section>

        {/* === DIVIDER === */}
        <div className="max-w-5xl mx-auto px-6"><hr className="border-gray-100" /></div>

        {/* === PILIERS === */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="font-crimson text-3xl md:text-4xl font-semibold text-center mb-4">
              Pourquoi marcher pour le vivant&nbsp;?
            </motion.h2>
            <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto text-sm">
              Trois piliers fondateurs, un seul objectif&nbsp;: relier l'humain au territoire.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {piliers.map((p, i) => (
                <motion.div key={p.titre} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className={`rounded-2xl border p-8 ${p.couleur} print-card`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${p.iconBg}`}>
                    {p.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{p.titre}</h3>
                  <p className="text-sm leading-relaxed opacity-80 text-left">{p.texte}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === COMMENT CA MARCHE === */}
        <section className="py-16 md:py-24 px-6 bg-gray-50 print:bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="font-crimson text-3xl md:text-4xl font-semibold text-center mb-4">
              Comment ça marche&nbsp;?
            </motion.h2>
            <p className="text-center text-gray-500 mb-14 max-w-md mx-auto text-sm">
              Trois étapes pour devenir acteur de la connaissance du vivant.
            </p>
            <div className="space-y-8">
              {etapes.map((e, i) => (
                <motion.div key={e.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <span className="text-emerald-700 font-semibold text-lg">{e.num}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      {e.icon}
                      {e.titre}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-left">{e.texte}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === PROGRESSION === */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="font-crimson text-3xl md:text-4xl font-semibold text-center mb-4">
              Votre progression
            </motion.h2>
            <p className="text-center text-gray-500 mb-14 max-w-md mx-auto text-sm">
              Quatre rôles à incarner, du premier pas jusqu'à la transmission.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map((r, i) => (
                <motion.div key={r.nom} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className="text-center p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow print-card">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                    {r.icon}
                  </div>
                  <h4 className="font-semibold text-base mb-1">{r.nom}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                  {i < roles.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 mx-auto mt-3 hidden md:block print:hidden" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === ZONES BLANCHES === */}
        <section className="py-16 md:py-24 px-6 bg-gray-50 print:bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="font-crimson text-3xl md:text-4xl font-semibold text-center mb-4">
              Les zones blanches
            </motion.h2>
            <p className="text-center text-gray-500 mb-6 max-w-lg mx-auto text-sm">
              Le cœur du défi
            </p>
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              className="text-gray-600 text-base leading-relaxed max-w-2xl mx-auto mb-12 text-left">
              Les zones blanches sont des territoires où la biodiversité n'a pas encore été écoutée. 
              Aucune donnée, aucun témoignage. En vous y rendant, vous devenez le premier éclaireur. 
              Et vos Fréquences sont multipliées.
            </motion.p>
            <div className="max-w-md mx-auto space-y-4">
              {zones.map((z, i) => (
                <motion.div key={z.zone} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 2}
                  className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-36 text-right">{z.zone}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div className={`h-full ${z.bar} bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-end pr-3`}>
                      <span className="text-xs font-bold text-white">{z.mult}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === CALENDRIER === */}
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className="font-crimson text-3xl md:text-4xl font-semibold text-center mb-4">
              Calendrier de lancement
            </motion.h2>
            <p className="text-center text-gray-500 mb-14 max-w-md mx-auto text-sm">
              Trois temps forts pour construire ensemble.
            </p>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-emerald-200 print:bg-gray-300" />
              <div className="space-y-10">
                {calendrier.map((c, i) => (
                  <motion.div key={c.date} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                    className="flex gap-6 items-start relative">
                    <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center z-10">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-emerald-700" />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">{c.date}</p>
                      <h4 className="font-semibold text-lg mb-0.5">{c.label}</h4>
                      <p className="text-sm text-gray-500">{c.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === CTA FINAL === */}
        <section className="py-20 md:py-28 px-6 bg-emerald-50 print:bg-white print:border-t print:border-gray-200">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-6" />
              <h2 className="font-crimson text-3xl md:text-4xl font-semibold mb-4">
                Rejoignez les premiers<br />Marcheurs du Vivant
              </h2>
              <p className="text-gray-600 mb-8 text-sm">
                Gratuit · Intergénérationnel · Ouvert à tous
              </p>
              <a
                href="https://la-frequence-du-vivant.lovable.app/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-200 print:shadow-none print:border print:border-gray-400 print:bg-white print:text-gray-900"
              >
                Rejoindre l'aventure
                <ChevronRight className="w-4 h-4" />
              </a>
              <p className="mt-6 text-xs text-gray-400">
                la-frequence-du-vivant.lovable.app/contact
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantExplorer;
